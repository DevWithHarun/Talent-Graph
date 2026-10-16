import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

export const validateBody = (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const error = new Error('Validation failed');
    (error as Error & { status: number }).status = 400;
    (error as Error & { details: unknown }).details = result.error.issues;
    return next(error);
  }

  req.body = result.data;
  return next();
};
