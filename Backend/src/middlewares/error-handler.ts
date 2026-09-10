import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const message = err instanceof Error ? err.message : 'Unexpected server error';
  const status = typeof (err as { status?: number }).status === 'number' ? (err as { status: number }).status : 500;

  res.status(status).json({
    ok: false,
    message,
    details: err instanceof Error && 'details' in err ? (err as { details?: unknown }).details : undefined,
  });
};
