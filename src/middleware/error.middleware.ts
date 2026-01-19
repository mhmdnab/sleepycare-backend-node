import { Request, Response, NextFunction } from 'express';

export class HttpException extends Error {
  statusCode: number;
  detail: string;

  constructor(statusCode: number, detail: string) {
    super(detail);
    this.statusCode = statusCode;
    this.detail = detail;
  }
}

export function errorHandler(
  err: Error | HttpException,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof HttpException) {
    return res.status(err.statusCode).json({ detail: err.detail });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({ detail: 'Internal server error' });
}
