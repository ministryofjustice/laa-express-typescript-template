import { checkSchema } from 'express-validator';
import { TypedValidationError } from '../helpers/ValidationErrorHelpers.js';
import { t } from '#src/scripts/helpers/i18nLoader.js';

/**
 * Validation middleware for person input (name and address).
 * Ensures both fields are strings and meet basic requirements.
 * @returns {Error} Validation schema for express-validator
 */
export const validatePerson = (): ReturnType<typeof checkSchema> =>
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
         * Custom error message for empty name field using i18n
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.name.validationError.notEmpty'),
          inlineMessage: t('forms.name.validationError.notEmpty')
        })
      },
    },
    address: {
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
         * Custom error message for empty address field using i18n
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.address.validationError.notEmpty'),
          inlineMessage: t('forms.address.validationError.notEmpty')
        })
      },
    }
  });