import { checkSchema } from 'express-validator';

/**
 * Validation middleware for name input.
 * Ensures the name is a string and meets basic requirements.
 * @returns {Error} Validation schema for express-validator
 */
export const validateName = (): ReturnType<typeof checkSchema> =>
  checkSchema({
    fullName: {
      in: ['body'],
      trim: true,
      notEmpty: {
        errorMessage: 'Enter your full name'
      },
    }
  });
