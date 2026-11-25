/**
 * @description Tests for environment utilities
 */

import { expect } from 'chai';
import {
  isDevelopment,
  isProduction,
  isTest
} from '#src/scripts/helpers/environmentUtils.js';

describe('Environment Utilities', () => {
  let originalNodeEnv: string | undefined;

  before(() => {
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    // Reset NODE_ENV to original after each test
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('isDevelopment()', () => {
    it('returns true in development or undefined', () => {
      process.env.NODE_ENV = 'development';
      expect(isDevelopment()).to.be.true;

      delete process.env.NODE_ENV;
      expect(isDevelopment()).to.be.true;
    });

    it('returns false otherwise', () => {
      process.env.NODE_ENV = 'production';
      expect(isDevelopment()).to.be.false;

      process.env.NODE_ENV = 'test';
      expect(isDevelopment()).to.be.false;
    });
  });

  describe('isProduction()', () => {
    it('returns true in production', () => {
      process.env.NODE_ENV = 'production';
      expect(isProduction()).to.be.true;
    });

    it('returns false otherwise', () => {
      process.env.NODE_ENV = 'development';
      expect(isProduction()).to.be.false;

      process.env.NODE_ENV = 'test';
      expect(isProduction()).to.be.false;

      delete process.env.NODE_ENV;
      expect(isProduction()).to.be.false;
    });
  });

  describe('isTest()', () => {
    it('returns true in test', () => {
      process.env.NODE_ENV = 'test';
      expect(isTest()).to.be.true;
    });

    it('returns false otherwise', () => {
      process.env.NODE_ENV = 'development';
      expect(isTest()).to.be.false;

      process.env.NODE_ENV = 'production';
      expect(isTest()).to.be.false;

      delete process.env.NODE_ENV;
      expect(isTest()).to.be.false;
    });
  });
});