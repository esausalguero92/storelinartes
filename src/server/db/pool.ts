import "server-only";
import pg, { type CustomTypesConfig, type Pool, type PoolClient, type PoolConfig, type QueryResult, type QueryResultRow } from "pg";
import { getEnv } from "@/server/env";

/**
 * Pool de conexiones a Postgres (Supabase).
 *
 * Reglas de seguridad de esta capa:
 *  - TODAS las consultas usan placeholders `$1, $2…` (consultas parametrizadas).
 *    Nunca se concatena texto del usuario dentro del SQL.
 *  - Las consultas parametrizadas de Postgres no admiten varias sentencias:
 *    un input no puede encadenar consultas.
 *  - Conexión siempre cifrada (TLS). Si se define DATABASE_CA_CERT se verifica
 *    además el certificado del servidor contra la CA de Supabase.
 *  - Las credenciales solo vienen de variables de entorno del servidor.
 *  - La app se conecta directo a Postgres (no usa la API REST de Supabase ni
 *    llaves anon/service_role). Las tablas tienen RLS activado sin políticas,
 *    así que la API pública de Supabase no puede leerlas (ver db/schema.sql).
 */

/** Cualquier cosa que pueda ejecutar una consulta: el pool o un cliente en transacción. */
export interface Queryable {
  query<R extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<R>>;
}
export type DbClient = PoolClient;

// BIGINT (int8) → number. Los ids y contadores de esta app están muy por debajo de 2^53.
const types: CustomTypesConfig = {
  getTypeParser: ((oid: number, format: "text" | "binary") =>
    oid === pg.types.builtins.INT8
      ? (v: string) => Number(v)
      : pg.types.getTypeParser(oid, format as "text")) as CustomTypesConfig["getTypeParser"],
};

const globalForPool = globalThis as unknown as { __dbPool?: Pool };

function sslConfig(): PoolConfig["ssl"] {
  const env = getEnv();
  if (!env.DATABASE_SSL) return false;
  const ca = env.DATABASE_CA_CERT.replace(/\\n/g, "\n").trim();
  return ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false };
}

export function getPool(): Pool {
  if (globalForPool.__dbPool) return globalForPool.__dbPool;
  const env = getEnv();

  const base: PoolConfig = {
    max: 5, // pocas conexiones: el pooler de Supabase tiene un límite por proyecto
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 8_000,
    statement_timeout: 15_000,
    application_name: "linartes-web",
    ssl: sslConfig(),
    types,
  };

  let config: PoolConfig;
  if (env.DATABASE_URL) {
    // El parámetro sslmode de la URL se ignora: el TLS lo controla sslConfig().
    const url = new URL(env.DATABASE_URL);
    url.searchParams.delete("sslmode");
    config = { ...base, connectionString: url.toString() };
  } else {
    config = {
      ...base,
      host: env.DATABASE_HOST,
      port: env.DATABASE_PORT,
      user: env.DATABASE_USER,
      password: env.DATABASE_PASSWORD,
      database: env.DATABASE_NAME,
    };
  }

  const pool = new pg.Pool(config);
  // Un cliente inactivo que pierde la conexión no debe tumbar el proceso.
  pool.on("error", () => undefined);
  globalForPool.__dbPool = pool;
  return pool;
}

/** Ejecuta `fn` dentro de una transacción; hace rollback ante cualquier error. */
export async function withTransaction<T>(fn: (conn: DbClient) => Promise<T>): Promise<T> {
  const conn = await getPool().connect();
  let broken = false;
  try {
    await conn.query("BEGIN");
    const result = await fn(conn);
    await conn.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await conn.query("ROLLBACK");
    } catch {
      broken = true; // conexión rota: el servidor ya descartó la transacción
    }
    throw err;
  } finally {
    conn.release(broken);
  }
}

/** Violación de llave única (unique_violation). */
export function isDuplicateKey(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23505";
}
