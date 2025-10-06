/**
 * Person Schema Validation Tests
 * 
 * Tests the validation middleware for person input (name and address) using TypedValidationError.
 * Validates that validation errors are thrown under the correct circumstances
 * and that errors are properly formatted for GOV.UK components.
 * 
 * Testing Level: Unit
 * Component: Validation Middleware
 * Dependencies: express-validator, ValidationErrorHelpers
 */

import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { validatePerson } from '#src/middlewares/personSchema.js';
import { validationResult } from 'express-validator';
import { formatValidationError } from '#src/helpers/ValidationErrorHelpers.js';
import { initializeI18nextSync } from '#src/scripts/helpers/i18nLoader.js';
import type { Request } from 'express';

// Mock Express request object for testing
function createMockRequest(bodyData: Record<string, unknown>) {
  return {
    body: bodyData
  } as any;
}

describe('Person Schema Validation', () => {
  before(() => {
    // Initialize i18next for translations to work in tests
    initializeI18nextSync();
  });

  describe('validatePerson', () => {
    it('should create validation schema without throwing an error', () => {
      expect(() => validatePerson()).to.not.throw();
    });

    describe('fullName field validation', () => {
      it('should pass validation when fullName is valid', async () => {
        const validNames = [
          'John Smith',
          'Mary Jane Watson',
          'José María',
          'O\'Brien',
          'Van Der Berg'
        ];

        for (const fullName of validNames) {
          const schema = validatePerson();
          const req = createMockRequest({
            fullName,
            address: '123 Test Street'
          });

          await Promise.all(schema.map((validation: any) => validation.run(req as Request)));
          const errors = validationResult(req);

          expect(errors.isEmpty(), `Expected validation to pass for: "${fullName}"`).to.be.true;
        }
      });

      it('should fail validation when fullName is empty', async () => {
        const schema = validatePerson();
        const req = createMockRequest({
          fullName: '',
          address: '123 Test Street'
        });

        await Promise.all(schema.map((validation: any) => validation.run(req as Request)));
        const errors = validationResult(req).formatWith(formatValidationError);

        expect(errors.isEmpty()).to.be.false;

        const nameError = errors.array().find((error: any) => 
          error.summaryMessage && error.summaryMessage.includes('Enter your full name')
        );
        expect(nameError).to.exist;
        expect(nameError?.summaryMessage).to.equal('Enter your full name');
        expect(nameError?.inlineMessage).to.equal('Enter your full name');
      });

      it('should fail validation when fullName is only whitespace', async () => {
        const testCases = ['   ', '\t\n ', '  \t  '];

        for (const testCase of testCases) {
          const schema = validatePerson();
          const req = createMockRequest({
            fullName: testCase,
            address: '123 Test Street'
          });

          await Promise.all(schema.map((validation: any) => validation.run(req as Request)));
          const errors = validationResult(req).formatWith(formatValidationError);

          expect(errors.isEmpty(), `Expected validation to fail for fullName: "${testCase}"`).to.be.false;

          const nameError = errors.array().find((error: any) => 
            error.summaryMessage && error.summaryMessage.includes('Enter your full name')
          );
          expect(nameError, `Expected name error for: "${testCase}"`).to.exist;
        }
      });

      it('should fail validation when fullName is null or undefined', async () => {
        const testCases = [null, undefined];

        for (const testCase of testCases) {
          const schema = validatePerson();
          const req = createMockRequest({
            fullName: testCase,
            address: '123 Test Street'
          });

          await Promise.all(schema.map((validation: any) => validation.run(req as Request)));
          const errors = validationResult(req).formatWith(formatValidationError);

          expect(errors.isEmpty(), `Expected validation to fail for fullName: ${testCase}`).to.be.false;

          const nameError = errors.array().find((error: any) => 
            error.summaryMessage && error.summaryMessage.includes('Enter your full name')
          );
          expect(nameError, `Expected name error for: ${testCase}`).to.exist;
        }
      });

      it('should trim leading and trailing whitespace from fullName', async () => {
        const schema = validatePerson();
        const req = createMockRequest({
          fullName: '  John Smith  ',
          address: '123 Test Street'
        });

        await Promise.all(schema.map((validation: any) => validation.run(req as Request)));

        // Check that fullName was trimmed
        expect(req.body.fullName).to.equal('John Smith');
      });

      it('should convert non-string values to strings', async () => {
        const schema = validatePerson();
        const req = createMockRequest({
          fullName: 12345,
          address: '123 Test Street'
        });

        await Promise.all(schema.map((validation: any) => validation.run(req as Request)));

        // Check that fullName was converted to string
        expect(req.body.fullName).to.equal('12345');
      });
    });

    describe('address field validation', () => {
      it('should pass validation when address is valid', async () => {
        const validAddresses = [
          '123 Main Street',
          'Flat 2, Building Name, Street',
          '1 High Street\nLondon\nSW1A 1AA',
          'Suite 100\nBusiness Park\nReading\nRG1 1AA'
        ];

        for (const address of validAddresses) {
          const schema = validatePerson();
          const req = createMockRequest({
            fullName: 'John Smith',
            address
          });

          await Promise.all(schema.map((validation: any) => validation.run(req as Request)));
          const errors = validationResult(req);

          expect(errors.isEmpty(), `Expected validation to pass for: "${address}"`).to.be.true;
        }
      });

      it('should fail validation when address is empty', async () => {
        const schema = validatePerson();
        const req = createMockRequest({
          fullName: 'John Smith',
          address: ''
        });

        await Promise.all(schema.map((validation: any) => validation.run(req as Request)));
        const errors = validationResult(req).formatWith(formatValidationError);

        expect(errors.isEmpty()).to.be.false;

        const addressError = errors.array().find((error: any) => 
          error.summaryMessage && error.summaryMessage.includes('Enter your address')
        );
        expect(addressError).to.exist;
        expect(addressError?.summaryMessage).to.equal('Enter your address');
        expect(addressError?.inlineMessage).to.equal('Enter your address');
      });

      it('should fail validation when address is only whitespace', async () => {
        const testCases = ['   ', '\t\n ', '  \t  '];

        for (const testCase of testCases) {
          const schema = validatePerson();
          const req = createMockRequest({
            fullName: 'John Smith',
            address: testCase
          });

          await Promise.all(schema.map((validation: any) => validation.run(req as Request)));
          const errors = validationResult(req).formatWith(formatValidationError);

          expect(errors.isEmpty(), `Expected validation to fail for address: "${testCase}"`).to.be.false;

          const addressError = errors.array().find((error: any) => 
            error.summaryMessage && error.summaryMessage.includes('Enter your address')
          );
          expect(addressError, `Expected address error for: "${testCase}"`).to.exist;
        }
      });

      it('should fail validation when address is null or undefined', async () => {
        const testCases = [null, undefined];

        for (const testCase of testCases) {
          const schema = validatePerson();
          const req = createMockRequest({
            fullName: 'John Smith',
            address: testCase
          });

          await Promise.all(schema.map((validation: any) => validation.run(req as Request)));
          const errors = validationResult(req).formatWith(formatValidationError);

          expect(errors.isEmpty(), `Expected validation to fail for address: ${testCase}`).to.be.false;

          const addressError = errors.array().find((error: any) => 
            error.summaryMessage && error.summaryMessage.includes('Enter your address')
          );
          expect(addressError, `Expected address error for: ${testCase}`).to.exist;
        }
      });

      it('should trim leading and trailing whitespace from address', async () => {
        const schema = validatePerson();
        const req = createMockRequest({
          fullName: 'John Smith',
          address: '  123 Main Street  '
        });

        await Promise.all(schema.map((validation: any) => validation.run(req as Request)));

        // Check that address was trimmed
        expect(req.body.address).to.equal('123 Main Street');
      });

      it('should convert non-string values to strings', async () => {
        const schema = validatePerson();
        const req = createMockRequest({
          fullName: 'John Smith',
          address: 12345
        });

        await Promise.all(schema.map((validation: any) => validation.run(req as Request)));

        // Check that address was converted to string
        expect(req.body.address).to.equal('12345');
      });
    });

    describe('combined field validation', () => {
      it('should pass validation when both fields are valid', async () => {
        const schema = validatePerson();
        const req = createMockRequest({
          fullName: 'John Smith',
          address: '123 Main Street\nLondon\nSW1A 1AA'
        });

        await Promise.all(schema.map((validation: any) => validation.run(req as Request)));
        const errors = validationResult(req);

        expect(errors.isEmpty()).to.be.true;
      });

      it('should fail validation when both fields are empty', async () => {
        const schema = validatePerson();
        const req = createMockRequest({
          fullName: '',
          address: ''
        });

        await Promise.all(schema.map((validation: any) => validation.run(req as Request)));
        const errors = validationResult(req).formatWith(formatValidationError);

        expect(errors.isEmpty()).to.be.false;

        const errorArray = errors.array();
        expect(errorArray).to.have.length(2);

        const nameError = errorArray.find((error: any) => 
          error.summaryMessage && error.summaryMessage.includes('Enter your full name')
        );
        const addressError = errorArray.find((error: any) => 
          error.summaryMessage && error.summaryMessage.includes('Enter your address')
        );

        expect(nameError).to.exist;
        expect(addressError).to.exist;
      });
    });

    describe('error structure validation', () => {
      it('should produce correctly formatted errors when used with formatValidationError', async () => {
        const schema = validatePerson();
        const req = createMockRequest({
          fullName: '',
          address: ''
        });

        await Promise.all(schema.map((validation: any) => validation.run(req as Request)));
        const errors = validationResult(req).formatWith(formatValidationError);

        expect(errors.isEmpty()).to.be.false;

        const errorArray = errors.array();
        for (const errorData of errorArray) {
          expect(errorData).to.have.property('summaryMessage');
          expect(errorData).to.have.property('inlineMessage');
          expect(errorData.summaryMessage).to.be.a('string');
          expect(errorData.inlineMessage).to.be.a('string');
          expect(errorData.summaryMessage.length).to.be.greaterThan(0);
          expect(errorData.inlineMessage.length).to.be.greaterThan(0);
        }
      });

      it('should maintain TypedValidationError structure', async () => {
        const schema = validatePerson();
        const req = createMockRequest({
          fullName: '',
          address: '123 Test Street'
        });

        await Promise.all(schema.map((validation: any) => validation.run(req as Request)));
        const errors = validationResult(req);

        expect(errors.isEmpty()).to.be.false;

        const rawErrors = errors.array();
        expect(rawErrors.length).to.be.greaterThan(0);

        // Check that raw error contains the TypedValidationError structure
        const rawError = rawErrors[0];
        expect(rawError).to.have.property('msg');
        // The msg property should be a TypedValidationError instance
        expect(rawError.msg).to.be.instanceOf(Error);
        expect(rawError.msg).to.have.property('errorData');
        expect(rawError.msg.errorData).to.have.property('summaryMessage');
        expect(rawError.msg.errorData).to.have.property('inlineMessage');
      });
    });
  });
});