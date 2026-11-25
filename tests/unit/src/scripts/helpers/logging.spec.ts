/**
 * @description Tests for correlation IDs and request logging
 */

import { expect } from 'chai';
import express from 'express';
import request from 'supertest';
import {
  correlationIdMiddleware,
  getCorrelationId,
  CORRELATION_ID_HEADER,
} from '#middleware/correlationIdMiddleware.js';
import { stripQuery, requestLogLevel } from '#src/scripts/helpers/logging.js';

describe('correlationIdMiddleware', () => {
  const app = express();
  app.use(correlationIdMiddleware);
  app.get('/', (_req, res) => {
    res.send(getCorrelationId());
  });

  it('generates a correlation ID and returns it in the response header', async () => {
    const response = await request(app).get('/');
    const header = response.headers[CORRELATION_ID_HEADER.toLowerCase()];

    expect(header).to.match(/^[0-9a-f-]{36}$/);
    expect(response.text).to.equal(header);
  });

  it('generates a different ID for each request', async () => {
    const first = await request(app).get('/');
    const second = await request(app).get('/');

    expect(first.text).to.not.equal(second.text);
  });

  it('returns undefined outside a request', () => {
    expect(getCorrelationId()).to.be.undefined;
  });
});

describe('stripQuery', () => {
  it('removes the query string so query parameters are never logged', () => {
    expect(stripQuery('/search?name=Jane+Doe')).to.equal('/search');
    expect(stripQuery('/users/1')).to.equal('/users/1');
    expect(stripQuery(undefined)).to.equal('');
  });
});

describe('requestLogLevel', () => {
  it('logs server errors at error, client errors at warn and everything else at info', () => {
    expect(requestLogLevel(200)).to.equal('info');
    expect(requestLogLevel(302)).to.equal('info');
    expect(requestLogLevel(404)).to.equal('warn');
    expect(requestLogLevel(500)).to.equal('error');
    expect(requestLogLevel(200, new Error('boom'))).to.equal('error');
  });
});
