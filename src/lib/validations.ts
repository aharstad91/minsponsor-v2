import { z } from 'zod';

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
