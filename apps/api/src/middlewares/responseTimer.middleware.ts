import { Request, Response, NextFunction } from 'express';

export function responseTimerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime();
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const originalWriteHead = res.writeHead;

  res.writeHead = function (
    this: Response,
    statusCode: number,
    ...args: unknown[]
  ): Response {
    const diff = process.hrtime(start);
    const durationMs = (diff[0] * 1e9 + diff[1]) / 1e6;
    res.setHeader('X-Response-Time-Ms', durationMs.toFixed(2));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return (originalWriteHead as (...args: unknown[]) => Response).apply(this, [statusCode, ...args]);
  } as unknown as typeof res.writeHead;

  next();
}
