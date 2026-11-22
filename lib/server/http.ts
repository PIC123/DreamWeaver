import 'server-only';
import { NextResponse } from 'next/server';
import { MissingEnvError } from '@/lib/env.server';

/** An error whose message is safe to show to the person using the app. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function errorResponse(err: unknown): NextResponse {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof MissingEnvError) {
    console.error(err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
  console.error('Unhandled API error:', err);
  return NextResponse.json({ error: 'Something went wrong on our side.' }, { status: 500 });
}

/** Wraps a route handler so thrown errors become tidy JSON responses. */
export function route<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, 'The request body was not valid JSON.');
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: string) => UUID.test(value);
