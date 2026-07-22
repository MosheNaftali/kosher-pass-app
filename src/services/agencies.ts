import { apiGet } from './api';

export interface Agency {
  id: string;
  name: string;
  countryId: { id: number; code: string | null } | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  contactInfo: string | null;
  active: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export async function getAgencies(): Promise<Agency[]> {
  return apiGet<Agency[]>('/agencies');
}

export async function getAgencyById(id: string): Promise<Agency | null> {
  try {
    return await apiGet<Agency>(`/agencies/${id}`);
  } catch (error) {
    if ((error as { status?: number }).status === 404) {
      return null;
    }
    throw error;
  }
}
