import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address / ಮಾನ್ಯ ಇಮೇಲ್ ನಮೂದಿಸಿ'),
  password: z.string().min(6, 'Password must be at least 6 characters / ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳಿರಬೇಕು'),
});

export const bookingSchema = z
  .object({
    devoteeName: z.string().min(2, 'Devotee name is required'),
    mobileNumber: z.string().min(10, 'Valid mobile number is required'),
    sevaId: z.string().optional(),
    sevaIds: z.array(z.string()).optional().default([]),
    bookingDate: z.string().min(1, 'Select a booking date'),
    paymentMode: z.string().min(1, 'Choose a payment mode'),
    amountPayable: z.coerce.number().min(1, 'Amount must be greater than zero'),
    donation: z.coerce.number().min(0).default(0),
    address: z.string().optional(),
    gotra: z.string().optional(),
    nakshatra: z.string().optional(),
    raashi: z.string().optional(),
    paymentReferenceNumber: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasSingle = Boolean(data.sevaId);
    const hasMulti = Array.isArray(data.sevaIds) && data.sevaIds.filter(Boolean).length > 0;

    if (!hasSingle && !hasMulti) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sevaId'],
        message: 'Select at least one seva',
      });
    }
  });
