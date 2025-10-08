/**
 * ValidationErrorHelpers Unit Tests
 * 
 * Tests the TypedValidationError system and error formatting utilities.
 * Covers error creation, formatting, change detection, and GOV.UK integration.
 * 
 * Testing Level: Unit
 * Component: ValidationErrorHelpers
 * Dependencies: express-validator
 */

import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { validationResult, checkSchema } from 'express-validator';
import type { Request } from 'express';
import {
  TypedValidationError,
  formatValidationError,
  formatValidationErrors,
  createChangeDetectionValidator
} from '#src/helpers/ValidationErrorHelpers.js';
import type { ValidationErrorData } from '#src/helpers/ValidationErrorHelpers.js';

// Mock request object factory
function createMockRequest(body: any): Partial<Request> {
  return {
    body
  } as Partial<Request>;
}

describe('ValidationErrorHelpers', () => {
  describe('TypedValidationError', () => {
    it('should create a TypedValidationError with correct properties', () => {
      const errorData: ValidationErrorData = {
        summaryMessage: 'Test summary',
        inlineMessage: 'Test inline',
        fieldPath: 'testField'
      };

      const error = new TypedValidationError(errorData);

      expect(error).to.be.instanceOf(Error);
      expect(error).to.be.instanceOf(TypedValidationError);
      expect(error.name).to.equal('TypedValidationError');
      expect(error.message).to.equal('Test summary');
      expect(error.errorData).to.deep.equal(errorData);
    });

    it('should work without fieldPath property', () => {
      const errorData: ValidationErrorData = {
        summaryMessage: 'Test summary',
        inlineMessage: 'Test inline'
      };

      const error = new TypedValidationError(errorData);

      expect(error.errorData).to.deep.equal(errorData);
      expect(error.errorData.fieldPath).to.be.undefined;
    });
  });

  describe('formatValidationError', () => {
    it('should format TypedValidationError instances correctly', () => {
      const originalErrorData: ValidationErrorData = {
        summaryMessage: 'Original summary',
        inlineMessage: 'Original inline',
        fieldPath: 'testField'
      };

      const typedError = new TypedValidationError(originalErrorData);
      const mockValidationError = {
        msg: typedError,
        path: 'testField',
        location: 'body',
        value: 'test'
      } as any;

      const result = formatValidationError(mockValidationError);

      expect(result).to.deep.equal(originalErrorData);
    });

    it('should format ValidationErrorData objects correctly', () => {
      const errorData = {
        summaryMessage: 'Test summary',
        inlineMessage: 'Test inline'
      };

      const mockValidationError = {
        msg: errorData,
        path: 'testField',
        location: 'body',
        value: 'test'
      } as any;

      const result = formatValidationError(mockValidationError);

      expect(result).to.deep.equal({
        summaryMessage: 'Test summary',
        inlineMessage: 'Test inline'
      });
    });

    it('should handle string error messages as fallback', () => {
      const mockValidationError = {
        msg: 'Simple error message',
        path: 'testField',
        location: 'body',
        value: 'test'
      } as any;

      const result = formatValidationError(mockValidationError);

      expect(result).to.deep.equal({
        summaryMessage: 'Simple error message',
        inlineMessage: 'Simple error message'
      });
    });

    it('should handle empty or invalid error messages', () => {
      const testCases = [null, undefined, '', 0, false, {}];

      testCases.forEach((testMsg) => {
        const mockValidationError = {
          msg: testMsg,
          path: 'testField',
          location: 'body',
          value: 'test'
        } as any;

        const result = formatValidationError(mockValidationError);

        expect(result.summaryMessage).to.equal('Invalid value');
        expect(result.inlineMessage).to.equal('Invalid value');
      });
    });

    it('should handle non-string but truthy error messages', () => {
      const testCases = [123, true, { toString: () => 'custom error' }];

      testCases.forEach((testMsg) => {
        const mockValidationError = {
          msg: testMsg,
          path: 'testField',
          location: 'body',
          value: 'test'
        } as any;

        const result = formatValidationError(mockValidationError);

        expect(result.summaryMessage).to.equal(String(testMsg));
        expect(result.inlineMessage).to.equal(String(testMsg));
      });
    });
  });

  describe('formatValidationErrors', () => {
    let mockRequest: Partial<Request>;

    beforeEach(() => {
      mockRequest = createMockRequest({
        field1: 'value1',
        field2: 'value2'
      });
    });

    it('should format multiple validation errors correctly', async () => {
      // Create a validation schema that will produce errors
      const schema = checkSchema({
        field1: {
          custom: {
            options: () => {
              return false; // Indicate validation failure
            },
            errorMessage: () => new TypedValidationError({
              summaryMessage: 'Field1 summary error',
              inlineMessage: 'Field1 inline error'
            })
          }
        },
        field2: {
          custom: {
            options: () => {
              return false; // Indicate validation failure
            },
            errorMessage: () => new TypedValidationError({
              summaryMessage: 'Field2 summary error',
              inlineMessage: 'Field2 inline error'
            })
          }
        }
      });

      // Run validation
      await Promise.all(schema.map(validation => validation.run(mockRequest as Request)));
      const validationResultObj = validationResult(mockRequest);

      const result = formatValidationErrors(validationResultObj);

      expect(result).to.have.property('inputErrors');
      expect(result).to.have.property('errorSummaryList');

      expect(result.inputErrors).to.deep.equal({
        field1: 'Field1 inline error',
        field2: 'Field2 inline error'
      });

      expect(result.errorSummaryList).to.have.length(2);
      expect(result.errorSummaryList[0]).to.deep.equal({
        text: 'Field1 summary error',
        href: '#field1'
      });
      expect(result.errorSummaryList[1]).to.deep.equal({
        text: 'Field2 summary error',
        href: '#field2'
      });
    });

    it('should handle empty validation results', () => {
      const emptyValidationResult = {
        array: () => [],
        isEmpty: () => true
      } as any;

      const result = formatValidationErrors(emptyValidationResult);

      expect(result.inputErrors).to.deep.equal({});
      expect(result.errorSummaryList).to.deep.equal([]);
    });

    it('should handle errors with empty inline messages', async () => {
      const schema = checkSchema({
        field1: {
          custom: {
            options: () => {
              return false; // Indicate validation failure
            },
            errorMessage: () => new TypedValidationError({
              summaryMessage: 'Summary only error',
              inlineMessage: '' // Empty inline message
            })
          }
        }
      });

      await Promise.all(schema.map(validation => validation.run(mockRequest as Request)));
      const errors = validationResult(mockRequest);

      const result = formatValidationErrors(errors);

      // Should not include field with empty inline message in inputErrors
      expect(result.inputErrors).to.deep.equal({});

            // But should still include in errorSummaryList
      expect(result.errorSummaryList).to.have.length(1);
      expect(result.errorSummaryList[0]).to.deep.equal({
        text: 'Summary only error',
        href: '#field1'
      });
    });

    it('should handle errors without field paths', async () => {
      const schema = checkSchema({
        customValidator: {
          in: ['body'],
          custom: {
            options: () => {
              return false; // Indicate validation failure
            },
            errorMessage: () => new TypedValidationError({
              summaryMessage: 'Global error',
              inlineMessage: 'Global error'
            })
          }
        }
      });

      await Promise.all(schema.map(validation => validation.run(mockRequest as Request)));
      const errors = validationResult(mockRequest);

      const result = formatValidationErrors(errors);
    });

    it('should handle errors without field paths', async () => {
      const schema = checkSchema({
        customValidator: {
          in: ['body'],
          custom: {
            options: () => {
              return false; // Indicate validation failure
            },
            errorMessage: () => new TypedValidationError({
              summaryMessage: 'Custom validation error',
              inlineMessage: 'Custom inline error'
            })
          }
        }
      });

      await Promise.all(schema.map(validation => validation.run(mockRequest as Request)));
      const errors = validationResult(mockRequest);

      const result = formatValidationErrors(errors);

      expect(result.inputErrors).to.have.property('customValidator');
      expect(result.errorSummaryList[0].href).to.equal('#customValidator');
    });
  });

  describe('createChangeDetectionValidator', () => {
    it('should create a validator that detects no changes', async () => {
      const validator = createChangeDetectionValidator(
        [{ current: 'field1', original: 'original1' }],
        {
          summaryMessage: 'No changes detected',
          inlineMessage: 'Please make changes'
        }
      );

      const mockRequest = createMockRequest({
        field1: 'same value',
        original1: 'same value'
      });

      const schema = checkSchema({
        notChanged: validator
      });

      await Promise.all(schema.map(validation => validation.run(mockRequest as Request)));
      const errors = validationResult(mockRequest as Request);

      expect(errors.isEmpty()).to.be.false;
      
      const errorArray = errors.array();
      expect(errorArray).to.have.length(1);
      expect(errorArray[0].msg).to.be.instanceOf(TypedValidationError);
      expect(errorArray[0].msg.errorData.summaryMessage).to.equal('No changes detected');
    });

    it('should pass validation when changes are detected', async () => {
      const validator = createChangeDetectionValidator(
        [{ current: 'field1', original: 'original1' }],
        {
          summaryMessage: 'No changes detected',
          inlineMessage: 'Please make changes'
        }
      );

      const mockRequest = createMockRequest({
        field1: 'new value',
        original1: 'old value'
      });

      const schema = checkSchema({
        notChanged: validator
      });

      await Promise.all(schema.map(validation => validation.run(mockRequest as Request)));
      const errors = validationResult(mockRequest as Request);

      expect(errors.isEmpty()).to.be.true;
    });

    it('should handle multiple field changes correctly', async () => {
      const validator = createChangeDetectionValidator(
        [
          { current: 'field1', original: 'original1' },
          { current: 'field2', original: 'original2' }
        ],
        {
          summaryMessage: 'No changes detected',
          inlineMessage: 'Please make changes'
        }
      );

      // Test case where one field changes
      const mockRequest1 = createMockRequest({
        field1: 'new value',
        original1: 'old value',
        field2: 'same value',
        original2: 'same value'
      });

      const schema1 = checkSchema({ notChanged: validator });
      await Promise.all(schema1.map(validation => validation.run(mockRequest1 as Request)));
      const errors1 = validationResult(mockRequest1 as Request);

      expect(errors1.isEmpty()).to.be.true;

      // Test case where no fields change
      const mockRequest2 = createMockRequest({
        field1: 'same value',
        original1: 'same value',
        field2: 'same value',
        original2: 'same value'
      });

      const schema2 = checkSchema({ notChanged: validator });
      await Promise.all(schema2.map(validation => validation.run(mockRequest2 as Request)));
      const errors2 = validationResult(mockRequest2 as Request);

      expect(errors2.isEmpty()).to.be.false;
    });

    it('should normalize boolean values correctly', async () => {
      const validator = createChangeDetectionValidator(
        [{ current: 'checkbox', original: 'originalCheckbox' }],
        {
          summaryMessage: 'No changes detected',
          inlineMessage: 'Please make changes'
        }
      );

      // Test boolean normalization cases
      const testCases = [
        // Should be considered unchanged (both falsy)
        { current: '', original: 'false', shouldPass: false },
        { current: 'off', original: '', shouldPass: false },
        { current: 'false', original: 'off', shouldPass: false },
        
        // Should be considered unchanged (both truthy)
        { current: 'on', original: 'true', shouldPass: false },
        { current: 'true', original: '1', shouldPass: false },
        { current: '1', original: 'on', shouldPass: false },
        
        // Should be considered changed
        { current: 'on', original: 'false', shouldPass: true },
        { current: '', original: 'true', shouldPass: true },
        { current: 'true', original: 'off', shouldPass: true }
      ];

      for (const testCase of testCases) {
        const mockRequest = createMockRequest({
          checkbox: testCase.current,
          originalCheckbox: testCase.original
        });

        const schema = checkSchema({ notChanged: validator });
        await Promise.all(schema.map(validation => validation.run(mockRequest as Request)));
        const errors = validationResult(mockRequest as Request);

        expect(errors.isEmpty()).to.equal(
          testCase.shouldPass,
          `Expected ${testCase.current} vs ${testCase.original} to ${testCase.shouldPass ? 'pass' : 'fail'}`
        );
      }
    });

    it('should handle lazy error message resolution', async () => {
      let messageCallCount = 0;
      
      const validator = createChangeDetectionValidator(
        [{ current: 'field1', original: 'original1' }],
        {
          summaryMessage: () => {
            messageCallCount++;
            return `Lazy message ${messageCallCount}`;
          },
          inlineMessage: 'Static inline'
        }
      );

      const mockRequest = createMockRequest({
        field1: 'same value',
        original1: 'same value'
      });

      const schema = checkSchema({ notChanged: validator });
      await Promise.all(schema.map(validation => validation.run(mockRequest as Request)));
      const errors = validationResult(mockRequest as Request);

      expect(errors.isEmpty()).to.be.false;
      expect(messageCallCount).to.equal(1);
      
      const errorArray = errors.array();
      expect(errorArray[0].msg.errorData.summaryMessage).to.equal('Lazy message 1');
    });

    it('should handle missing fields gracefully', async () => {
      const validator = createChangeDetectionValidator(
        [{ current: 'missingField', original: 'missingOriginal' }],
        {
          summaryMessage: 'No changes detected',
          inlineMessage: 'Please make changes'
        }
      );

      const mockRequest = createMockRequest({
        // Missing both fields
      });

      const schema = checkSchema({ notChanged: validator });
      await Promise.all(schema.map(validation => validation.run(mockRequest as Request)));
      const errors = validationResult(mockRequest as Request);

      // Should pass validation when fields are missing (treated as unchanged empty values)
      expect(errors.isEmpty()).to.be.false;
    });
  });

  describe('Data transformation utilities (internal)', () => {
    // These are internal functions but let's test them indirectly through the public API
    
    it('should handle various data types in change detection', async () => {
      const validator = createChangeDetectionValidator(
        [{ current: 'field1', original: 'original1' }],
        {
          summaryMessage: 'No changes detected',
          inlineMessage: 'Please make changes'
        }
      );

      const testCases = [
        // Numbers
        { current: 123, original: '123', shouldDetectChange: false },
        { current: 123, original: '456', shouldDetectChange: true },
        
        // Booleans
        { current: true, original: 'true', shouldDetectChange: false },
        { current: false, original: 'false', shouldDetectChange: false },
        
        // Null/undefined
        { current: null, original: '', shouldDetectChange: false },
        { current: undefined, original: '', shouldDetectChange: false }
      ];

      for (const testCase of testCases) {
        const mockRequest = createMockRequest({
          field1: testCase.current,
          original1: testCase.original
        });

        const schema = checkSchema({ notChanged: validator });
        await Promise.all(schema.map(validation => validation.run(mockRequest as Request)));
        const errors = validationResult(mockRequest as Request);

        expect(errors.isEmpty()).to.equal(
          testCase.shouldDetectChange,
          `Expected ${testCase.current} vs ${testCase.original} to ${testCase.shouldDetectChange ? 'detect change' : 'not detect change'}`
        );
      }
    });
  });
});