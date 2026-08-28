import { sql } from '@vercel/postgres'

// Thin re-export so every route imports the same tagged-template client.
// @vercel/postgres reads POSTGRES_URL (and friends) from the environment
// automatically — set up by Vercel the moment a Postgres store is attached
// to the project, no manual wiring needed.
//
// NOTE: @vercel/postgres is in maintenance mode — Vercel's own Postgres
// offering now runs on Neon under the hood. A store attached through the
// dashboard still injects the classic POSTGRES_URL vars for backward
// compatibility, but if you provision a database straight from the Vercel
// Marketplace (or a plain Neon project) you may only get DATABASE_URL. This
// alias keeps both paths working without touching every route.
if (!process.env.POSTGRES_URL && process.env.DATABASE_URL) {
  process.env.POSTGRES_URL = process.env.DATABASE_URL
}

export { sql }

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function notFound(what: string): never {
  throw new ApiError(404, `${what} não encontrado.`)
}
