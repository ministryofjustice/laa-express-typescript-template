import type { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { formatValidationErrors } from '../helpers/ValidationErrorHelpers.js';
import { extractFormFields } from '../helpers/dataTransformers.js';

// Extend Request interface for CSRF token support
interface RequestWithCSRF extends Request {
  csrfToken?: () => string;
}

// Store the current person data in memory (in a real app, this would be from a database)
let currentStoredName = 'John Smith'; // Default name
let currentStoredAddress = '123 Example Street\nExample City\nEX1 2MP'; // Default address
let currentStoredDateOfBirth = { day: '27', month: '3', year: '1986' }; // Default date of birth

/**
 * GET controller for rendering the person change form
 * @param {RequestWithCSRF} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export function getPerson(req: RequestWithCSRF, res: Response, next: NextFunction): void {
  try {
    const csrfToken = typeof req.csrfToken === 'function' ? req.csrfToken() : undefined;
    
    res.render('change-person.njk', {
      currentName: currentStoredName,
      currentAddress: currentStoredAddress,
      currentDateOfBirth: currentStoredDateOfBirth,
      csrfToken: csrfToken,
      formData: {},
      error: null
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST controller for handling person change requests
 * Processes validation results and formats errors for GOV.UK component display
 * @param {RequestWithCSRF} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export function postPerson(req: RequestWithCSRF, res: Response, next: NextFunction): void {
  try {
    const csrfToken = typeof req.csrfToken === 'function' ? req.csrfToken() : undefined;
    
    // Extract form fields for consistent handling
    const formFields = extractFormFields(req.body, [
      'fullName', 
      'address', 
      'dateOfBirth-day', 
      'dateOfBirth-month', 
      'dateOfBirth-year'
    ]);
    
    // Check for validation errors
    const validationErrors = validationResult(req);
    
    if (!validationErrors.isEmpty()) {
      // Use the new formatValidationErrors helper
      const { inputErrors, errorSummaryList } = formatValidationErrors(validationErrors);
      
      // Re-render the form with errors and preserve user input
      res.status(400).render('change-person.njk', {
        currentName: currentStoredName,
        currentAddress: currentStoredAddress,
        currentDateOfBirth: currentStoredDateOfBirth,
        csrfToken: csrfToken,
        formData: formFields,
        error: {
          inputErrors,
          errorSummaryList
        }
      });
      return;
    }
    
    // Success case - update the stored person data and show success
    currentStoredName = String(formFields.fullName); // Update the stored name
    currentStoredAddress = String(formFields.address); // Update the stored address
    currentStoredDateOfBirth = {
      day: String(formFields['dateOfBirth-day']),
      month: String(formFields['dateOfBirth-month']),
      year: String(formFields['dateOfBirth-year'])
    }; // Update the stored date of birth
    
    // Render the form again with the updated data and success state
    res.render('change-person.njk', {
      currentName: currentStoredName,
      currentAddress: currentStoredAddress,
      currentDateOfBirth: currentStoredDateOfBirth,
      csrfToken: csrfToken,
      formData: { 
        fullName: '', 
        address: '',
        'dateOfBirth-day': '',
        'dateOfBirth-month': '',
        'dateOfBirth-year': ''
      }, // Clear the form
      error: null,
      successMessage: 'Person details updated successfully'
    });
    
  } catch (error) {
    next(error);
  }
}