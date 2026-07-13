import { API_BASE_URL, apiGet } from './api';
import type { Agency } from './agencies';
import type { Certificate } from './certificates';

export type KashrutLevel = 'unknown' | 'pareve' | 'dairy' | 'meat' | 'dairy_chalav_yisrael';

export interface Product {
  id: number;
  name: string;
  nameSearch: string;
  brand: string | null;
  category: string | null;
  subCategory: string | null;
  productCode: string | null;
  kashrutLevel: KashrutLevel;
  isMehadrin: boolean;
  countryId: { id: number; label: string } | null;
  agencyId: Agency | null;
  certificateId: Certificate | null;
  active: boolean;
  notes: string | null;
  imgUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedProducts {
  data: Product[];
  total: number;
  page: number;
  lastPage: number;
}

export interface ProductFilters {
  page?: number;
  agencyId?: string;
  name?: string;
  category?: string;
  subCategory?: string;
  countryId?: number;
}

export function buildProductsQuery(filters: ProductFilters): string {
  const params = new URLSearchParams();

  if (filters.page && filters.page > 1) {
    params.set('page', String(filters.page));
  }
  if (filters.agencyId) {
    params.set('agencyId', filters.agencyId);
  }
  if (filters.name?.trim()) {
    params.set('name', filters.name.trim());
  }
  if (filters.category) {
    params.set('category', filters.category);
  }
  if (filters.subCategory) {
    params.set('subCategory', filters.subCategory);
  }
  if (filters.countryId !== undefined) {
    params.set('countryId', String(filters.countryId));
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function getProducts(filters: ProductFilters = {}): Promise<PaginatedProducts> {
  const query = buildProductsQuery(filters);
  return apiGet<PaginatedProducts>(`/products${query}`);
}

export async function getProductById(id: number): Promise<Product | null> {
  try {
    return await apiGet<Product>(`/products/${id}`);
  } catch (error) {
    if ((error as { status?: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

export async function searchProductByBarcode(barcode: string): Promise<Product | null> {
  const response = await getProducts({ name: barcode, page: 1 });
  return response.data.find(product => product.productCode === barcode) ?? null;
}

export { API_BASE_URL };
