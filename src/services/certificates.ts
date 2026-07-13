import { apiGet } from './api';
import type { Agency } from './agencies';

export type CertificateStatus = 'valid' | 'expired' | 'revoked';

export interface Certificate {
  id: number;
  agencyId: string;
  agency: Agency | null;
  certificateCode: string | null;
  status: CertificateStatus;
  validFrom: string | null;
  validUntil: string | null;
  scanUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export async function getCertificates(): Promise<Certificate[]> {
  return apiGet<Certificate[]>('/certificates');
}

export async function getCertificateById(id: number): Promise<Certificate | null> {
  try {
    return await apiGet<Certificate>(`/certificates/${id}`);
  } catch (error) {
    if ((error as { status?: number }).status === 404) {
      return null;
    }
    throw error;
  }
}
