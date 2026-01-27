import { z } from 'zod';

// Slug generator for URLs
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

// Admin: Organization validation schemas
export const organizationCreateSchema = z.object({
  name: z.string().min(2, 'Navn må være minst 2 tegn').max(100, 'Navn kan ikke være mer enn 100 tegn'),
  org_number: z.string().regex(/^\d{9}$/, 'Organisasjonsnummer må være 9 siffer'),
  category: z.string().min(1, 'Velg en kategori'),
  description: z.string().max(500, 'Beskrivelse kan ikke være mer enn 500 tegn').optional(),
  contact_email: z.string().email('Ugyldig e-postadresse'),
  contact_phone: z.string().optional(),
  logo_url: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().url('Ugyldig URL').optional().nullable()
  ),
  suggested_amounts: z.array(z.number().int().min(1000)).default([5000, 10000, 20000]),
});

export const organizationUpdateSchema = organizationCreateSchema.partial().omit({ org_number: true });

export type OrganizationCreateInput = z.infer<typeof organizationCreateSchema>;
export type OrganizationUpdateInput = z.infer<typeof organizationUpdateSchema>;

// Admin: Group validation schemas
export const groupCreateSchema = z.object({
  organization_id: z.string().uuid('Ugyldig organisasjons-ID'),
  name: z.string().min(2, 'Navn må være minst 2 tegn').max(100, 'Navn kan ikke være mer enn 100 tegn'),
  description: z.string().max(500, 'Beskrivelse kan ikke være mer enn 500 tegn').optional(),
  image_url: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().url('Ugyldig URL').optional().nullable()
  ),
});

export const groupUpdateSchema = groupCreateSchema.partial().omit({ organization_id: true });

export type GroupCreateInput = z.infer<typeof groupCreateSchema>;
export type GroupUpdateInput = z.infer<typeof groupUpdateSchema>;

// Admin: Individual validation schemas
export const individualCreateSchema = z.object({
  organization_id: z.string().uuid('Ugyldig organisasjons-ID'),
  group_id: z.string().uuid('Ugyldig gruppe-ID').optional().nullable(),
  first_name: z.string().min(1, 'Fornavn er påkrevd').max(50, 'Fornavn kan ikke være mer enn 50 tegn'),
  last_name: z.string().min(1, 'Etternavn er påkrevd').max(50, 'Etternavn kan ikke være mer enn 50 tegn'),
  birth_year: z.number().int().min(1900).max(new Date().getFullYear()).optional().nullable(),
  bio: z.string().max(500, 'Bio kan ikke være mer enn 500 tegn').optional(),
  photo_url: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().url('Ugyldig URL').optional().nullable()
  ),
  consent_given_by: z.string().min(1, 'Samtykke må registreres'),
});

export const individualUpdateSchema = individualCreateSchema.partial().omit({ organization_id: true, consent_given_by: true });

export type IndividualCreateInput = z.infer<typeof individualCreateSchema>;
export type IndividualUpdateInput = z.infer<typeof individualUpdateSchema>;

// Organization categories
export const organizationCategories = [
  { value: 'sports', label: 'Idrett' },
  { value: 'culture', label: 'Kultur' },
  { value: 'music', label: 'Musikk' },
  { value: 'youth', label: 'Ungdom' },
  { value: 'school', label: 'Skole' },
  { value: 'charity', label: 'Veldedighet' },
  { value: 'other', label: 'Annet' },
] as const;

// Checkout form validation schema
export const checkoutSchema = z.object({
  paymentMethod: z.enum(['stripe', 'vipps']),
  recipient: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('organization'),
      organizationId: z.string().uuid(),
    }),
    z.object({
      type: z.literal('group'),
      organizationId: z.string().uuid(),
      groupId: z.string().uuid(),
    }),
    z.object({
      type: z.literal('individual'),
      organizationId: z.string().uuid(),
      groupId: z.string().uuid().optional(),
      individualId: z.string().uuid(),
    }),
  ]),
  amount: z.number().int().min(1000).max(10000000), // Min 10 NOK, Max 100,000 NOK
  interval: z.enum(['monthly', 'one_time']),
  sponsorEmail: z.string().email(),
  sponsorName: z.string().optional(),
  sponsorPhone: z.string().optional(), // Required for Vipps, validated in handler
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// Norwegian phone number validation
export const norwegianPhoneSchema = z
  .string()
  .regex(/^(\+47|47|0047)?[2-9]\d{7}$/, 'Ugyldig norsk telefonnummer');

// Organization slug validation
export const slugSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[a-z0-9-]+$/, 'Kun små bokstaver, tall og bindestrek');

// Organization number validation (Norwegian format: 9 digits)
export const orgNumberSchema = z
  .string()
  .regex(/^\d{9}$/, 'Organisasjonsnummer må være 9 siffer');

// Email validation
export const emailSchema = z.string().email('Ugyldig e-postadresse');

// Amount validation (in øre)
export const amountSchema = z
  .number()
  .int()
  .min(1000, 'Minimum beløp er 10 kr')
  .max(10000000, 'Maksimum beløp er 100 000 kr');
