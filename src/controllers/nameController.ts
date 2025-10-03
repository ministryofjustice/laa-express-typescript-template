import type { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { formatValidationErrors } from '../helpers/ValidationErrorHelpers.js';

// Store the current name in memory (in a real app, this would be from a database)
let currentStoredName = 'John Smith'; // Default name

/**
 * GET controller for rendering the name change form
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export function getName(req: Request, res: Response, next: NextFunction): void {
  try {
    const csrfToken = typeof req.csrfToken === 'function' ? req.csrfToken() : undefined;
    
    res.render('change-name.njk', {
      currentName: currentStoredName,
      csrfToken: csrfToken,
      formData: {},
      error: null
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST controller for handling name change requests
 * Processes validation results and formats errors for GOV.UK component display
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export function postName(req: Request, res: Response, next: NextFunction): void {
  try {
    const csrfToken = typeof req.csrfToken === 'function' ? req.csrfToken() : undefined;
    
    // Check for validation errors
    const validationErrors = validationResult(req);
    
    if (!validationErrors.isEmpty()) {
      // Use the new formatValidationErrors helper
      const { inputErrors, errorSummaryList } = formatValidationErrors(validationErrors);
      
      // Re-render the form with errors and preserve user input
      res.status(400).render('change-name.njk', {
        currentName: currentStoredName,
        csrfToken: csrfToken,
        formData: req.body,
        error: {
          inputErrors,
          errorSummaryList
        }
      });
      return;
    }
    
    // Success case - update the stored name and show success
    const { fullName } = req.body;
    currentStoredName = fullName; // Update the stored name
    
    // Render the form again with the updated name and success state
    res.render('change-name.njk', {
      currentName: currentStoredName,
      csrfToken: csrfToken,
      formData: { fullName: '' }, // Clear the form
      error: null,
      successMessage: 'Name updated successfully'
    });
    
  } catch (error) {
    next(error);
  }
}