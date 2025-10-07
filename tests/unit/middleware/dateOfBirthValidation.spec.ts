import { expect } from 'chai';
import { validationResult, type ValidationChain } from 'express-validator';
import type { Request } from 'express';
import { validatePerson } from '../../../src/middlewares/personSchema.js';
import { formatValidationError } from '../../../src/helpers/ValidationErrorHelpers.js';

interface TestRequest extends Partial<Request> {
  body: Record<string, any>;
}

function createMockRequest(body: Record<string, any>): TestRequest {
  return {
    body: body,
    get: (name: string) => undefined,
    header: (name: string) => undefined,
    headers: {},
    method: 'POST',
    url: '/test',
    path: '/test'
  };
}

describe('Date of Birth Validation', () => {
  describe('validatePerson - Date of Birth Fields', () => {
    
    describe('when no date fields are provided', () => {
      it('should pass validation', async () => {
        const schema = validatePerson();
        const req = createMockRequest({
          fullName: 'John Smith',
          address: '123 Test Street'
          // No date fields provided
        });

        await Promise.all(schema.map((validation: ValidationChain) => validation.run(req as Request)));
        const errors = validationResult(req);

        expect(errors.isEmpty()).to.be.true;
      });
    });

    describe('when partial date fields are provided', () => {
      it('should fail validation when only day is provided', async () => {
        const schema = validatePerson();
        const req = createMockRequest({
          fullName: 'John Smith',
          address: '123 Test Street',
          'dateOfBirth-day': '15',
          'dateOfBirth-month': '',
          'dateOfBirth-year': ''
        });

        await Promise.all(schema.map((validation: ValidationChain) => validation.run(req as Request)));
        const errors = validationResult(req).formatWith(formatValidationError);

        expect(errors.isEmpty()).to.be.false;
        const errorArray = errors.array();
        const monthError = errorArray.find((error: any) => 
          error.summaryMessage && error.summaryMessage.includes('Date of birth must include a month')
        );
        const yearError = errorArray.find((error: any) => 
          error.summaryMessage && error.summaryMessage.includes('Date of birth must include a year')
        );
        
        expect(monthError).to.exist;
        expect(yearError).to.exist;
      });

      it('should fail validation when only month is provided', async () => {
        const schema = validatePerson();
        const req = createMockRequest({
          fullName: 'John Smith',
          address: '123 Test Street',
          'dateOfBirth-day': '',
          'dateOfBirth-month': '3',
          'dateOfBirth-year': ''
        });

        await Promise.all(schema.map((validation: ValidationChain) => validation.run(req as Request)));
        const errors = validationResult(req).formatWith(formatValidationError);

        expect(errors.isEmpty()).to.be.false;
        const errorArray = errors.array();
        const dayError = errorArray.find((error: any) => 
          error.summaryMessage && error.summaryMessage.includes('Date of birth must include a day')
        );
        const yearError = errorArray.find((error: any) => 
          error.summaryMessage && error.summaryMessage.includes('Date of birth must include a year')
        );
        
        expect(dayError).to.exist;
        expect(yearError).to.exist;
      });

      it('should fail validation when only year is provided', async () => {
        const schema = validatePerson();
        const req = createMockRequest({
          fullName: 'John Smith',
          address: '123 Test Street',
          'dateOfBirth-day': '',
          'dateOfBirth-month': '',
          'dateOfBirth-year': '1986'
        });

        await Promise.all(schema.map((validation: ValidationChain) => validation.run(req as Request)));
        const errors = validationResult(req).formatWith(formatValidationError);

        expect(errors.isEmpty()).to.be.false;
        const errorArray = errors.array();
        const dayError = errorArray.find((error: any) => 
          error.summaryMessage && error.summaryMessage.includes('Date of birth must include a day')
        );
        const monthError = errorArray.find((error: any) => 
          error.summaryMessage && error.summaryMessage.includes('Date of birth must include a month')
        );
        
        expect(dayError).to.exist;
        expect(monthError).to.exist;
      });
    });

    describe('when all date fields are provided', () => {
      it('should pass validation with valid date', async () => {
        const validDates = [
          { day: '1', month: '1', year: '1990' },
          { day: '15', month: '6', year: '1985' },
          { day: '31', month: '12', year: '2000' },
          { day: '29', month: '2', year: '2020' }, // Leap year
        ];

        for (const dateData of validDates) {
          const schema = validatePerson();
          const req = createMockRequest({
            fullName: 'John Smith',
            address: '123 Test Street',
            'dateOfBirth-day': dateData.day,
            'dateOfBirth-month': dateData.month,
            'dateOfBirth-year': dateData.year
          });

          await Promise.all(schema.map((validation: ValidationChain) => validation.run(req as Request)));
          const errors = validationResult(req);

          expect(errors.isEmpty(), `Expected validation to pass for date: ${dateData.day}/${dateData.month}/${dateData.year}`).to.be.true;
        }
      });

      it('should fail validation with invalid dates', async () => {
        const invalidDates = [
          { day: '32', month: '1', year: '1990' }, // Invalid day
          { day: '15', month: '13', year: '1985' }, // Invalid month
          { day: '29', month: '2', year: '1999' }, // Invalid leap year
          { day: '31', month: '4', year: '2000' }, // April doesn't have 31 days
        ];

        for (const dateData of invalidDates) {
          const schema = validatePerson();
          const req = createMockRequest({
            fullName: 'John Smith',
            address: '123 Test Street',
            'dateOfBirth-day': dateData.day,
            'dateOfBirth-month': dateData.month,
            'dateOfBirth-year': dateData.year
          });

          await Promise.all(schema.map((validation: ValidationChain) => validation.run(req as Request)));
          const errors = validationResult(req);

          expect(errors.isEmpty(), `Expected validation to fail for date: ${dateData.day}/${dateData.month}/${dateData.year}`).to.be.false;
        }
      });
    });

    describe('day field validation', () => {
      it('should fail validation for day out of range', async () => {
        const invalidDays = ['0', '32', '99', '-1'];

        for (const day of invalidDays) {
          const schema = validatePerson();
          const req = createMockRequest({
            fullName: 'John Smith',
            address: '123 Test Street',
            'dateOfBirth-day': day,
            'dateOfBirth-month': '6',
            'dateOfBirth-year': '1990'
          });

          await Promise.all(schema.map((validation: ValidationChain) => validation.run(req as Request)));
          const errors = validationResult(req).formatWith(formatValidationError);

          expect(errors.isEmpty(), `Expected validation to fail for day: ${day}`).to.be.false;
          const errorArray = errors.array();
          const hasDateError = errorArray.some((error: any) => 
            error.summaryMessage && (
              error.summaryMessage.includes('Day must be a number between 1 and 31') ||
              error.summaryMessage.includes('Enter a real date of birth')
            )
          );
          expect(hasDateError).to.be.true;
        }
      });

      it('should fail validation for non-numeric day', async () => {
        const invalidDays = ['abc', '1a', 'first'];

        for (const day of invalidDays) {
          const schema = validatePerson();
          const req = createMockRequest({
            fullName: 'John Smith',
            address: '123 Test Street',
            'dateOfBirth-day': day,
            'dateOfBirth-month': '6',
            'dateOfBirth-year': '1990'
          });

          await Promise.all(schema.map((validation: ValidationChain) => validation.run(req as Request)));
          const errors = validationResult(req).formatWith(formatValidationError);

          expect(errors.isEmpty(), `Expected validation to fail for day: ${day}`).to.be.false;
          const errorArray = errors.array();
          const hasDateError = errorArray.some((error: any) => 
            error.summaryMessage && (
              error.summaryMessage.includes('Day must be a number between 1 and 31') ||
              error.summaryMessage.includes('Enter a real date of birth')
            )
          );
          expect(hasDateError).to.be.true;
        }
      });
    });

    describe('month field validation', () => {
      it('should fail validation for month out of range', async () => {
        const invalidMonths = ['0', '13', '99', '-1'];

        for (const month of invalidMonths) {
          const schema = validatePerson();
          const req = createMockRequest({
            fullName: 'John Smith',
            address: '123 Test Street',
            'dateOfBirth-day': '15',
            'dateOfBirth-month': month,
            'dateOfBirth-year': '1990'
          });

          await Promise.all(schema.map((validation: ValidationChain) => validation.run(req as Request)));
          const errors = validationResult(req).formatWith(formatValidationError);

          expect(errors.isEmpty(), `Expected validation to fail for month: ${month}`).to.be.false;
          const errorArray = errors.array();
          const hasDateError = errorArray.some((error: any) => 
            error.summaryMessage && (
              error.summaryMessage.includes('Month must be a number between 1 and 12') ||
              error.summaryMessage.includes('Enter a real date of birth')
            )
          );
          expect(hasDateError).to.be.true;
        }
      });

      it('should fail validation for non-numeric month', async () => {
        const invalidMonths = ['abc', '1a', 'january'];

        for (const month of invalidMonths) {
          const schema = validatePerson();
          const req = createMockRequest({
            fullName: 'John Smith',
            address: '123 Test Street',
            'dateOfBirth-day': '15',
            'dateOfBirth-month': month,
            'dateOfBirth-year': '1990'
          });

          await Promise.all(schema.map((validation: ValidationChain) => validation.run(req as Request)));
          const errors = validationResult(req).formatWith(formatValidationError);

          expect(errors.isEmpty(), `Expected validation to fail for month: ${month}`).to.be.false;
          const errorArray = errors.array();
          const hasDateError = errorArray.some((error: any) => 
            error.summaryMessage && (
              error.summaryMessage.includes('Month must be a number between 1 and 12') ||
              error.summaryMessage.includes('Enter a real date of birth')
            )
          );
          expect(hasDateError).to.be.true;
        }
      });
    });

    describe('year field validation', () => {
      it('should fail validation for invalid year length', async () => {
        const invalidYears = ['90', '199', '19900', '1'];

        for (const year of invalidYears) {
          const schema = validatePerson();
          const req = createMockRequest({
            fullName: 'John Smith',
            address: '123 Test Street',
            'dateOfBirth-day': '15',
            'dateOfBirth-month': '6',
            'dateOfBirth-year': year
          });

          await Promise.all(schema.map((validation: ValidationChain) => validation.run(req as Request)));
          const errors = validationResult(req).formatWith(formatValidationError);

          expect(errors.isEmpty(), `Expected validation to fail for year: ${year}`).to.be.false;
          const errorArray = errors.array();
          const hasDateError = errorArray.some((error: any) => 
            error.summaryMessage && (
              error.summaryMessage.includes('Year must be 4 numbers') ||
              error.summaryMessage.includes('Year must be a valid number') ||
              error.summaryMessage.includes('Enter a real date of birth')
            )
          );
          expect(hasDateError).to.be.true;
        }
      });

      it('should fail validation for non-numeric year', async () => {
        const invalidYears = ['abcd', '199a', '19ab'];

        for (const year of invalidYears) {
          const schema = validatePerson();
          const req = createMockRequest({
            fullName: 'John Smith',
            address: '123 Test Street',
            'dateOfBirth-day': '15',
            'dateOfBirth-month': '6',
            'dateOfBirth-year': year
          });

          await Promise.all(schema.map((validation: ValidationChain) => validation.run(req as Request)));
          const errors = validationResult(req).formatWith(formatValidationError);

          expect(errors.isEmpty(), `Expected validation to fail for year: ${year}`).to.be.false;
          const errorArray = errors.array();
          const hasDateError = errorArray.some((error: any) => 
            error.summaryMessage && (
              error.summaryMessage.includes('Year must be 4 numbers') ||
              error.summaryMessage.includes('Year must be a valid number') ||
              error.summaryMessage.includes('Enter a real date of birth')
            )
          );
          expect(hasDateError).to.be.true;
        }
      });
    });

    describe('whitespace handling', () => {
      it('should trim whitespace from date fields', async () => {
        const schema = validatePerson();
        const req = createMockRequest({
          fullName: 'John Smith',
          address: '123 Test Street',
          'dateOfBirth-day': '  15  ',
          'dateOfBirth-month': '  6  ',
          'dateOfBirth-year': '  1990  '
        });

        await Promise.all(schema.map((validation: ValidationChain) => validation.run(req as Request)));
        const errors = validationResult(req);

        expect(errors.isEmpty()).to.be.true;
      });
    });
  });
});