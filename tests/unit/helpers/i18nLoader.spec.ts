/**
 * i18nLoader Unit Tests
 * 
 * Tests the internationalization loader functionality including initialization,
 * translation functions, and integration with express-validator.
 * 
 * Testing Level: Unit
 * Component: Helper
 * Dependencies: i18next, fs
 */

import { describe, it, beforeEach, afterEach, before, after } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import fs from 'node:fs';
import path from 'node:path';
import {
  initializeI18nextSync,
  i18next,
  t,
  nunjucksT
} from '#src/scripts/helpers/i18nLoader.js';

describe('i18nLoader', () => {
  let consoleWarnStub: sinon.SinonStub;
  let consoleErrorStub: sinon.SinonStub;
  let readFileSyncStub: sinon.SinonStub;

  before(() => {
    consoleWarnStub = sinon.stub(console, 'warn');
    consoleErrorStub = sinon.stub(console, 'error');
  });

  after(() => {
    sinon.restore();
  });

  describe.skip('initializeI18nextSync', () => {
    beforeEach(() => {
      readFileSyncStub = sinon.stub(fs, 'readFileSync');
    });

    afterEach(() => {
      readFileSyncStub.restore();
    });

    it('should initialize i18next with locale data when file exists', () => {
      // Mock the locale file content
      const mockLocaleData = {
        common: { back: 'Back' },
        forms: { name: { validationError: { notEmpty: 'Enter your full name' } } }
      };
      readFileSyncStub.returns(JSON.stringify(mockLocaleData));

      initializeI18nextSync();

      expect(readFileSyncStub.called).to.be.true;
      // i18next should be initialized (we can test by calling t function)
      expect(typeof i18next.t).to.equal('function');
    });

    it('should handle file not found gracefully', () => {
      readFileSyncStub.throws(new Error('File not found'));

      initializeI18nextSync();

      expect(consoleWarnStub.called).to.be.true;
      expect(typeof i18next.t).to.equal('function');
    });

    it('should handle invalid JSON gracefully', () => {
      readFileSyncStub.returns('invalid json');

      initializeI18nextSync();

      expect(consoleWarnStub.called).to.be.true;
      expect(typeof i18next.t).to.equal('function');
    });

    it('should handle general initialization errors', () => {
      sinon.stub(path, 'join').throws(new Error('Path error'));

      initializeI18nextSync();

      expect(consoleErrorStub.calledWithMatch('Failed to initialize i18next synchronously:')).to.be.true;
      expect(typeof i18next.t).to.equal('function');
    });
  });

  describe('translation functions', () => {
    let i18nextStub: sinon.SinonStub;

    before(() => {
      // Initialize i18next for tests
      initializeI18nextSync();
      
      // Stub i18next methods
      i18nextStub = sinon.stub(i18next, 't');

      // Setup return values for our test cases
      i18nextStub.withArgs('common.back').returns('Back');
      i18nextStub.withArgs('forms.name.validationError.notEmpty').returns('Enter your full name');
      i18nextStub.withArgs('greeting', { name: 'John' }).returns('Hello John');
      i18nextStub.withArgs('nonexistent.key').returns('nonexistent.key');
    });

    after(() => {
      i18nextStub.restore();
    });

    describe('t', () => {
      it('should return translated text for valid keys', () => {
        expect(t('common.back')).to.equal('Back');
      });

      it('should return translated text for form validation keys', () => {
        expect(t('forms.name.validationError.notEmpty')).to.equal('Enter your full name');
      });

      it('should handle interpolation', () => {
        expect(t('greeting', { name: 'John' })).to.equal('Hello John');
      });

      it('should return key when translation not found', () => {
        expect(t('nonexistent.key')).to.equal('nonexistent.key');
      });

      it('should handle errors gracefully', () => {
        i18nextStub.throws(new Error('Translation error'));
        const result = t('test.key');
        expect(result).to.equal('test.key');
        expect(consoleWarnStub.calledWithMatch('i18next not initialized when translating: test.key')).to.be.true;
      });
    });

    describe('nunjucksT', () => {
      it('should return same result as t function', () => {
        expect(nunjucksT('common.back')).to.equal(t('common.back'));
      });
    });
  });
});