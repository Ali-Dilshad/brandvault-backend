import { z } from 'zod';
export const credentialsSchema = z.object({
  email: z.email('Enter a valid email address.').trim().toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.'),
});

export type Credentials = z.infer<typeof credentialsSchema>;
