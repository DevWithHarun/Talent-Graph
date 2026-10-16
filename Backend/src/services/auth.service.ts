import { z } from 'zod';

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;

export class AuthService {
  async login(data: LoginInput) {
    return {
      ok: true,
      message: 'Login request accepted',
      user: {
        email: data.email,
        role: 'athlete',
      },
    };
  }
}
