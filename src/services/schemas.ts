import { z } from 'zod';

/**
 * Runtime schemas for every API response.
 *
 * The app's whole purpose is telling someone whether a product is kosher. That
 * makes the API payload the asset worth protecting: a malformed or tampered
 * response must not be able to reach the UI and render a confident answer built
 * on garbage. `response.json() as T` - the previous approach - is a lie the
 * compiler cannot catch, because a cast checks nothing at runtime.
 *
 * The TypeScript types are *inferred from these schemas*, so the validation and
 * the types can never drift apart. Adding a field means adding it here, once.
 *
 * Tolerance is deliberate and asymmetric:
 *   - Unknown extra properties are stripped, not rejected, so the server can add
 *     a field without breaking every deployed app.
 *   - A missing or wrong-typed field on a *required* property is a hard failure,
 *     because rendering "pareve" from an absent `kashrutLevel` is worse than
 *     showing an error.
 *   - Optional/nullable fields are normalized to `null`, so screens have one
 *     shape to check instead of three.
 */

/** Absent, null and empty-string all collapse to `null`. */
const nullableString = z
  .string()
  .nullish()
  .transform(value => (value === undefined || value === '' ? null : value));

/**
 * A server timestamp. Kept as the raw ISO string (the app formats it with the
 * device locale) but validated as parseable, because `freshness.ts` does date
 * arithmetic on it and an unparseable value silently becomes "outdated".
 */
const isoDateString = z
  .string()
  .refine(value => !Number.isNaN(new Date(value).getTime()), {
    message: 'Expected a parseable ISO date string',
  });

const nullableIsoDateString = z
  .string()
  .nullish()
  .transform(value => (value === undefined || value === '' ? null : value))
  .refine(value => value === null || !Number.isNaN(new Date(value).getTime()), {
    message: 'Expected a parseable ISO date string or null',
  });

/**
 * Kashrut level. Unlike other enums this one **falls back** rather than failing:
 * if the server introduces a level an older app does not know, showing
 * "unknown" is safe and truthful, while rejecting the whole product would hide
 * a real item from someone standing in a shop.
 */
export const kashrutLevelSchema = z
  .enum(['unknown', 'pareve', 'dairy', 'meat', 'dairy_chalav_yisrael'])
  .catch('unknown');

export const certificateStatusSchema = z
  .enum(['valid', 'expired', 'revoked'])
  .catch('expired');

/** Metadata is free-form server JSON; it is passed through, never trusted. */
const metadataSchema = z.record(z.string(), z.unknown()).nullish().transform(v => v ?? null);

export const countryRefSchema = z.object({
  id: z.number(),
  code: nullableString,
});

/**
 * Anti-corruption boundary.
 *
 * The API mirrors the server's TypeORM entities, where a relation column is
 * named after its foreign key even though it carries the whole related row -
 * `agencyId` is an `Agency`, not an id. Propagating that into the UI made every
 * screen read `product.agencyId.logoUrl`, which is actively misleading.
 *
 * The wire names are accepted here and renamed once, so everything above this
 * file speaks the domain's language: `agency`, `certificate`, `country`.
 */
const agencyWireSchema = z.object({
  id: z.string(),
  name: z.string(),
  countryId: countryRefSchema.nullish().transform(v => v ?? null),
  websiteUrl: nullableString,
  logoUrl: nullableString,
  contactInfo: nullableString,
  active: z.boolean().catch(true),
  metadata: metadataSchema,
  createdAt: isoDateString,
  updatedAt: isoDateString,
});

export const agencySchema = agencyWireSchema.transform(({ countryId, ...agency }) => ({
  ...agency,
  country: countryId,
}));

export const certificateSchema = z.object({
  id: z.number(),
  // A genuine foreign key here: the server sends the agency's string id.
  agencyId: z.string(),
  agency: agencySchema.nullish().transform(v => v ?? null),
  certificateCode: nullableString,
  status: certificateStatusSchema,
  validFrom: nullableIsoDateString,
  validUntil: nullableIsoDateString,
  scanUrl: nullableString,
  metadata: metadataSchema,
  createdAt: isoDateString,
  updatedAt: isoDateString,
});

const productWireSchema = z.object({
  id: z.number(),
  name: z.string(),
  // `nameSearch` is `select: false` on the entity, so it is usually absent.
  nameSearch: z.string().nullish().transform(v => v ?? null),
  brand: nullableString,
  category: nullableString,
  subCategory: nullableString,
  barcode: nullableString,
  externalId: nullableString,
  kashrutLevel: kashrutLevelSchema,
  isMehadrin: z.boolean().catch(false),
  countryId: countryRefSchema.nullish().transform(v => v ?? null),
  agencyId: agencySchema.nullish().transform(v => v ?? null),
  certificateId: certificateSchema.nullish().transform(v => v ?? null),
  active: z.boolean().catch(true),
  notes: nullableString,
  imgUrl: nullableString,
  createdAt: isoDateString,
  updatedAt: isoDateString,
});

export const productSchema = productWireSchema.transform(
  ({ countryId, agencyId, certificateId, ...product }) => ({
    ...product,
    country: countryId,
    agency: agencyId,
    certificate: certificateId,
  })
);

export const paginatedProductsSchema = z.object({
  data: z.array(productSchema),
  total: z.number(),
  page: z.number(),
  lastPage: z.number(),
});

export const countryWithAgenciesSchema = z.object({
  id: z.number(),
  code: nullableString,
  continent: z.string(),
  agencies: z.array(agencyWireSchema.pick({ id: true, name: true })),
});

/** Envelope shared by every paginated endpoint. */
function paginated<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: z.array(item),
    total: z.number(),
    page: z.number(),
    lastPage: z.number(),
  });
}

export const paginatedAgenciesSchema = paginated(agencySchema);
export const paginatedCertificatesSchema = paginated(certificateSchema);
export const countryWithAgenciesListSchema = z.array(countryWithAgenciesSchema);

export type KashrutLevel = z.infer<typeof kashrutLevelSchema>;
export type CertificateStatus = z.infer<typeof certificateStatusSchema>;
export type Agency = z.infer<typeof agencySchema>;
export type Certificate = z.infer<typeof certificateSchema>;
export type Product = z.infer<typeof productSchema>;
export type PaginatedProducts = z.infer<typeof paginatedProductsSchema>;
export type PaginatedAgencies = z.infer<typeof paginatedAgenciesSchema>;
export type PaginatedCertificates = z.infer<typeof paginatedCertificatesSchema>;
export type CountryWithAgencies = z.infer<typeof countryWithAgenciesSchema>;
export type CountryRef = z.infer<typeof countryRefSchema>;

/**
 * A paginated list where individual bad rows are dropped instead of failing the
 * whole page.
 *
 * One corrupt product should not blank the entire catalog screen. The rejected
 * rows are surfaced through `onInvalid` so the caller can report them - a
 * silently shorter list is a data-quality bug that would otherwise never
 * surface.
 */
export function resilientProductPage(onInvalid: (issues: string[]) => void) {
  return z
    .object({
      data: z.array(z.unknown()),
      total: z.number(),
      page: z.number(),
      lastPage: z.number(),
    })
    .transform(page => {
      const valid: Product[] = [];
      const issues: string[] = [];

      for (const row of page.data) {
        const parsed = productSchema.safeParse(row);
        if (parsed.success) {
          valid.push(parsed.data);
        } else {
          issues.push(parsed.error.issues.map(i => i.path.join('.')).join(', '));
        }
      }

      if (issues.length > 0) {
        onInvalid(issues);
      }

      return { ...page, data: valid };
    });
}
