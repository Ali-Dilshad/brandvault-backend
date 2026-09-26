import { z } from 'zod';

// Same rule the frontend already enforces (Validators.password): at least
// 8 characters, containing at least one letter and one number. Checking
// it here too means the rule holds even for a client that skips it.
export const credentialsSchema = z.object({
  email: z.email('Enter a valid email address.').trim().toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.'),
});

export type Credentials = z.infer<typeof credentialsSchema>;
