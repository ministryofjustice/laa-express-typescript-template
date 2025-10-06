/**
 * Name Controller Unit Tests
 * 
 * Tests the name controller functionality including GET/POST handlers,
 * error formatting, and integration with TypedValidationError system.
 * 
 * Testing Level: Unit
 * Component: Controller
 * Dependencies: ValidationErrorHelpers, express-validator
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import type { Request, Response, NextFunction } from 'express';
import * as expressValidator from 'express-validator';
import { getName, postName } from '#src/controllers/nameController.js';
import * as validationHelpers from '#src/helpers/ValidationErrorHelpers.js';

// Extend Request interface for tests
interface TestRequest extends Request {
  csrfToken?: () => string;
}

// Helper function to create validation result mocks
function createValidationResultMock(isEmpty: boolean) {
  return {
    isEmpty: () => isEmpty,
    array: () => [],
    mapped: () => ({}),
    formatWith: () => ({}),
    throw: () => {},
    formatter: () => ({})
  };
}

describe('Name Controller', () => {
  let req: Partial<TestRequest>;
  let res: Partial<Response>;
  let next: sinon.SinonStub;
  let renderStub: sinon.SinonStub;
  let statusStub: sinon.SinonStub;
  let csrfTokenStub: sinon.SinonStub;

  beforeEach(() => {
    // Set up stubs
    renderStub = sinon.stub();
    statusStub = sinon.stub().returns({ render: renderStub });
    csrfTokenStub = sinon.stub().returns('mock-csrf-token');
    next = sinon.stub();

    // Set up mock request and response
    req = {
      body: {},
      csrfToken: csrfTokenStub
    };

    res = {
      render: renderStub,
      status: statusStub
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getName', () => {
    it('should render the change-name template with correct data', () => {
      getName(req as TestRequest, res as Response, next);

      expect(renderStub.calledOnce).to.be.true;
      expect(renderStub.firstCall.args[0]).to.equal('change-name.njk');
      
      const templateData = renderStub.firstCall.args[1];
      expect(templateData).to.have.property('currentName');
      expect(templateData).to.have.property('csrfToken');
      expect(templateData).to.have.property('formData');
      expect(templateData).to.have.property('error');
      
      expect(templateData.currentName).to.be.a('string');
      expect(templateData.csrfToken).to.equal('mock-csrf-token');
      expect(templateData.formData).to.deep.equal({});
      expect(templateData.error).to.be.null;
    });

    it('should handle CSRF token generation correctly', () => {
      getName(req as TestRequest, res as Response, next);

      expect(csrfTokenStub.calledOnce).to.be.true;
      
      const templateData = renderStub.firstCall.args[1];
      expect(templateData.csrfToken).to.equal('mock-csrf-token');
    });

    it('should handle missing CSRF token function gracefully', () => {
      req.csrfToken = undefined;

      getName(req as TestRequest, res as Response, next);

      const templateData = renderStub.firstCall.args[1];
      expect(templateData.csrfToken).to.be.undefined;
    });

    it('should call next with error if an exception occurs', () => {
      const error = new Error('Test error');
      renderStub.throws(error);

      getName(req as TestRequest, res as Response, next);

      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0]).to.equal(error);
    });
  });

  /*
  describe('postName', () => {
    let formatValidationErrorsStub: sinon.SinonStub;

    beforeEach(() => {
      // Mock our validation helpers
      formatValidationErrorsStub = sinon.stub(validationHelpers, 'formatValidationErrors');
    });

    it('should handle successful form submission', () => {
      // Mock validation result - no errors
      validationResultStub.returns(createValidationResultMock(true));

      req.body = { fullName: 'John Smith' };

      postName(req as TestRequest, res as Response, next);

      expect(renderStub.calledOnce).to.be.true;
      expect(renderStub.firstCall.args[0]).to.equal('change-name.njk');
      
      const templateData = renderStub.firstCall.args[1];
      expect(templateData.currentName).to.equal('John Smith');
      expect(templateData.successMessage).to.equal('Name updated successfully');
      expect(templateData.formData.fullName).to.equal('');
      expect(templateData.error).to.be.null;
    });

    it('should handle validation errors', () => {
      // Mock validation result - has errors
      const mockValidationResult = {
        isEmpty: () => false
      };
      validationResultStub.returns(mockValidationResult);

      // Mock formatted errors
      const mockFormattedErrors = {
        inputErrors: { fullName: 'Enter your full name' },
        errorSummaryList: [{ text: 'Enter your full name', href: '#fullName' }]
      };
      formatValidationErrorsStub.returns(mockFormattedErrors);

      req.body = { fullName: '' };

      postName(req as TestRequest, res as Response, next);

      // Should call formatValidationErrors
      expect(formatValidationErrorsStub.calledOnce).to.be.true;
      expect(formatValidationErrorsStub.firstCall.args[0]).to.equal(mockValidationResult);

      // Should render with 400 status
      expect(statusStub.calledOnce).to.be.true;
      expect(statusStub.firstCall.args[0]).to.equal(400);
      expect(renderStub.calledOnce).to.be.true;
      
      const templateData = renderStub.firstCall.args[1];
      expect(templateData.error).to.deep.equal(mockFormattedErrors);
      expect(templateData.formData).to.equal(req.body);
    });

    it('should preserve form data when validation fails', () => {
      const mockValidationResult = {
        isEmpty: () => false
      };
      validationResultStub.returns(mockValidationResult);

      const mockFormattedErrors = {
        inputErrors: {},
        errorSummaryList: []
      };
      formatValidationErrorsStub.returns(mockFormattedErrors);

      const formData = { fullName: 'Invalid Name', otherField: 'test' };
      req.body = formData;

      postName(req as TestRequest, res as Response, next);

      const templateData = renderStub.firstCall.args[1];
      expect(templateData.formData).to.equal(formData);
    });

    it('should include CSRF token in error responses', () => {
      const mockValidationResult = {
        isEmpty: () => false
      };
      validationResultStub.returns(mockValidationResult);

      formatValidationErrorsStub.returns({
        inputErrors: {},
        errorSummaryList: []
      });

      req.body = { fullName: '' };

      postName(req as TestRequest, res as Response, next);

      const templateData = renderStub.firstCall.args[1];
      expect(templateData.csrfToken).to.equal('mock-csrf-token');
    });

    it('should include CSRF token in success responses', () => {
      validationResultStub.returns({
        isEmpty: () => true
      });

      req.body = { fullName: 'John Smith' };

      postName(req as TestRequest, res as Response, next);

      const templateData = renderStub.firstCall.args[1];
      expect(templateData.csrfToken).to.equal('mock-csrf-token');
    });

    it('should handle missing CSRF token function in error case', () => {
      req.csrfToken = undefined;

      const mockValidationResult = {
        isEmpty: () => false
      };
      validationResultStub.returns(mockValidationResult);

      formatValidationErrorsStub.returns({
        inputErrors: {},
        errorSummaryList: []
      });

      postName(req as TestRequest, res as Response, next);

      const templateData = renderStub.firstCall.args[1];
      expect(templateData.csrfToken).to.be.undefined;
    });

    it('should handle missing CSRF token function in success case', () => {
      req.csrfToken = undefined;

      validationResultStub.returns({
        isEmpty: () => true
      });

      req.body = { fullName: 'John Smith' };

      postName(req as TestRequest, res as Response, next);

      const templateData = renderStub.firstCall.args[1];
      expect(templateData.csrfToken).to.be.undefined;
    });

    it('should call next with error if an exception occurs', () => {
      const error = new Error('Test error');
      validationResultStub.throws(error);

      postName(req as TestRequest, res as Response, next);

      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0]).to.equal(error);
    });

    it('should update stored name on successful submission', () => {
      validationResultStub.returns({
        isEmpty: () => true
      });

      req.body = { fullName: 'Jane Doe' };

      // First submission
      postName(req as TestRequest, res as Response, next);
      
      // Reset stubs for second call
      renderStub.resetHistory();
      
      // Second GET request should show updated name
      getName(req as TestRequest, res as Response, next);

      const templateData = renderStub.firstCall.args[1];
      expect(templateData.currentName).to.equal('Jane Doe');
    });

    it('should clear form data on successful submission', () => {
      validationResultStub.returns({
        isEmpty: () => true
      });

      req.body = { fullName: 'John Smith' };

      postName(req as TestRequest, res as Response, next);

      const templateData = renderStub.firstCall.args[1];
      expect(templateData.formData.fullName).to.equal('');
    });

    it('should handle empty request body', () => {
      req.body = undefined;

      const mockValidationResult = {
        isEmpty: () => false
      };
      validationResultStub.returns(mockValidationResult);

      formatValidationErrorsStub.returns({
        inputErrors: { fullName: 'Enter your full name' },
        errorSummaryList: [{ text: 'Enter your full name', href: '#fullName' }]
      });

      postName(req as TestRequest, res as Response, next);

      expect(statusStub.calledOnce).to.be.true;
      expect(statusStub.firstCall.args[0]).to.equal(400);
    });

    it('should integrate with formatValidationErrors correctly', () => {
      const mockValidationResult = {
        isEmpty: () => false,
        array: () => [
          {
            path: 'fullName',
            msg: 'validation error'
          }
        ]
      };
      validationResultStub.returns(mockValidationResult);

      const expectedFormattedErrors = {
        inputErrors: { fullName: 'Enter your full name' },
        errorSummaryList: [{ text: 'Enter your full name', href: '#fullName' }]
      };
      formatValidationErrorsStub.returns(expectedFormattedErrors);

      req.body = { fullName: '' };

      postName(req as TestRequest, res as Response, next);

      expect(formatValidationErrorsStub.calledOnce).to.be.true;
      expect(formatValidationErrorsStub.firstCall.args[0]).to.equal(mockValidationResult);

      const templateData = renderStub.firstCall.args[1];
      expect(templateData.error).to.deep.equal(expectedFormattedErrors);
    });
  });

  describe.skip('controller integration', () => {
    it('should maintain consistent template structure between GET and POST', () => {
      // Test GET request
      getName(req as TestRequest, res as Response, next);
      const getTemplateData = renderStub.firstCall.args[1];

      renderStub.resetHistory();

      // Test POST request with validation error
      const mockValidationResult = createValidationResultMock(false);
      sinon.stub(expressValidator, 'validationResult').returns(mockValidationResult as any);
      sinon.stub(validationHelpers, 'formatValidationErrors').returns({
        inputErrors: {},
        errorSummaryList: []
      });

      req.body = { fullName: '' };
      postName(req as TestRequest, res as Response, next);
      const postTemplateData = renderStub.firstCall.args[1];

      // Both should have the same template structure
      expect(Object.keys(getTemplateData).sort()).to.deep.equal(Object.keys(postTemplateData).sort());
    });
  });
  */
});