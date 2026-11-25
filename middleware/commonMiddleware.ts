import type { Application } from 'express';
import express from 'express';
import bodyParser from 'body-parser';
import config from '../config.js';
import { httpLogger } from '#src/scripts/helpers/logging.js';
import { correlationIdMiddleware } from './correlationIdMiddleware.js';

/**
 * Sets up common middlewares for the given Express application.
 *
 * @param {Application} app - The Express application instance.
 * @returns {void} Sets up various middleware on the provided app instance.
 */
export const setupMiddlewares = (app: Application): void => {
  // Set up correlation ID middleware early so every request and log line gets a correlation ID
  app.use(correlationIdMiddleware);

  // Set up request logging
  app.use(httpLogger);

  // Parses URL-encoded bodies (form submissions)
  app.use(bodyParser.urlencoded({ extended: true }));

  // Serve static files from the specified public directory
  app.use(express.static(config.paths.static));

  // Parses JSON request bodies
  app.use(express.json());

  // Parses URL-encoded bodies
  app.use(express.urlencoded({ extended: false }));
};
