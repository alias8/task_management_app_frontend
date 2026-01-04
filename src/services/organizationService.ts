import apiClient from './api';
import type { CreateOrganizationRequest, Organization } from '../types';

export const organizationService = {
  createOrganization: async (
    organizationRequest: CreateOrganizationRequest
  ): Promise<Organization> => {
    const response = await apiClient.post<Organization>(
      '/api/org',
      organizationRequest
    );
    return response.data;
  },
};
