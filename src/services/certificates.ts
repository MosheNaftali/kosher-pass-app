import { apiGet, type ApiRequestOptions } from './api';
import {
  certificateSchema,
  paginatedCertificatesSchema,
  type Certificate,
  type CertificateStatus,
  type PaginatedCertificates,
} from './schemas';

export type { Certificate, CertificateStatus, PaginatedCertificates };

export interface CertificateFilters {
  page?: number;
  agencyId?: string[];
  status?: CertificateStatus;
}

export function buildCertificatesQuery(filters: CertificateFilters): string {
  const params = new URLSearchParams();

  if (filters.page && filters.page > 1) {
    params.set('page', String(filters.page));
  }
  if (filters.agencyId?.length) {
    for (const id of filters.agencyId) {
      params.append('agencyId', id);
    }
  }
  if (filters.status) {
    params.set('status', filters.status);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function getCertificates(
  filters: CertificateFilters = {},
  options?: ApiRequestOptions
): Promise<PaginatedCertificates> {
  return apiGet(
    '/certificates' + buildCertificatesQuery(filters),
    paginatedCertificatesSchema,
    options
  );
}

export async function getCertificateById(
  id: number,
  options?: ApiRequestOptions
): Promise<Certificate | null> {
  try {
    return await apiGet(`/certificates/${id}`, certificateSchema, options);
  } catch (error) {
    if ((error as { status?: number }).status === 404) {
      return null;
    }
    throw error;
  }
}
