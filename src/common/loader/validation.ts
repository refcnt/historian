import type { ZodType } from 'zod'
import { ParseError } from './errors'

/**
 * Isolation boundary around the validation library.
 *
 * The rest of the pipeline (pipeline.ts, build.ts, map registry) depends ONLY on
 * this `Validator<T>` interface — never on zod directly. To swap zod for another
 * library, reimplement `fromZod` here and rewrite the per-map `schema.ts` files;
 * nothing else changes.
 */
export interface Validator<T> {
  validate(doc: unknown): T
}

export function fromZod<T>(schema: ZodType<T>, label: string): Validator<T> {
  return {
    validate(doc: unknown): T {
      const result = schema.safeParse(doc)
      if (!result.success) {
        const details = result.error.issues
          .map(i => `${i.path.join('.') || '<root>'}: ${i.message}`)
          .join('; ')
        throw new ParseError(`Invalid ${label} document — ${details}`)
      }
      return result.data
    },
  }
}
