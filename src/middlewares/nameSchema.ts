import { checkSchema } from 'express-validator';
import { TypedValidationError } from '../helpers/ValidationErrorHelpers.js';

/**
 * Validation middleware for name input.
 * Ensures the name is a string and meets basic requirements.
 * @returns {Error} Validation schema for express-validator
 */
export const validateName = (): ReturnType<typeof checkSchema> =>
  checkSchema({
    fullName: {
      in: ['body'],
      customSanitizer: {
        options: (value: any) => {
          // Preserve undefined and null to allow proper validation
          if (value === undefined || value === null) {
            return value;
          }
          // Convert any non-string value to string for consistent processing
          if (typeof value !== 'string') {
            return String(value);
          }
          return value;
        }
      },
      trim: true,
      notEmpty: {
        /**
         * Custom error message for empty name field
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: 'Enter your full name',
          inlineMessage: 'Enter your full name'
        })
      },
    }
  });
