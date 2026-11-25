import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';

interface RequestContext {
  correlationId: string;
}

/** Header used to return the correlation ID */
export const CORRELATION_ID_HEADER = 'X-Correlation-ID';

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Middleware to generate a correlation ID for each request, store it for the request's lifetime
 * and return it in the response header.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {void}
 */
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const context: RequestContext = {
    correlationId: randomUUID(),
  };

  res.setHeader(CORRELATION_ID_HEADER, context.correlationId);

  asyncLocalStorage.run(context, () => {
    next();
  });
}

/**
 * Get the current request context
 * @returns {RequestContext | undefined} The current request context
 */
export function getRequestContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}

/**
 * Get the correlation ID for the current request
 * @returns {string | undefined} The correlation ID
 */
export function getCorrelationId(): string | undefined {
  return getRequestContext()?.correlationId;
}
