import type { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Controller for handling name change requests
 * Processes validation results and formats errors for GOV.UK component display
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export function postName(req: Request, res: Response, next: NextFunction): void {
  try {
    // Check for validation errors
    const validationErrors = validationResult(req);
    
    if (!validationErrors.isEmpty()) {
      const rawErrors = validationErrors.array();
      
      // Format errors for GOV.UK error summary and field display
      const inputErrors: Record<string, string> = {};
      const errorSummaryList: Array<{ text: string; href: string }> = [];
      
      rawErrors.forEach((error) => {
        const fieldName = 'path' in error && typeof error.path === 'string' ? error.path : 'fullName';
        const errorMessage = typeof error.msg === 'string' ? error.msg : 'Invalid value';
        
        // Store field-level error for inline display
        inputErrors[fieldName] = errorMessage;
        
        // Store summary error for error summary component
        errorSummaryList.push({
          text: errorMessage,
          href: `#${fieldName}`
        });
      });
      
      // Send JSON response with GOV.UK compatible error structure
      res.status(400).json({
        success: false,
        errors: {
          inputErrors,
          errorSummaryList
        },
        formData: req.body
      });
      return;
    }
    
    // Success case - process the valid name
    const { fullName } = req.body;
    
    res.status(200).json({
      success: true,
      message: 'Name updated successfully',
      data: {
        fullName: fullName
      }
    });
    
  } catch (error) {
    next(error);
  }
}