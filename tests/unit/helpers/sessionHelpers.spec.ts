/**
 * Session Helpers Unit Tests
 * 
 * Tests the session management utility functions for form data storage and retrieval.
 * Covers session data operations, form data comparison, and cleanup utilities.
 * 
 * Testing Level: Unit
 * Component: sessionHelpers
 * Dependencies: express-session types
 */

import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import type { Request } from 'express';
import {
  storeSessionData,
  getSessionData,
  clearSessionData,
  clearAllOriginalFormData,
  storeOriginalFormData
} from '#src/scripts/helpers/sessionHelpers.js';

// Mock request factory with session
function createMockRequest(sessionData: Record<string, any> = {}): Request {
  return {
    session: { ...sessionData }
  } as Request;
}

describe('Session Helpers', () => {
  let mockRequest: Request;

  beforeEach(() => {
    mockRequest = createMockRequest();
  });

  describe('storeSessionData()', () => {
    it('stores data under specified namespace', () => {
      const testData = { name: 'John', email: 'john@example.com' };
      
      storeSessionData(mockRequest, 'user', testData);
      
      expect(mockRequest.session.user).to.deep.equal(testData);
    });

    it('overwrites existing data in namespace', () => {
      const initialData = { name: 'Jane', age: '25' };
      const newData = { name: 'John', email: 'john@example.com' };
      
      mockRequest.session.user = initialData;
      storeSessionData(mockRequest, 'user', newData);
      
      expect(mockRequest.session.user).to.deep.equal(newData);
      expect(mockRequest.session.user).to.not.have.property('age');
    });

    it('handles empty data objects', () => {
      const emptyData = {};
      
      storeSessionData(mockRequest, 'empty', emptyData);
      
      expect(mockRequest.session.empty).to.deep.equal({});
    });

    it('stores data in multiple namespaces independently', () => {
      const userData = { name: 'John' };
      const formData = { field1: 'value1' };
      
      storeSessionData(mockRequest, 'user', userData);
      storeSessionData(mockRequest, 'form', formData);
      
      expect(mockRequest.session.user).to.deep.equal(userData);
      expect(mockRequest.session.form).to.deep.equal(formData);
    });

    it('handles special characters in namespace names', () => {
      const testData = { test: 'value' };
      const specialNamespaces = [
        'namespace-with-dashes',
        'namespace_with_underscores',
        'namespaceWithCamelCase',
        'namespace123',
        'personOriginal'
      ];
      
      specialNamespaces.forEach(namespace => {
        storeSessionData(mockRequest, namespace, testData);
        expect(mockRequest.session[namespace]).to.deep.equal(testData);
      });
    });

    it('handles data with special string values', () => {
      const specialData = {
        emptyString: '',
        whitespace: '   ',
        newlines: '\\n\\r\\t',
        quotes: "'single' \"double\"",
        numbers: '123',
        booleans: 'true',
        unicode: 'café résumé 🎉'
      };
      
      storeSessionData(mockRequest, 'special', specialData);
      
      expect(mockRequest.session.special).to.deep.equal(specialData);
    });
  });

  describe('getSessionData()', () => {
    it('retrieves data from specified namespace', () => {
      const testData = { name: 'John', email: 'john@example.com' };
      mockRequest.session.user = testData;
      
      const result = getSessionData(mockRequest, 'user');
      
      expect(result).to.deep.equal(testData);
    });

    it('returns null when namespace does not exist', () => {
      const result = getSessionData(mockRequest, 'nonexistent');
      
      expect(result).to.be.null;
    });

    it('returns null when namespace contains non-object value', () => {
      mockRequest.session.stringValue = 'just a string';
      mockRequest.session.numberValue = 123 as any;
      mockRequest.session.booleanValue = true as any;
      
      expect(getSessionData(mockRequest, 'stringValue')).to.be.null;
      expect(getSessionData(mockRequest, 'numberValue')).to.be.null;
      expect(getSessionData(mockRequest, 'booleanValue')).to.be.null;
    });

    it('returns null when namespace is undefined', () => {
      mockRequest.session.undefinedValue = undefined;
      
      const result = getSessionData(mockRequest, 'undefinedValue');
      
      expect(result).to.be.null;
    });

    it('retrieves empty objects correctly', () => {
      mockRequest.session.empty = {};
      
      const result = getSessionData(mockRequest, 'empty');
      
      expect(result).to.deep.equal({});
    });

    it('retrieves data independently from multiple namespaces', () => {
      const userData = { name: 'John' };
      const formData = { field1: 'value1' };
      
      mockRequest.session.user = userData;
      mockRequest.session.form = formData;
      
      expect(getSessionData(mockRequest, 'user')).to.deep.equal(userData);
      expect(getSessionData(mockRequest, 'form')).to.deep.equal(formData);
    });

    it('returns reference to session data (not deep copied)', () => {
      const originalData = { name: 'John', theme: 'dark' };
      mockRequest.session.user = originalData;
      
      const result = getSessionData(mockRequest, 'user');
      result!.name = 'Modified';
      
      // Note: Our implementation returns the actual reference, not a copy
      expect((mockRequest.session.user as Record<string, string>).name).to.equal('Modified');
    });
  });

  describe('clearSessionData()', () => {
    it('clears data from specified namespace', () => {
      mockRequest.session.user = { name: 'John' };
      mockRequest.session.form = { field1: 'value1' };
      
      clearSessionData(mockRequest, 'user');
      
      expect(mockRequest.session.user).to.be.undefined;
      expect(mockRequest.session.form).to.deep.equal({ field1: 'value1' });
    });

    it('does nothing when namespace does not exist', () => {
      clearSessionData(mockRequest, 'nonexistent');
      
      expect(mockRequest.session.nonexistent).to.be.undefined;
    });

    it('clears already undefined namespaces without error', () => {
      mockRequest.session.alreadyUndefined = undefined;
      
      expect(() => clearSessionData(mockRequest, 'alreadyUndefined')).to.not.throw();
      expect(mockRequest.session.alreadyUndefined).to.be.undefined;
    });

    it('handles multiple consecutive clears', () => {
      mockRequest.session.test = { data: 'value' };
      
      clearSessionData(mockRequest, 'test');
      clearSessionData(mockRequest, 'test');
      clearSessionData(mockRequest, 'test');
      
      expect(mockRequest.session.test).to.be.undefined;
    });
  });

  describe('clearAllOriginalFormData()', () => {
    it('clears all session keys containing "Original"', () => {
      mockRequest.session.userOriginal = { name: 'John' };
      mockRequest.session.formOriginal = { field1: 'value1' };
      mockRequest.session.thirdPartyOriginal = { external: 'data' };
      mockRequest.session.regularData = { keep: 'this' };
      mockRequest.session.user = { name: 'Current John' };
      
      clearAllOriginalFormData(mockRequest);
      
      expect(mockRequest.session.userOriginal).to.be.undefined;
      expect(mockRequest.session.formOriginal).to.be.undefined;
      expect(mockRequest.session.thirdPartyOriginal).to.be.undefined;
      expect(mockRequest.session.regularData).to.deep.equal({ keep: 'this' });
      expect(mockRequest.session.user).to.deep.equal({ name: 'Current John' });
    });

    it('handles case-sensitive "Original" matching', () => {
      mockRequest.session.userOriginal = { data: 'clear me' };
      mockRequest.session.useroriginal = { data: 'keep me' };
      mockRequest.session.USERORIGINAL = { data: 'keep me - no matching case' };
      mockRequest.session.originalUser = { data: 'keep me too - no matching case' };
      
      clearAllOriginalFormData(mockRequest);
      
      expect(mockRequest.session.userOriginal).to.be.undefined; // Contains "Original"
      expect(mockRequest.session.useroriginal).to.deep.equal({ data: 'keep me' }); // lowercase "original"
      expect(mockRequest.session.USERORIGINAL).to.deep.equal({ data: 'keep me - no matching case' }); // uppercase "ORIGINAL"
      expect(mockRequest.session.originalUser).to.deep.equal({ data: 'keep me too - no matching case' }); // lowercase "original"
    });

    it('does nothing when no Original keys exist', () => {
      mockRequest.session.user = { name: 'John' };
      mockRequest.session.form = { field1: 'value1' };
      
      clearAllOriginalFormData(mockRequest);
      
      expect(mockRequest.session.user).to.deep.equal({ name: 'John' });
      expect(mockRequest.session.form).to.deep.equal({ field1: 'value1' });
    });

    it('handles empty session', () => {
      expect(() => clearAllOriginalFormData(mockRequest)).to.not.throw();
      expect(Object.keys(mockRequest.session)).to.have.length(0);
    });

    it('handles sessions with only Original keys', () => {
      mockRequest.session.firstOriginal = { data: '1' };
      mockRequest.session.secondOriginal = { data: '2' };
      mockRequest.session.thirdOriginal = { data: '3' };
      
      clearAllOriginalFormData(mockRequest);
      
      expect(mockRequest.session.firstOriginal).to.be.undefined;
      expect(mockRequest.session.secondOriginal).to.be.undefined;
      expect(mockRequest.session.thirdOriginal).to.be.undefined;
    });

    it('handles mixed data types in Original keys', () => {
      mockRequest.session.objectOriginal = { data: 'object' };
      mockRequest.session.stringOriginal = 'string value';
      mockRequest.session.numberOriginal = 123 as any;
      mockRequest.session.booleanOriginal = true as any;
      
      clearAllOriginalFormData(mockRequest);
      
      expect(mockRequest.session.objectOriginal).to.be.undefined;
      expect(mockRequest.session.stringOriginal).to.be.undefined;
      expect(mockRequest.session.numberOriginal).to.be.undefined;
      expect(mockRequest.session.booleanOriginal).to.be.undefined;
    });
  });

  describe('storeOriginalFormData()', () => {
    it('converts and stores form data as strings', () => {
      const formData = {
        name: 'John',
        age: 25,
        active: true,
        score: 98.5,
        tags: ['javascript', 'typescript']
      };
      
      storeOriginalFormData(mockRequest, 'personOriginal', formData);
      
      expect(mockRequest.session.personOriginal).to.deep.equal({
        name: 'John',
        age: '25',
        active: 'true',
        score: '98.5',
        tags: 'javascript,typescript'
      });
    });

    it('handles null and undefined values as empty strings', () => {
      const formData = {
        nullValue: null,
        undefinedValue: undefined,
        emptyString: '',
        validString: 'test'
      };
      
      storeOriginalFormData(mockRequest, 'testOriginal', formData);
      
      expect(mockRequest.session.testOriginal).to.deep.equal({
        nullValue: '',
        undefinedValue: '',
        emptyString: '',
        validString: 'test'
      });
    });

    it('handles objects and arrays by calling toString()', () => {
      const formData = {
        simpleObject: { toString: () => 'custom string' },
        plainObject: { key: 'value' },
        array: [1, 2, 3],
        date: new Date('2024-01-01'),
        regex: /test/
      };
      
      storeOriginalFormData(mockRequest, 'complexOriginal', formData);
      
      const result = mockRequest.session.complexOriginal as Record<string, string>;
      expect(result.simpleObject).to.equal('custom string');
      expect(result.plainObject).to.equal('[object Object]');
      expect(result.array).to.equal('1,2,3');
      expect(result.date).to.include('2024');
      expect(result.regex).to.equal('/test/');
    });

    it('handles form data with date field format', () => {
      const dateFormData = {
        fullName: 'John Doe',
        'dateOfBirth-day': 15,
        'dateOfBirth-month': 6,
        'dateOfBirth-year': 1990,
        contactPreference: 'email'
      };
      
      storeOriginalFormData(mockRequest, 'personOriginal', dateFormData);
      
      expect(mockRequest.session.personOriginal).to.deep.equal({
        fullName: 'John Doe',
        'dateOfBirth-day': '15',
        'dateOfBirth-month': '6',
        'dateOfBirth-year': '1990',
        contactPreference: 'email'
      });
    });

    it('handles empty form data', () => {
      const emptyFormData = {};
      
      storeOriginalFormData(mockRequest, 'emptyOriginal', emptyFormData);
      
      expect(mockRequest.session.emptyOriginal).to.deep.equal({});
    });

    it('handles special string values', () => {
      const specialFormData = {
        whitespace: '   ',
        newlines: '\\n\\r\\t',
        quotes: "'single' \"double\"",
        unicode: 'café résumé 🎉',
        html: '<div>test</div>',
        zero: 0,
        falseValue: false
      };
      
      storeOriginalFormData(mockRequest, 'specialOriginal', specialFormData);
      
      expect(mockRequest.session.specialOriginal).to.deep.equal({
        whitespace: '   ',
        newlines: '\\n\\r\\t',
        quotes: "'single' \"double\"",
        unicode: 'café résumé 🎉',
        html: '<div>test</div>',
        zero: '0',
        falseValue: 'false'
      });
    });

    it('overwrites existing original data', () => {
      const initialData = { name: 'Jane', age: 25 };
      const newData = { name: 'John', email: 'john@example.com', active: true };
      
      storeOriginalFormData(mockRequest, 'userOriginal', initialData);
      storeOriginalFormData(mockRequest, 'userOriginal', newData);
      
      expect(mockRequest.session.userOriginal).to.deep.equal({
        name: 'John',
        email: 'john@example.com',
        active: 'true'
      });
      expect(mockRequest.session.userOriginal).to.not.have.property('age');
    });

    it('stores in different namespaces independently', () => {
      const userData = { name: 'John', age: 30 };
      const formData = { title: 'Mr', country: 'UK' };
      
      storeOriginalFormData(mockRequest, 'userOriginal', userData);
      storeOriginalFormData(mockRequest, 'formOriginal', formData);
      
      expect(mockRequest.session.userOriginal).to.deep.equal({
        name: 'John',
        age: '30'
      });
      expect(mockRequest.session.formOriginal).to.deep.equal({
        title: 'Mr',
        country: 'UK'
      });
    });

    it('handles symbols and functions gracefully', () => {
      const complexData = {
        symbol: Symbol('test'),
        func: () => 'test',
        normalValue: 'normal'
      };
      
      storeOriginalFormData(mockRequest, 'complexOriginal', complexData);
      
      const result = mockRequest.session.complexOriginal as Record<string, string>;
      expect(result.normalValue).to.equal('normal');
      expect(result.symbol).to.be.a('string'); // Symbol.toString() result
      expect(result.func).to.be.a('string');   // Function.toString() result
    });
  });

  describe('Integration scenarios', () => {
    it('supports typical form workflow', () => {
      // 1. Store original form data
      const originalData = {
        fullName: 'John Doe',
        contactPreference: 'email',
        priority: 'medium'
      };
      
      storeOriginalFormData(mockRequest, 'personOriginal', originalData);
      
      // 2. Store current form state
      const currentData = {
        fullName: 'John Smith',
        contactPreference: 'phone',
        priority: 'high'
      };
      
      storeSessionData(mockRequest, 'person', currentData);
      
      // 3. Verify both are stored independently
      expect(getSessionData(mockRequest, 'personOriginal')).to.deep.equal({
        fullName: 'John Doe',
        contactPreference: 'email',
        priority: 'medium'
      });
      
      expect(getSessionData(mockRequest, 'person')).to.deep.equal({
        fullName: 'John Smith',
        contactPreference: 'phone',
        priority: 'high'
      });
      
      // 4. Clear original data
      clearAllOriginalFormData(mockRequest);
      
      expect(getSessionData(mockRequest, 'personOriginal')).to.be.null;
      expect(getSessionData(mockRequest, 'person')).to.deep.equal({
        fullName: 'John Smith',
        contactPreference: 'phone',
        priority: 'high'
      });
    });

    it('handles multiple forms with original data', () => {
      const personalOriginal = { name: 'John', age: 30 };
      const addressOriginal = { street: '123 Main St', city: 'London' };
      const preferencesOriginal = { theme: 'dark', language: 'en' };
      
      storeOriginalFormData(mockRequest, 'personalOriginal', personalOriginal);
      storeOriginalFormData(mockRequest, 'addressOriginal', addressOriginal);
      storeOriginalFormData(mockRequest, 'preferencesOriginal', preferencesOriginal);
      
      // Store some current data too
      storeSessionData(mockRequest, 'currentUser', { id: '123' });
      
      // Clear all original data
      clearAllOriginalFormData(mockRequest);
      
      expect(getSessionData(mockRequest, 'personalOriginal')).to.be.null;
      expect(getSessionData(mockRequest, 'addressOriginal')).to.be.null;
      expect(getSessionData(mockRequest, 'preferencesOriginal')).to.be.null;
      expect(getSessionData(mockRequest, 'currentUser')).to.deep.equal({ id: '123' });
    });
  });
});