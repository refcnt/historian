export type Result<T> = { ok: true; value: T } | { ok: false; error: string }

export const ok  = <T>(value: T): Result<T>       => ({ ok: true,  value })
export const err = <T = never>(e: string): Result<T> => ({ ok: false, error: e })

export function map<T, U>(
  fn: (value: T) => U,
): (result: Result<T>) => Result<U> {
  return result => result.ok ? ok(fn(result.value)) : (result as unknown as Result<U>)
}

export function andThen<T, U>(
  fn: (value: T) => Result<U>,
): (result: Result<T>) => Result<U> {
  return result => result.ok ? fn(result.value) : (result as unknown as Result<U>)
}

export async function pipe<T>(
  start: Promise<T>,
  ...fns: Array<(r: Result<any>) => Result<any>>
): Promise<Result<any>> {
  let result: Result<any>
  try   { result = ok(await start) }
  catch (e) { result = err(String(e)) }
  for (const fn of fns) result = fn(result)
  return result
}
