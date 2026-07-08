import { Pool } from "pg";

let pool: Pool | null = null;

/**
 * Supabase connection strings include ?sslmode=require, which newer
 * pg-connection-string versions treat as an alias for verify-full (strict
 * cert-chain validation) and override the explicit `ssl` option below with.
 * Stripping it here lets our own ssl config (encrypt, don't verify chain)
 * apply instead.
 */
function withoutSslMode(connectionString: string): string {
  const url = new URL(connectionString);
  url.searchParams.delete("sslmode");
  return url.toString();
}

/**
 * Lazy, shared connection pool over POSTGRES_URL (Supabase's pooled/Supavisor
 * connection string, suited for application runtime queries). Returns null
 * rather than throwing when it isn't configured, so callers can degrade
 * gracefully in local dev and pre-provisioned deploys.
 */
export function getPool(): Pool | null {
  if (!process.env.POSTGRES_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: withoutSslMode(process.env.POSTGRES_URL),
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}
