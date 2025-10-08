/**
 * Data Transformation Helpers Unit Tests
 * 
 * Tests the data transformation utility functions for form processing and validation.
 * Covers type guards, data extraction, formatting, and safety utilities.
 * 
 * Testing Level: Unit
 * Component: dataTransformers
 * Dependencies: None (pure functions)
 */

import { describe, it } from 'mocha';
import { expect } from 'chai';
import {
  isRecord,
  hasProperty,
  capitaliseFirst,
  dateStringFromThreeFields,
  safeBodyString,
  extractFormFields
} from '#src/helpers/dataTransformers.js';

describe('Data Transformation Helpers', () => {
  
  describe('isRecord()', () => {
    it('returns true for plain objects', () => {
      expect(isRecord({ a: 1 })).to.be.true;
      expect(isRecord({})).to.be.true;
      expect(isRecord({ nested: { prop: 'value' } })).to.be.true;
    });

    it('returns false for null, arrays, functions, and primitives', () => {
      expect(isRecord(null)).to.be.false;
      expect(isRecord(undefined)).to.be.false;
      expect(isRecord([])).to.be.false;
      expect(isRecord([1, 2, 3])).to.be.false;
      expect(isRecord(() => {})).to.be.false;
      expect(isRecord(123)).to.be.false;
      expect(isRecord('test')).to.be.false;
      expect(isRecord(true)).to.be.false;
      expect(isRecord(false)).to.be.false;
    });

    it('returns true for special objects like Date and RegExp (which are technically objects)', () => {
      // Note: Our isRecord function identifies objects as records based on typeof === 'object' && not null && not array
      // RegExp and Date are both objects that pass this test
      expect(isRecord(new Date())).to.be.true; // Date objects are objects
      expect(isRecord(/test/)).to.be.true; // RegExp objects are also objects  
      expect(isRecord(new Error('test'))).to.be.true; // Error objects are objects
    });
  });

  describe('hasProperty()', () => {
    it('returns true if object has property', () => {
      expect(hasProperty({ foo: 123 }, 'foo')).to.be.true;
      expect(hasProperty({ bar: null }, 'bar')).to.be.true;
      expect(hasProperty({ baz: undefined }, 'baz')).to.be.true;
      expect(hasProperty({ nested: { prop: 'value' } }, 'nested')).to.be.true;
    });

    it('returns false if not a record or property missing', () => {
      expect(hasProperty(null, 'foo')).to.be.false;
      expect(hasProperty(undefined, 'foo')).to.be.false;
      expect(hasProperty({}, 'foo')).to.be.false;
      expect(hasProperty([], 'foo')).to.be.false;
      expect(hasProperty('string', 'foo')).to.be.false;
      expect(hasProperty(123, 'foo')).to.be.false;
      expect(hasProperty(true, 'foo')).to.be.false;
    });

    it('handles inherited properties correctly', () => {
      const obj = Object.create({ inherited: 'value' });
      obj.own = 'ownValue';
      
      expect(hasProperty(obj, 'own')).to.be.true;
      expect(hasProperty(obj, 'inherited')).to.be.true;
    });

    it('handles properties with special names', () => {
      const obj = {
        'property-with-dashes': 'value1',
        'property_with_underscores': 'value2',
        'property with spaces': 'value3',
        '123numeric': 'value4',
        '': 'empty string key'
      };
      
      expect(hasProperty(obj, 'property-with-dashes')).to.be.true;
      expect(hasProperty(obj, 'property_with_underscores')).to.be.true;
      expect(hasProperty(obj, 'property with spaces')).to.be.true;
      expect(hasProperty(obj, '123numeric')).to.be.true;
      expect(hasProperty(obj, '')).to.be.true;
    });
  });

  describe('capitaliseFirst()', () => {
    it('capitalises the first letter of each word', () => {
      expect(capitaliseFirst('hello world')).to.equal('Hello World');
      expect(capitaliseFirst('the quick brown fox')).to.equal('The Quick Brown Fox');
      expect(capitaliseFirst('ALREADY UPPERCASE')).to.equal('ALREADY UPPERCASE');
      expect(capitaliseFirst('mixed CaSe WoRdS')).to.equal('Mixed CaSe WoRdS');
    });

    it('handles single words', () => {
      expect(capitaliseFirst('hello')).to.equal('Hello');
      expect(capitaliseFirst('a')).to.equal('A');
      expect(capitaliseFirst('UPPERCASE')).to.equal('UPPERCASE');
    });

    it('handles edge cases', () => {
      expect(capitaliseFirst('')).to.equal('');
      expect(capitaliseFirst(' ')).to.equal(' ');
      expect(capitaliseFirst('  multiple  spaces  ')).to.equal('  Multiple  Spaces  ');
      expect(capitaliseFirst('123numeric')).to.equal('123numeric');
      expect(capitaliseFirst('special-chars_test')).to.equal('Special-Chars_test');
    });

    it('handles strings with punctuation', () => {
      expect(capitaliseFirst('hello, world!')).to.equal('Hello, World!');
      expect(capitaliseFirst("it's a beautiful day")).to.equal("It'S A Beautiful Day"); // Our regex capitalizes after apostrophes
      expect(capitaliseFirst('test.this.string')).to.equal('Test.This.String');
    });

    it('handles non-English characters', () => {
      expect(capitaliseFirst('café résumé')).to.equal('Café RéSumé'); // Our regex capitalizes after é
      expect(capitaliseFirst('naïve coöperation')).to.equal('NaïVe CoöPeration'); // Our regex capitalizes after special chars
    });
  });

  describe('dateStringFromThreeFields()', () => {
    it('formats valid date components correctly', () => {
      expect(dateStringFromThreeFields('1', '2', '2024')).to.equal('2024-02-01');
      expect(dateStringFromThreeFields('15', '12', '2023')).to.equal('2023-12-15');
      expect(dateStringFromThreeFields('31', '1', '2022')).to.equal('2022-01-31');
    });

    it('pads single digit days and months with zero', () => {
      expect(dateStringFromThreeFields('5', '3', '2024')).to.equal('2024-03-05');
      expect(dateStringFromThreeFields('9', '11', '2024')).to.equal('2024-11-09');
      expect(dateStringFromThreeFields('1', '1', '2024')).to.equal('2024-01-01');
    });

    it('handles already padded values', () => {
      expect(dateStringFromThreeFields('05', '03', '2024')).to.equal('2024-03-05');
      expect(dateStringFromThreeFields('09', '11', '2024')).to.equal('2024-11-09');
      expect(dateStringFromThreeFields('01', '01', '2024')).to.equal('2024-01-01');
    });

    it('handles edge cases without validation', () => {
      // Note: This function doesn't validate dates, just formats them
      expect(dateStringFromThreeFields('32', '13', '2024')).to.equal('2024-13-32');
      expect(dateStringFromThreeFields('0', '0', '0')).to.equal('0-00-00');
      expect(dateStringFromThreeFields('', '', '')).to.equal('-00-00');
    });

    it('handles very long input strings', () => {
      expect(dateStringFromThreeFields('123', '456', '2024')).to.equal('2024-456-123');
      expect(dateStringFromThreeFields('1', '2', '20240')).to.equal('20240-02-01');
    });
  });

  describe('safeBodyString()', () => {
    it('returns the value when key exists in object', () => {
      const body = { name: 'John', age: 25, active: true };
      
      expect(safeBodyString(body, 'name')).to.equal('John');
      expect(safeBodyString(body, 'age')).to.equal(25);
      expect(safeBodyString(body, 'active')).to.equal(true);
    });

    it('returns empty string when key does not exist', () => {
      const body = { name: 'John' };
      
      expect(safeBodyString(body, 'nonexistent')).to.equal('');
      expect(safeBodyString({}, 'anything')).to.equal('');
    });

    it('returns value even if it is falsy', () => {
      const body = { 
        emptyString: '', 
        zero: 0, 
        falseValue: false, 
        nullValue: null,
        undefinedValue: undefined
      };
      
      expect(safeBodyString(body, 'emptyString')).to.equal('');
      expect(safeBodyString(body, 'zero')).to.equal(0);
      expect(safeBodyString(body, 'falseValue')).to.equal(false);
      expect(safeBodyString(body, 'nullValue')).to.equal(null);
      expect(safeBodyString(body, 'undefinedValue')).to.equal(undefined);
    });

    it('returns empty string when body is not a record', () => {
      expect(safeBodyString(null, 'key')).to.equal('');
      expect(safeBodyString(undefined, 'key')).to.equal('');
      expect(safeBodyString('string', 'key')).to.equal('');
      expect(safeBodyString(123, 'key')).to.equal('');
      expect(safeBodyString([], 'key')).to.equal('');
      expect(safeBodyString(true, 'key')).to.equal('');
    });

    it('handles nested objects', () => {
      const body = { 
        user: { name: 'John', details: { age: 25 } },
        settings: { theme: 'dark' }
      };
      
      expect(safeBodyString(body, 'user')).to.deep.equal({ name: 'John', details: { age: 25 } });
      expect(safeBodyString(body, 'settings')).to.deep.equal({ theme: 'dark' });
    });

    it('handles special property names', () => {
      const body = {
        'property-with-dashes': 'value1',
        'property_with_underscores': 'value2',
        'dateOfBirth-day': '15',
        'dateOfBirth-month': '06',
        'dateOfBirth-year': '1990'
      };
      
      expect(safeBodyString(body, 'property-with-dashes')).to.equal('value1');
      expect(safeBodyString(body, 'property_with_underscores')).to.equal('value2');
      expect(safeBodyString(body, 'dateOfBirth-day')).to.equal('15');
      expect(safeBodyString(body, 'dateOfBirth-month')).to.equal('06');
      expect(safeBodyString(body, 'dateOfBirth-year')).to.equal('1990');
    });
  });

  describe('extractFormFields()', () => {
    it('extracts multiple fields from request body', () => {
      const body = {
        fullName: 'John Doe',
        email: 'john@example.com',
        age: 30,
        active: true
      };
      const keys = ['fullName', 'email', 'age'];
      
      const result = extractFormFields(body, keys);
      
      expect(result).to.deep.equal({
        fullName: 'John Doe',
        email: 'john@example.com',
        age: 30
      });
    });

    it('returns empty string for missing fields', () => {
      const body = { fullName: 'John Doe' };
      const keys = ['fullName', 'email', 'phone'];
      
      const result = extractFormFields(body, keys);
      
      expect(result).to.deep.equal({
        fullName: 'John Doe',
        email: '',
        phone: ''
      });
    });

    it('handles empty keys array', () => {
      const body = { fullName: 'John Doe', email: 'john@example.com' };
      const keys: string[] = [];
      
      const result = extractFormFields(body, keys);
      
      expect(result).to.deep.equal({});
    });

    it('handles empty body', () => {
      const body = {};
      const keys = ['fullName', 'email'];
      
      const result = extractFormFields(body, keys);
      
      expect(result).to.deep.equal({
        fullName: '',
        email: ''
      });
    });

    it('handles invalid body types', () => {
      const keys = ['fullName', 'email'];
      
      expect(extractFormFields(null, keys)).to.deep.equal({
        fullName: '',
        email: ''
      });
      
      expect(extractFormFields(undefined, keys)).to.deep.equal({
        fullName: '',
        email: ''
      });
      
      expect(extractFormFields('string', keys)).to.deep.equal({
        fullName: '',
        email: ''
      });
      
      expect(extractFormFields(123, keys)).to.deep.equal({
        fullName: '',
        email: ''
      });
    });

    it('extracts date fields correctly', () => {
      const body = {
        'dateOfBirth-day': '15',
        'dateOfBirth-month': '06',
        'dateOfBirth-year': '1990',
        fullName: 'John Doe'
      };
      const keys = ['fullName', 'dateOfBirth-day', 'dateOfBirth-month', 'dateOfBirth-year'];
      
      const result = extractFormFields(body, keys);
      
      expect(result).to.deep.equal({
        fullName: 'John Doe',
        'dateOfBirth-day': '15',
        'dateOfBirth-month': '06',
        'dateOfBirth-year': '1990'
      });
    });

    it('preserves falsy values from body', () => {
      const body = {
        name: 'John',
        emptyString: '',
        zero: 0,
        falseValue: false,
        nullValue: null,
        undefinedValue: undefined
      };
      const keys = ['name', 'emptyString', 'zero', 'falseValue', 'nullValue', 'undefinedValue', 'missing'];
      
      const result = extractFormFields(body, keys);
      
      expect(result).to.deep.equal({
        name: 'John',
        emptyString: '',
        zero: 0,
        falseValue: false,
        nullValue: null,
        undefinedValue: undefined,
        missing: '' // Missing fields return empty string
      });
    });

    it('handles duplicate keys', () => {
      const body = { name: 'John', age: 30 };
      const keys = ['name', 'age', 'name']; // Duplicate key
      
      const result = extractFormFields(body, keys);
      
      expect(result).to.deep.equal({
        name: 'John',
        age: 30
      });
    });

    it('handles form field arrays and objects', () => {
      const body = {
        tags: ['javascript', 'typescript'],
        preferences: { theme: 'dark', language: 'en' },
        simple: 'value'
      };
      const keys = ['tags', 'preferences', 'simple'];
      
      const result = extractFormFields(body, keys);
      
      expect(result).to.deep.equal({
        tags: ['javascript', 'typescript'],
        preferences: { theme: 'dark', language: 'en' },
        simple: 'value'
      });
    });

    it('handles special characters in field names', () => {
      const body = {
        'field-with-dashes': 'value1',
        'field_with_underscores': 'value2',
        'field with spaces': 'value3',
        'field.with.dots': 'value4',
        'field[with][brackets]': 'value5'
      };
      const keys = [
        'field-with-dashes',
        'field_with_underscores', 
        'field with spaces',
        'field.with.dots',
        'field[with][brackets]'
      ];
      
      const result = extractFormFields(body, keys);
      
      expect(result).to.deep.equal({
        'field-with-dashes': 'value1',
        'field_with_underscores': 'value2',
        'field with spaces': 'value3',
        'field.with.dots': 'value4',
        'field[with][brackets]': 'value5'
      });
    });
  });
});