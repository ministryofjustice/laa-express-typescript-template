/**
 * Name Schema Validation Tests
 * 
 * Tests the validation middleware for name input using TypedValidationError.
 * Validates that validation errors are thrown under the correct circumstances
 * and that errors are properly formatted for GOV.UK components.
 * 
 * Testing Level: Unit
 * Component: Validation Middleware
 * Dependencies: express-validator, ValidationErrorHelpers
 */

import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { validateName } from '#src/middlewares/nameSchema.js';
import { validationResult } from 'express-validator';
import { formatValidationError } from '#src/helpers/ValidationErrorHelpers.js';
import { initializeI18nextSync } from '#src/scripts/helpers/i18nLoader.js';
import type { Request } from 'express';

// Mock Express request object for testing
function createMockRequest(bodyData: Record<string, unknown>): Partial<Request> {
  return {
    body: bodyData
  } as Partial<Request>;
}

describe('Name Schema Validation', () => {
  before(() => {
    // Initialize i18next for tests
    initializeI18nextSync();
  });

  describe('validateName', () => {
    it('should create validation schema without throwing an error', () => {
      expect(() => validateName()).to.not.throw();
    });

    describe('fullName field validation', () => {
      it('should pass validation when fullName is provided', async () => {
        const schema = validateName();
        const req = createMockRequest({
          fullName: 'John Smith'
        });

        await Promise.all(schema.map(validation => validation.run(req as Request)));
        const errors = validationResult(req as Request);

        expect(errors.isEmpty()).to.be.true;
      });

      it('should fail validation when fullName is empty', async () => {
        const schema = validateName();
        const req = createMockRequest({
          fullName: ''
        });

        await Promise.all(schema.map(validation => validation.run(req as Request)));
        const errors = validationResult(req as Request).formatWith(formatValidationError);

        expect(errors.isEmpty()).to.be.false;

        const errorArray = errors.array();
        expect(errorArray).to.have.length(1);
        expect(errorArray[0].summaryMessage).to.equal('Enter your full name');
        expect(errorArray[0].inlineMessage).to.equal('Enter your full name');
      });

      it('should fail validation when fullName is missing', async () => {
        const schema = validateName();
        const req = createMockRequest({
          // fullName field is missing
        });

        await Promise.all(schema.map(validation => validation.run(req as Request)));
        const errors = validationResult(req as Request).formatWith(formatValidationError);

        expect(errors.isEmpty()).to.be.false;

        const errorArray = errors.array();
        expect(errorArray).to.have.length(1);
        expect(errorArray[0].summaryMessage).to.equal('Enter your full name');
        expect(errorArray[0].inlineMessage).to.equal('Enter your full name');
      });

      it('should fail validation when fullName contains only whitespace', async () => {
        const whitespaceValues = ['   ', '\t\n ', '  \t  ', '\r\n\t '];

        for (const whitespaceValue of whitespaceValues) {
          const schema = validateName();
          const req = createMockRequest({
            fullName: whitespaceValue
          });

          await Promise.all(schema.map(validation => validation.run(req as Request)));
          const errors = validationResult(req as Request).formatWith(formatValidationError);

          expect(errors.isEmpty(), `Expected validation to fail for whitespace: "${whitespaceValue}"`).to.be.false;

          const errorArray = errors.array();
          expect(errorArray).to.have.length(1);
          expect(errorArray[0].summaryMessage).to.equal('Enter your full name');
        }
      });

      it('should trim leading and trailing whitespace from fullName', async () => {
        const schema = validateName();
        const req = createMockRequest({
          fullName: '  John Smith  '
        });

        await Promise.all(schema.map(validation => validation.run(req as Request)));

        // Check that fullName was trimmed
        expect(req.body?.fullName).to.equal('John Smith');

        const errors = validationResult(req as Request);
        expect(errors.isEmpty()).to.be.true;
      });

      it('should pass validation for various valid names', async () => {
        const validNames = [
          'John Smith',
          'Mary Jane Watson',
          'José María García',
          '李小明',
          'محمد الأحمد',
          'O\'Connor',
          'Smith-Jones',
          'Dr. John Smith Jr.',
          'A', // Single character
          'X Y Z', // Single characters with spaces
          'Jean-Claude Van Damme',
          'Mary O\'Sullivan-MacLeod'
        ];

        for (const name of validNames) {
          const schema = validateName();
          const req = createMockRequest({
            fullName: name
          });

          await Promise.all(schema.map(validation => validation.run(req as Request)));
          const errors = validationResult(req as Request);

          expect(errors.isEmpty(), `Expected validation to pass for name: "${name}"`).to.be.true;
        }
      });
    });

    describe('error structure validation', () => {
      it('should produce correctly formatted errors when used with formatValidationError', async () => {
        const schema = validateName();
        const req = createMockRequest({
          fullName: '' // Empty to trigger validation error
        });

        await Promise.all(schema.map(validation => validation.run(req as Request)));
        const errors = validationResult(req as Request).formatWith(formatValidationError);

        expect(errors.isEmpty()).to.be.false;

        const errorData = errors.array()[0];
        expect(errorData).to.have.property('summaryMessage');
        expect(errorData).to.have.property('inlineMessage');
        expect(errorData.summaryMessage).to.be.a('string');
        expect(errorData.inlineMessage).to.be.a('string');
        expect(errorData.summaryMessage).to.not.be.empty;
        expect(errorData.inlineMessage).to.not.be.empty;
      });

      it('should have the same message for both summary and inline errors', async () => {
        const schema = validateName();
        const req = createMockRequest({
          fullName: ''
        });

        await Promise.all(schema.map(validation => validation.run(req as Request)));
        const errors = validationResult(req as Request).formatWith(formatValidationError);

        const errorData = errors.array()[0];
        expect(errorData.summaryMessage).to.equal(errorData.inlineMessage);
      });

      it('should include field path information', async () => {
        const schema = validateName();
        const req = createMockRequest({
          fullName: ''
        });

        await Promise.all(schema.map(validation => validation.run(req as Request)));
        const rawErrors = validationResult(req as Request);

        const errorArray = rawErrors.array();
        expect(errorArray[0]).to.have.property('path');
        expect('path' in errorArray[0] ? errorArray[0].path : undefined).to.equal('fullName');
      });
    });

    describe('TypedValidationError integration', () => {
      it('should use TypedValidationError for structured error handling', async () => {
        const schema = validateName();
        const req = createMockRequest({
          fullName: ''
        });

        await Promise.all(schema.map(validation => validation.run(req as Request)));
        const rawErrors = validationResult(req as Request);

        const errorArray = rawErrors.array();
        expect(errorArray[0].msg).to.have.property('errorData');
        expect(errorArray[0].msg.errorData).to.have.property('summaryMessage');
        expect(errorArray[0].msg.errorData).to.have.property('inlineMessage');
      });

      it('should maintain error structure through formatting pipeline', async () => {
        const schema = validateName();
        const req = createMockRequest({
          fullName: ''
        });

        await Promise.all(schema.map(validation => validation.run(req as Request)));
        
        // Test raw validation result
        const rawErrors = validationResult(req as Request);
        const rawErrorArray = rawErrors.array();
        
        // Test formatted validation result
        const formattedErrors = validationResult(req as Request).formatWith(formatValidationError);
        const formattedErrorArray = formattedErrors.array();

        expect(rawErrorArray).to.have.length(1);
        expect(formattedErrorArray).to.have.length(1);
        
        // Verify the formatted error maintains the same content
        expect(formattedErrorArray[0].summaryMessage).to.equal(rawErrorArray[0].msg.errorData.summaryMessage);
        expect(formattedErrorArray[0].inlineMessage).to.equal(rawErrorArray[0].msg.errorData.inlineMessage);
      });
    });

    describe('field configuration', () => {
      it('should validate fullName field in body location', async () => {
        const schema = validateName();
        const req = createMockRequest({
          fullName: ''
        });

        await Promise.all(schema.map(validation => validation.run(req as Request)));
        const errors = validationResult(req as Request);

        const errorArray = errors.array();
        expect(errorArray[0]).to.have.property('location');
        expect('location' in errorArray[0] ? errorArray[0].location : undefined).to.equal('body');
      });

      it('should apply trim sanitization', async () => {
        const schema = validateName();
        const testCases = [
          { input: '  John  ', expected: 'John' },
          { input: '\tJohn Smith\n', expected: 'John Smith' },
          { input: ' \r\n John \t ', expected: 'John' }
        ];

        for (const testCase of testCases) {
          const req = createMockRequest({
            fullName: testCase.input
          });

          await Promise.all(schema.map(validation => validation.run(req as Request)));
          
          expect(req.body?.fullName, `Expected "${testCase.input}" to be trimmed to "${testCase.expected}"`).to.equal(testCase.expected);
        }
      });
    });

    describe('edge cases', () => {
      it('should handle non-string input values', async () => {
        const nonStringValues = [
          123,
          true,
          false,
          null,
          undefined,
          {},
          [],
          () => 'function'
        ];

        for (const value of nonStringValues) {
          const schema = validateName();
          const req = createMockRequest({
            fullName: value
          });

          await Promise.all(schema.map(validation => validation.run(req as Request)));
          const errors = validationResult(req as Request);

          // All non-string values should either be converted to string or fail validation
          // The exact behavior depends on express-validator's type coercion
          if (errors.isEmpty()) {
            // If validation passes, check that the value was converted to string
            expect(typeof req.body?.fullName).to.equal('string');
          } else {
            // If validation fails, it should produce the expected error
            const formattedErrors = validationResult(req as Request).formatWith(formatValidationError);
            const errorArray = formattedErrors.array();
            expect(errorArray[0].summaryMessage).to.equal('Enter your full name');
          }
        }
      });

      it('should handle request body without fullName property', async () => {
        const schema = validateName();
        const req = createMockRequest({
          otherField: 'some value'
          // fullName is missing
        });

        await Promise.all(schema.map(validation => validation.run(req as Request)));
        const errors = validationResult(req as Request).formatWith(formatValidationError);

        expect(errors.isEmpty()).to.be.false;
        const errorArray = errors.array();
        expect(errorArray[0].summaryMessage).to.equal('Enter your full name');
      });
    });
  });
});