import { pino } from 'pino';
import { pinoHttp } from 'pino-http';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { getCorrelationId } from '#middleware/correlationIdMiddleware.js';
import { isDevelopment } from '#src/scripts/helpers/environmentUtils.js';

const STDOUT_FD = 1;
const PATH_INDEX = 0;
const RESPONSE_TIME_DECIMALS = 2;
const HTTP_CLIENT_ERROR = 400;
const HTTP_SERVER_ERROR = 500;

/**
 * Remove the query string from a URL so query parameters, which can contain personal data, are never logged.
 * @param {string | undefined} url - Request URL
 * @returns {string} URL path only
 */
export function stripQuery(url: string | undefined): string {
  return (url ?? '').split('?')[PATH_INDEX];
}

/**
 * Log level for a completed request: error for 5xx, warn for 4xx, info otherwise.
 * Keeps server errors at ERROR so alerts and searches on level find them.
 * @param {number} statusCode - Response status code
 * @param {Error | undefined} err - Error raised while handling the request
 * @returns {'error' | 'warn' | 'info'} Log level
 */
export function requestLogLevel(statusCode: number, err?: Error): 'error' | 'warn' | 'info' {
  if (err !== undefined || statusCode >= HTTP_SERVER_ERROR) {
    return 'error';
  }
  return statusCode >= HTTP_CLIENT_ERROR ? 'warn' : 'info';
}

/**
 * Centralised logger with automatic correlation ID injection.
 *
 * - Structured JSON with ISO timestamps and uppercase levels
 * - `debug` level in development only, `info` everywhere else
 * - Correlation ID added to every log line inside a request
 * - Pretty-printed in development
 */
export const logger = pino(
  {
    level: isDevelopment() ? 'debug' : 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    base: null,
    formatters: {
      /**
       * Format log level to uppercase
       * @param {string} label - The log level label from pino
       * @returns {object} Object with uppercase level
       */
      level: (label: string) => ({ level: label.toUpperCase() }),
    },
    /**
     * Add correlation ID to every log from the request context
     * @returns {object} Object containing correlationId if available, empty object otherwise
     */
    mixin: () => {
      const correlationId = getCorrelationId();
      return correlationId !== undefined ? { correlationId } : {};
    },
  },
  isDevelopment()
    ? pino.transport({ target: 'pino-pretty', options: { colorize: true } })
    : pino.destination({ fd: STDOUT_FD, sync: true }),
);

export const httpLogger = pinoHttp({
  logger,
  /**
   * Pick the log level from the response status.
   * @param {IncomingMessage} req - The incoming request
   * @param {ServerResponse} res - The server response
   * @param {Error | undefined} err - Error raised while handling the request
   * @returns {string} Log level
   */
  customLogLevel: (req: IncomingMessage, res: ServerResponse, err?: Error) => requestLogLevel(res.statusCode, err),
  autoLogging: {
    /**
     * Skip logging for static asset requests.
     * @param {IncomingMessage} req - The incoming request
     * @returns {boolean} True to skip logging
     */
    ignore: (req: IncomingMessage) => {
      const path = stripQuery(req.url);
      return path.startsWith('/assets') || path.startsWith('/js') || path.startsWith('/css');
    },
  },
  /**
   * Message for completed requests.
   * @param {IncomingMessage} req - The incoming request
   * @param {ServerResponse} res - The server response
   * @param {number} responseTime - Time taken in milliseconds
   * @returns {string} Log message
   */
  customSuccessMessage: (req: IncomingMessage, res: ServerResponse, responseTime: number) =>
    `${req.method} ${stripQuery(req.url)} ${res.statusCode} ${responseTime.toFixed(RESPONSE_TIME_DECIMALS)} ms`,
  /**
   * Message for failed requests.
   * @param {IncomingMessage} req - The incoming request
   * @param {ServerResponse} res - The server response
   * @returns {string} Log message
   */
  customErrorMessage: (req: IncomingMessage, res: ServerResponse) =>
    `${req.method} ${stripQuery(req.url)} ${res.statusCode} failed`,
  serializers: {
    /**
     * Log only the method and path of the request.
     * @param {object} req - Serialised request
     * @param {string} req.method - HTTP method
     * @param {string} req.url - Request URL
     * @returns {object} Minimal request fields
     */
    req: (req: { method: string; url: string }) => ({ method: req.method, url: stripQuery(req.url) }),
    /**
     * Log only the status code of the response.
     * @param {object} res - Serialised response
     * @param {number} res.statusCode - HTTP status code
     * @returns {object} Minimal response fields
     */
    res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
  },
});
