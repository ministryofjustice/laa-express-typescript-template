/**
 * Example API Service
 * 
 * Simple demonstration of how to use BaseApiService for basic HTTP operations.
 * This example shows the minimal pattern without domain-specific logic that
 * template users would need to remove.
 * 
 * Template users should:
 * - Replace this with their own API service
 * - Add their own response types and transformations
 * - Implement their own business logic methods
 */

import { BaseApiService } from './BaseApiService.js';
import type { AxiosInstanceWrapper } from '#types/axios-instance-wrapper.js';
import type { AxiosResponse } from 'axios';

/**
 * Simple API Service for JSONPlaceholder demo
 * 
 * Demonstrates basic usage of BaseApiService without complex domain logic.
 * Template users can use this as a starting point for their own API services.
 */
export class ExampleApiService extends BaseApiService {
  constructor() {
    super({
      baseUrl: process.env.EXAMPLE_API_URL || 'https://jsonplaceholder.typicode.com',
      timeout: 10000,
      apiPrefix: '', // JSONPlaceholder doesn't use a prefix
      enableLogging: true
    });
  }

  /**
   * Get users from API - minimal example
   * 
   * @param axiosMiddleware - Axios middleware from request
   * @param params - Query parameters
   * @returns Promise resolving to raw axios response
   */
  async getUsers(
    axiosMiddleware: AxiosInstanceWrapper,
    params: Record<string, string | number | boolean> = {}
  ): Promise<AxiosResponse> {
    return this.get(axiosMiddleware, '/users', params);
  }

  /**
   * Get single user by ID - minimal example
   * 
   * @param axiosMiddleware - Axios middleware from request
   * @param userId - User ID to retrieve
   * @returns Promise resolving to raw axios response
   */
  async getUserById(
    axiosMiddleware: AxiosInstanceWrapper,
    userId: string | number
  ): Promise<AxiosResponse> {
    return this.get(axiosMiddleware, `/users/${userId}`);
  }

  /**
   * Create a new user - minimal example
   * 
   * @param axiosMiddleware - Axios middleware from request
   * @param userData - User data to create
   * @returns Promise resolving to raw axios response
   */
  async createUser(
    axiosMiddleware: AxiosInstanceWrapper,
    userData: unknown
  ): Promise<AxiosResponse> {
    return this.post(axiosMiddleware, '/users', userData);
  }
}

// Export singleton instance
export const exampleApiService = new ExampleApiService();