import { z } from 'zod';

export const CreateAthleteInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email().optional(),
  clubId: z.string().optional(),
  status: z.enum(['active', 'pending', 'inactive']).default('active'),
});

export type CreateAthleteInput = z.infer<typeof CreateAthleteInputSchema>;

const athletes: Array<CreateAthleteInput & { id: string }> = [
  { id: 'ath_001', name: 'Amina Njeri', email: 'amina@example.com', clubId: 'club_001', status: 'active' },
  { id: 'ath_002', name: 'Brian Otieno', email: 'brian@example.com', clubId: 'club_001', status: 'pending' },
];

export class AthleteService {
  list() {
    return { items: athletes, total: athletes.length };
  }

  getById(id: string) {
    const athlete = athletes.find((item) => item.id === id);
    return athlete ?? null;
  }

  create(data: CreateAthleteInput) {
    athletes.push(data);
    return data;
  }
}
