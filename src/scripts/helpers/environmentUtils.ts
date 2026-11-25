/**
 * Environment Utilities
 *
 * Helper functions for checking the current environment and NODE_ENV.
 */

/**
 * Check if currently running in development mode
 * @returns {boolean} True if in development mode or NODE_ENV is undefined
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined;
}

/**
 * Check if currently running in production mode
 * @returns {boolean} True if in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if currently running in test mode
 * @returns {boolean} True if in test mode
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}
