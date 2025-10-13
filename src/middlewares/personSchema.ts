import { checkSchema, type Meta } from 'express-validator';
import validator from 'validator';
import { TypedValidationError } from '../helpers/ValidationErrorHelpers.js';
import { hasProperty, isRecord, dateStringFromThreeFields } from '../helpers/dataTransformers.js';
import { t } from '#src/scripts/helpers/i18nLoader.js';

// Constants for validation boundaries
const MIN_DAY = 1;
const MAX_DAY = 31;
const MIN_MONTH = 1;
const MAX_MONTH = 12;
const YEAR_LENGTH = 4;

interface PersonBody {
  fullName: string;
  address: string;
  contactPreference: string;
  priority: string;
  'dateOfBirth-day': string;
  'dateOfBirth-month': string;
  'dateOfBirth-year': string;
}

/**
 * Checks whether the given body object has the expected structure of PersonBody.
 * @param {unknown} body - The body object to check
 * @returns {body is PersonBody} True if the body matches PersonBody shape
 */
function isPersonBody(body: unknown): body is PersonBody {
  return isRecord(body) &&
    hasProperty(body, 'fullName') &&
    hasProperty(body, 'address') &&
    hasProperty(body, 'contactPreference') &&
    hasProperty(body, 'priority') &&
    hasProperty(body, 'dateOfBirth-day') &&
    hasProperty(body, 'dateOfBirth-month') &&
    hasProperty(body, 'dateOfBirth-year');
}

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
        /**
         * Custom sanitizer for fullName field - preserves null/undefined for validation
         * @param {unknown} value - The input value to sanitize
         * @returns {unknown} Sanitized value
         */
        options: (value: unknown) => {
          // Preserve undefined and null to allow proper validation
          if (value === undefined || value === null) {
            return value;
          }
          // Convert any non-string value to string for consistent processing
          if (typeof value !== 'string') {
            return typeof value === 'object' && value !== null ? '' : String(value);
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
        /**
         * Custom sanitizer for address field - preserves null/undefined for validation
         * @param {unknown} value - The input value to sanitize
         * @returns {unknown} Sanitized value
         */
        options: (value: unknown) => {
          // Preserve undefined and null to allow proper validation
          if (value === undefined || value === null) {
            return value;
          }
          // Convert any non-string value to string for consistent processing
          if (typeof value !== 'string') {
            return typeof value === 'object' && value !== null ? '' : String(value);
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
    },
    contactPreference: {
      in: ['body'],
      notEmpty: {
        /**
         * Custom error message for empty contact preference field using i18n
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.contactPreference.validationError.notEmpty'),
          inlineMessage: t('forms.contactPreference.validationError.notEmpty')
        })
      },
      isIn: {
        options: [['email', 'phone', 'post']],
        /**
         * Custom error message for invalid contact preference using i18n
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.contactPreference.validationError.invalidOption'),
          inlineMessage: t('forms.contactPreference.validationError.invalidOption')
        })
      },
      custom: {
        /**
         * Validates that the contact preference has been changed from the original value
         * Following MCC pattern for change validation
         * @param {string} value - The contact preference value from the form
         * @param {Meta} meta - express-validator metadata containing request object
         * @returns {boolean} True if the value has changed from original or no original exists
         */
        options: (value: string, { req }: Meta): boolean => {
          // Get original form data from session
          const originalData = req.session?.personOriginal as Record<string, unknown> | undefined;
          if (!originalData || typeof originalData !== 'object') {
            return true; // No original data to compare against
          }
          
          const { contactPreference: originalContactPreference } = originalData;
          if (!originalContactPreference) {
            return true; // No original contact preference to compare against
          }
          
          // Return true if the value has changed, false if it's the same
          return value !== originalContactPreference;
        },
        /**
         * Custom error message for unchanged contact preference using i18n
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.contactPreference.validationError.notChanged'),
          inlineMessage: t('forms.contactPreference.validationError.notChanged')
        })
      }
    },
    priority: {
      in: ['body'],
      notEmpty: {
        /**
         * Custom error message for empty priority field using i18n
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.priority.validationError.notEmpty'),
          inlineMessage: t('forms.priority.validationError.notEmpty')
        })
      },
      isIn: {
        options: [['low', 'medium', 'high', 'urgent']],
        /**
         * Custom error message for invalid priority using i18n
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.priority.validationError.invalidOption'),
          inlineMessage: t('forms.priority.validationError.invalidOption')
        })
      },
      custom: {
        /**
         * Validates that the priority has been changed from the original value
         * Following MCC pattern for change validation
         * @param {string} value - The priority value from the form
         * @param {Meta} meta - express-validator metadata containing request object
         * @returns {boolean} True if the value has changed from original or no original exists
         */
        options: (value: string, { req }: Meta): boolean => {
          // Get original form data from session
          const originalData = req.session?.personOriginal as Record<string, unknown> | undefined;
          if (!originalData || typeof originalData !== 'object') {
            return true; // No original data to compare against
          }
          
          const { priority: originalPriority } = originalData;
          if (!originalPriority) {
            return true; // No original priority to compare against
          }
          
          // Return true if the value has changed, false if it's the same
          return value !== originalPriority;
        },
        /**
         * Custom error message for unchanged priority using i18n
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.priority.validationError.notChanged'),
          inlineMessage: t('forms.priority.validationError.notChanged')
        })
      }
    },
    communicationMethods: {
      in: ['body'],
      isArray: {
        options: { min: 1 },
        /**
         * Custom error message for empty communication methods array using i18n
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.communicationMethods.validationError.notEmpty'),
          inlineMessage: t('forms.communicationMethods.validationError.notEmpty'),
        }),
      },
    },
    'dateOfBirth-day': {
      in: ['body'],
      trim: true,
      custom: {
        /**
         * Validate day field in date of birth - requires all or none
         * @param {string} value - The day value to validate  
         * @param {object} root0 - Metadata object
         * @param {object} root0.req - Express request object
         * @returns {boolean} True if validation passes, false otherwise
         */
        options: (value: string, { req }: Meta): boolean => {
          // If any date field is provided, all must be provided
          if (!isPersonBody(req.body)) return true;
          
          const day = req.body['dateOfBirth-day']?.trim();
          const month = req.body['dateOfBirth-month']?.trim();
          const year = req.body['dateOfBirth-year']?.trim();
          
          const hasAnyDateField = (day !== '' && day !== undefined) || (month !== '' && month !== undefined) || (year !== '' && year !== undefined);
          
          if (!hasAnyDateField) return true; // All empty is fine
          
          if (!value?.trim() || value?.trim() === '') {
            return false; // Day is required if any date field is provided
          }
          
          const dayNum = parseInt(value.trim());
          return !isNaN(dayNum) && dayNum >= MIN_DAY && dayNum <= MAX_DAY;
        },
        /**
         * Custom error message for dateOfBirth day field validation
         * @param {string} value - The day value from the form
         * @param {object} root0 - Meta object from express-validator
         * @param {object} root0.req - Express request object
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: (value: string, { req }: Meta) => {
          if (!isPersonBody(req.body)) {return new TypedValidationError({
            summaryMessage: t('forms.dateOfBirth.validationError.day.notEmpty'),
            inlineMessage: t('forms.dateOfBirth.validationError.day.notEmpty'),
          });}
          
          const day = req.body['dateOfBirth-day']?.trim();
          const month = req.body['dateOfBirth-month']?.trim();
          const year = req.body['dateOfBirth-year']?.trim();
          
          const hasAnyDateField = day || month || year;
          
          if (hasAnyDateField && (!value?.trim())) {
            return new TypedValidationError({
              summaryMessage: t('forms.dateOfBirth.validationError.day.notEmpty'),
              inlineMessage: t('forms.dateOfBirth.validationError.day.notEmpty'),
            });
          }
          
          return new TypedValidationError({
            summaryMessage: t('forms.dateOfBirth.validationError.day.isInt'),
            inlineMessage: t('forms.dateOfBirth.validationError.day.isInt'),
          });
        }
      },
    },
    'dateOfBirth-month': {
      in: ['body'],
      trim: true,
      custom: {
        /**
         * Validates dateOfBirth month field - requires all date fields if any are provided
         * @param {string} value - The month value from the form
         * @param {object} root0 - Meta object from express-validator
         * @param {object} root0.req - Express request object
         * @returns {boolean} True if validation passes, false otherwise
         */
        options: (value: string, { req }: Meta): boolean => {
          // If any date field is provided, all must be provided
          if (!isPersonBody(req.body)) return true;
          
          const day = req.body['dateOfBirth-day']?.trim();
          const month = req.body['dateOfBirth-month']?.trim();
          const year = req.body['dateOfBirth-year']?.trim();
          
          const hasAnyDateField = day || month || year;
          
          if (!hasAnyDateField) return true; // All empty is fine
          
          if (!value?.trim() || value?.trim() === '') {
            return false; // Month is required if any date field is provided
          }
          
          const monthNum = parseInt(value.trim());
          return !isNaN(monthNum) && monthNum >= MIN_MONTH && monthNum <= MAX_MONTH;
        },
        /**
         *
         * @param value
         * @param root0
         * @param root0.req
         */
        errorMessage: (value: string, { req }: Meta) => {
          if (!isPersonBody(req.body)) {return new TypedValidationError({
            summaryMessage: t('forms.dateOfBirth.validationError.month.notEmpty'),
            inlineMessage: t('forms.dateOfBirth.validationError.month.notEmpty'),
          });}
          
          const day = req.body['dateOfBirth-day']?.trim();
          const month = req.body['dateOfBirth-month']?.trim();
          const year = req.body['dateOfBirth-year']?.trim();
          
          const hasAnyDateField = day || month || year;
          
          if (hasAnyDateField && (!value?.trim())) {
            return new TypedValidationError({
              summaryMessage: t('forms.dateOfBirth.validationError.month.notEmpty'),
              inlineMessage: t('forms.dateOfBirth.validationError.month.notEmpty'),
            });
          }
          
          return new TypedValidationError({
            summaryMessage: t('forms.dateOfBirth.validationError.month.isInt'),
            inlineMessage: t('forms.dateOfBirth.validationError.month.isInt'),
          });
        }
      },
    },
    'dateOfBirth-year': {
      in: ['body'],
      trim: true,
      custom: {
        /**
         *
         * @param value
         * @param root0
         * @param root0.req
         */
        options: (value: string, { req }: Meta): boolean => {
          // If any date field is provided, all must be provided
          if (!isPersonBody(req.body)) return true;
          
          const day = req.body['dateOfBirth-day']?.trim();
          const month = req.body['dateOfBirth-month']?.trim();
          const year = req.body['dateOfBirth-year']?.trim();
          
          const hasAnyDateField = day || month || year;
          
          if (!hasAnyDateField) return true; // All empty is fine
          
          if (!value?.trim() || value?.trim() === '') {
            return false; // Year is required if any date field is provided
          }
          
          const yearStr = value.trim();
          if (yearStr.length !== YEAR_LENGTH) return false;
          
          const yearNum = parseInt(yearStr);
          return !isNaN(yearNum);
        },
        /**
         *
         * @param value
         * @param root0
         * @param root0.req
         */
        errorMessage: (value: string, { req }: Meta) => {
          if (!isPersonBody(req.body)) {return new TypedValidationError({
            summaryMessage: t('forms.dateOfBirth.validationError.year.notEmpty'),
            inlineMessage: t('forms.dateOfBirth.validationError.year.notEmpty'),
          });}
          
          const day = req.body['dateOfBirth-day']?.trim();
          const month = req.body['dateOfBirth-month']?.trim();
          const year = req.body['dateOfBirth-year']?.trim();
          
          const hasAnyDateField = day || month || year;
          
          if (hasAnyDateField && (!value?.trim())) {
            return new TypedValidationError({
              summaryMessage: t('forms.dateOfBirth.validationError.year.notEmpty'),
              inlineMessage: t('forms.dateOfBirth.validationError.year.notEmpty'),
            });
          }
          
          const yearStr = value?.trim();
          if (yearStr && yearStr.length !== YEAR_LENGTH) {
            return new TypedValidationError({
              summaryMessage: t('forms.dateOfBirth.validationError.year.isLength'),
              inlineMessage: t('forms.dateOfBirth.validationError.year.isLength'),
            });
          }
          
          return new TypedValidationError({
            summaryMessage: t('forms.dateOfBirth.validationError.year.isInt'),
            inlineMessage: t('forms.dateOfBirth.validationError.year.isInt'),
          });
        }
      },
    },
    validDate: {
      in: ['body'],
      custom: {
        /**
         * Schema to check if the day/month/year combination forms a valid date.
         * Only validates if at least one date field is provided.
         * @param {string} _value - Placeholder value (unused)
         * @param {Meta} meta - `express-validator` context containing request object
         * @returns {boolean} True if the date combination is valid or if no date fields are provided
         */
        options: (_value: string, meta: Meta): boolean => {
          const { req } = meta;

          if (!isPersonBody(req.body)) {
            return true;
          }

          const day = req.body['dateOfBirth-day']?.trim();
          const month = req.body['dateOfBirth-month']?.trim();
          const year = req.body['dateOfBirth-year']?.trim();

          // If no date fields are provided, skip validation
          const hasAnyDateField = day || month || year;
          if (!hasAnyDateField) return true;

          // If any field is missing, this validation should pass (individual field validations will handle it)
          if (!day || !month || !year) return true;

          // Use validator.js isDate() with dateStringFromThreeFields helper
          const dateString = dateStringFromThreeFields(day, month, year);

          return validator.isDate(dateString);
        },
        /**
         * Custom error message for invalid date combinations
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.dateOfBirth.validationError.validDate'),
          inlineMessage: t('forms.dateOfBirth.validationError.validDate'),
        }),
        bail: true, // Stop validation if date format is invalid
      },
    }
  });