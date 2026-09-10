import { z } from 'zod';

export const CreateVerificationRequestSchema = z.object({
  id: z.string().min(1),
  athleteId: z.string().min(1),
  type: z.enum(['adult', 'minor']),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  requestedAt: z.string().datetime().optional(),
});

export type CreateVerificationRequestInput = z.infer<typeof CreateVerificationRequestSchema>;

const verificationRequests: CreateVerificationRequestInput[] = [
  {
    id: 'ver_001',
    athleteId: 'ath_001',
    type: 'adult',
    status: 'pending',
    requestedAt: new Date().toISOString(),
  },
];

export class VerificationService {
  list() {
    return { items: verificationRequests, total: verificationRequests.length };
  }

  create(data: CreateVerificationRequestInput) {
    verificationRequests.push(data);
    return data;
  }
}
