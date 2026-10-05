import { z } from 'zod';

export const CreateAthleteInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email().optional(),
  clubId: z.string().optional(),
  status: z.enum(['active', 'pending', 'inactive']).default('active'),
});

export const UpdateAthleteProfileSchema = z.object({
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  preferredName: z.string().optional(),
  dob: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  residenceCountry: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  languages: z.string().optional(),
  bio: z.string().optional(),
  sport: z.string().optional(),
  primaryPosition: z.string().optional(),
  secondaryPosition: z.string().optional(),
  preferredFoot: z.string().optional(),
  playingStyle: z.string().optional(),
  currentLevel: z.string().optional(),
  currentClub: z.string().optional(),
  currentTeam: z.string().optional(),
  jerseyNumber: z.string().optional(),
  sportingStatus: z.string().optional(),
  isPublished: z.boolean().optional(),
  publishedAt: z.string().optional(),
});

export type CreateAthleteInput = z.infer<typeof CreateAthleteInputSchema>;
export type UpdateAthleteProfileInput = z.infer<typeof UpdateAthleteProfileSchema>;

export interface CareerTimelineEntry {
  id: string;
  season: string;
  club: string;
  team: string;
  role: string;
  period: string;
  competition: string;
  matches: number;
  starts: number;
  minutes: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  verificationStatus: 'verified' | 'pending' | 'conflicting' | 'unverified';
  source: string;
  evidenceUrl?: string;
  lastVerified?: string;
}

export interface CareerTransfer {
  id: string;
  fromClub: string;
  toClub: string;
  date: string;
  type: 'Transfer' | 'Promotion' | 'Loan' | 'Free Agent';
  status: 'Completed' | 'Pending' | 'In Review';
  fee?: string;
  contractStart: string;
  contractEnd: string;
  loanOrPermanent: 'Permanent' | 'Loan';
  source: string;
  verificationStatus: 'verified' | 'pending' | 'conflicting' | 'unverified';
}

export interface CareerAchievement {
  id: string;
  title: string;
  competition: string;
  season: string;
  organization: string;
  evidence: string;
  verificationStatus: 'verified' | 'pending' | 'conflicting' | 'unverified';
}

export interface InternationalRecord {
  country: string;
  squad: string;
  period: string;
  caps: number;
  starts: number;
  minutes: number;
  goals: number;
  assists: number;
  debut: string;
  tournaments: string[];
}

export interface CareerStatistics {
  offensive: {
    appearances: number;
    starts: number;
    minutes: number;
    goals: number;
    assists: number;
    shots: number;
    shotsOnTarget: number;
    keyPasses: number;
    chancesCreated: number;
  };
  defensive: {
    tackles: number;
    interceptions: number;
    clearances: number;
    blocks: number;
    recoveries: number;
    duels: number;
    aerialDuels: number;
  };
  discipline: {
    yellowCards: number;
    redCards: number;
    foulsCommitted: number;
    foulsSuffered: number;
    suspensions: number;
  };
  availability: {
    matchesAvailable: number;
    matchesMissed: number;
    injuryAbsence: number;
    suspensionAbsence: number;
    otherAbsence: number;
    totalDaysUnavailable: number;
  };
}

export interface CareerIntelligence {
  confidenceScore: number;
  confidenceBreakdown: {
    identity: number;
    clubHistory: number;
    statistics: number;
    achievements: number;
    availability: number;
  };
  insights: Array<{
    type: 'progression' | 'performance' | 'exposure' | 'availability';
    title: string;
    description: string;
    trend: 'up' | 'warning' | 'neutral';
  }>;
}

export interface FullCareerRecord {
  athleteId: string;
  careerStarted: string;
  careerStatus: 'Active' | 'Inactive' | 'Retired';
  totalSeasons: number;
  totalClubs: number;
  currentContract: {
    club: string;
    team: string;
    expires: string;
    status: string;
  };
  timeline: CareerTimelineEntry[];
  transfers: CareerTransfer[];
  achievements: CareerAchievement[];
  international: InternationalRecord[];
  statistics: CareerStatistics;
  records: Array<{ label: string; value: string }>;
  intelligence: CareerIntelligence;
  updatedAt: string;
}

export interface AthleteRecord {
  id: string;
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  preferredName?: string;
  dob?: string;
  gender?: string;
  nationality?: string;
  residenceCountry?: string;
  city?: string;
  phone?: string;
  email?: string;
  languages?: string;
  bio?: string;
  sport?: string;
  primaryPosition?: string;
  secondaryPosition?: string;
  preferredFoot?: string;
  playingStyle?: string;
  currentLevel?: string;
  currentClub?: string;
  currentTeam?: string;
  jerseyNumber?: string;
  sportingStatus?: string;
  clubId?: string;
  status: string;
  isPublished: boolean;
  publishedAt?: string;
  updatedAt: string;
}

const athletes: AthleteRecord[] = [
  {
    id: 'ath_001',
    name: 'Harun Nzai',
    firstName: 'Harun',
    lastName: 'Nzai',
    email: 'harun.nzai@example.com',
    sport: 'Football',
    primaryPosition: 'Forward',
    currentClub: 'AFC Leopards',
    currentTeam: 'First Team',
    status: 'active',
    isPublished: true,
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ath_002',
    name: 'Brian Otieno',
    firstName: 'Brian',
    lastName: 'Otieno',
    email: 'brian@example.com',
    sport: 'Football',
    primaryPosition: 'Forward',
    currentClub: 'AFC Leopards',
    status: 'pending',
    isPublished: false,
    updatedAt: new Date().toISOString(),
  },
];

// In-memory career database with verified sporting history
const careerStore: Record<string, FullCareerRecord> = {
  default: {
    athleteId: 'default',
    careerStarted: '2022',
    careerStatus: 'Active',
    totalSeasons: 4,
    totalClubs: 3,
    currentContract: {
      club: 'AFC Leopards',
      team: 'First Team',
      expires: 'June 2027',
      status: 'Active Professional Contract',
    },
    timeline: [
      {
        id: 'tl_2026',
        season: '2026',
        club: 'AFC Leopards',
        team: 'First Team',
        role: 'Forward',
        period: 'Jan 2026 – Present',
        competition: 'FKF Premier League',
        matches: 24,
        starts: 19,
        minutes: 1842,
        goals: 9,
        assists: 6,
        yellowCards: 3,
        redCards: 0,
        verificationStatus: 'verified',
        source: 'Official League Match Sheets (FKF)',
        lastVerified: '2026-10-01',
      },
      {
        id: 'tl_2025',
        season: '2025',
        club: 'Bandari FC',
        team: 'First Team',
        role: 'Forward',
        period: 'Jan 2025 – Dec 2025',
        competition: 'FKF Premier League',
        matches: 31,
        starts: 25,
        minutes: 2341,
        goals: 12,
        assists: 7,
        yellowCards: 4,
        redCards: 0,
        verificationStatus: 'verified',
        source: 'Bandari FC Official Record & League Passport',
        lastVerified: '2026-09-14',
      },
      {
        id: 'tl_2024',
        season: '2024',
        club: 'Mombasa United',
        team: 'U20 Squad',
        role: 'Forward',
        period: 'Jan 2024 – Dec 2024',
        competition: 'Regional Division One & Youth Cup',
        matches: 28,
        starts: 24,
        minutes: 2110,
        goals: 10,
        assists: 5,
        yellowCards: 2,
        redCards: 0,
        verificationStatus: 'verified',
        source: 'Mombasa United Academy Records',
        lastVerified: '2025-01-20',
      },
      {
        id: 'tl_2023',
        season: '2023',
        club: 'Mombasa United',
        team: 'Academy Squad',
        role: 'Forward',
        period: 'Jan 2023 – Dec 2023',
        competition: 'Coast Youth Championship',
        matches: 20,
        starts: 18,
        minutes: 1560,
        goals: 8,
        assists: 4,
        yellowCards: 1,
        redCards: 0,
        verificationStatus: 'verified',
        source: 'Academy Technical Register',
        lastVerified: '2024-02-10',
      },
    ],
    transfers: [
      {
        id: 'tr_1',
        fromClub: 'Mombasa United',
        toClub: 'Bandari FC',
        date: '10 Jan 2025',
        type: 'Transfer',
        status: 'Completed',
        fee: 'Undisclosed (Development Fee)',
        contractStart: 'Jan 2025',
        contractEnd: 'Dec 2025',
        loanOrPermanent: 'Permanent',
        source: 'Club Announcement & FKF Transfer Portal',
        verificationStatus: 'verified',
      },
      {
        id: 'tr_2',
        fromClub: 'Bandari FC',
        toClub: 'AFC Leopards',
        date: '12 Jan 2026',
        type: 'Transfer',
        status: 'Completed',
        fee: 'Premier League Domestic Transfer',
        contractStart: 'Jan 2026',
        contractEnd: 'June 2027',
        loanOrPermanent: 'Permanent',
        source: 'Club Announcement & TMS Match Confirmation',
        verificationStatus: 'verified',
      },
    ],
    achievements: [
      {
        id: 'ach_1',
        title: '🏆 FKF Cup Winner',
        competition: 'FKF President Cup',
        season: '2025',
        organization: 'Football Kenya Federation',
        evidence: 'Official Matchday Roster & Winner Medal Scan',
        verificationStatus: 'verified',
      },
      {
        id: 'ach_2',
        title: '🥇 Top Scorer (Bandari FC)',
        competition: 'FKF Premier League',
        season: '2025',
        organization: 'Bandari FC Technical Staff',
        evidence: 'End of Season Award Ceremony & Match Logs',
        verificationStatus: 'verified',
      },
      {
        id: 'ach_3',
        title: '⭐ Player of the Month',
        competition: 'FKF Premier League',
        season: 'September 2025',
        organization: 'League Players Association',
        evidence: 'SJG Player of the Month Citation',
        verificationStatus: 'verified',
      },
      {
        id: 'ach_4',
        title: '🇰🇪 Kenya U20 National Team Selection',
        competition: 'CECAFA U20 Championship',
        season: '2024',
        organization: 'Football Kenya Federation (FKF)',
        evidence: 'National Team Call-Up Letter & Matchday Sheet',
        verificationStatus: 'verified',
      },
    ],
    international: [
      {
        country: 'Kenya 🇰🇪',
        squad: 'U20 Squad',
        period: '2024–2025',
        caps: 8,
        starts: 6,
        minutes: 580,
        goals: 3,
        assists: 2,
        debut: '14 May 2024 vs Uganda U20',
        tournaments: ['CECAFA U20 Cup', 'AFCON U20 Qualifiers'],
      },
      {
        country: 'Kenya 🇰🇪',
        squad: 'Senior National Team (Harambee Stars)',
        period: '2026–Present',
        caps: 4,
        starts: 2,
        minutes: 245,
        goals: 1,
        assists: 1,
        debut: '22 Mar 2026 vs Zambia',
        tournaments: ['International Friendlies', 'CHAN Qualifiers'],
      },
    ],
    statistics: {
      offensive: {
        appearances: 86,
        starts: 71,
        minutes: 6853,
        goals: 31,
        assists: 18,
        shots: 114,
        shotsOnTarget: 68,
        keyPasses: 46,
        chancesCreated: 39,
      },
      defensive: {
        tackles: 42,
        interceptions: 29,
        clearances: 14,
        blocks: 8,
        recoveries: 64,
        duels: 188,
        aerialDuels: 52,
      },
      discipline: {
        yellowCards: 9,
        redCards: 0,
        foulsCommitted: 38,
        foulsSuffered: 62,
        suspensions: 0,
      },
      availability: {
        matchesAvailable: 92,
        matchesMissed: 6,
        injuryAbsence: 4,
        suspensionAbsence: 0,
        otherAbsence: 2,
        totalDaysUnavailable: 22,
      },
    },
    records: [
      { label: 'Most goals in a season', value: '12 — 2025 (Bandari FC)' },
      { label: 'Most appearances in a season', value: '31 — 2025' },
      { label: 'Most assists in a season', value: '7 — 2025' },
      { label: 'Fastest match goal', value: '00:47 vs Tusker FC' },
      { label: 'Longest consecutive scoring streak', value: '5 matches (Aug–Sep 2025)' },
    ],
    intelligence: {
      confidenceScore: 91,
      confidenceBreakdown: {
        identity: 98,
        clubHistory: 95,
        statistics: 89,
        achievements: 100,
        availability: 76,
      },
      insights: [
        {
          type: 'progression',
          title: 'Rapid Promotion Trajectory',
          description: 'The athlete moved from U20 to Senior First Team starter in premier division within 12 months.',
          trend: 'up',
        },
        {
          type: 'performance',
          title: 'Scoring Efficiency Surge',
          description: 'Goals per 90 escalated from 0.31 to 0.47 in the 2025–2026 competitive seasons.',
          trend: 'up',
        },
        {
          type: 'exposure',
          title: 'Senior International Debut',
          description: 'Athlete entered senior international competition in 2026 with Harambee Stars.',
          trend: 'up',
        },
        {
          type: 'availability',
          title: 'Strong Availability Index',
          description: 'Missed only 6 matches across 4 seasons (93.5% availability rating, favorable for insurance underwriting).',
          trend: 'neutral',
        },
      ],
    },
    updatedAt: new Date().toISOString(),
  },
};

export class AthleteService {
  list() {
    return { items: athletes, total: athletes.length };
  }

  getById(id: string) {
    const athlete = athletes.find((item) => item.id === id);
    return athlete ?? null;
  }

  create(data: CreateAthleteInput) {
    const newAthlete: AthleteRecord = {
      ...data,
      isPublished: false,
      updatedAt: new Date().toISOString(),
    };
    athletes.push(newAthlete);
    return newAthlete;
  }

  update(id: string, data: UpdateAthleteProfileInput) {
    let athlete = athletes.find((item) => item.id === id);
    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();

    if (!athlete) {
      athlete = {
        id,
        name: fullName || 'Athlete',
        status: 'active',
        isPublished: data.isPublished ?? false,
        updatedAt: new Date().toISOString(),
        ...data,
      };
      athletes.push(athlete);
      return athlete;
    }

    Object.assign(athlete, {
      ...data,
      name: fullName || athlete.name,
      updatedAt: new Date().toISOString(),
    });

    return athlete;
  }

  publish(id: string, isPublished: boolean) {
    let athlete = athletes.find((item) => item.id === id);
    if (!athlete) {
      athlete = {
        id,
        name: 'Athlete',
        status: 'active',
        isPublished,
        publishedAt: isPublished ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      };
      athletes.push(athlete);
      return athlete;
    }

    athlete.isPublished = isPublished;
    if (isPublished) {
      athlete.publishedAt = new Date().toISOString();
    }
    athlete.updatedAt = new Date().toISOString();
    return athlete;
  }

  // ── CAREER DATA PLATFORM (FOR RISK & VERIFIED TIMELINE) ──
  getCareer(id: string): FullCareerRecord {
    if (careerStore[id]) {
      return careerStore[id];
    }
    const defaultData = careerStore['default'];
    return {
      ...defaultData,
      athleteId: id,
    };
  }

  updateCareer(id: string, data: Partial<FullCareerRecord>): FullCareerRecord {
    const current = this.getCareer(id);
    const updated: FullCareerRecord = {
      ...current,
      ...data,
      athleteId: id,
      updatedAt: new Date().toISOString(),
    };
    careerStore[id] = updated;
    return updated;
  }

  addTimelineEntry(id: string, entry: Omit<CareerTimelineEntry, 'id'>): CareerTimelineEntry {
    const career = this.getCareer(id);
    const newEntry: CareerTimelineEntry = {
      ...entry,
      id: `tl_${Date.now()}`,
    };
    career.timeline.unshift(newEntry);
    career.totalSeasons = new Set(career.timeline.map((t) => t.season)).size;
    career.totalClubs = new Set(career.timeline.map((t) => t.club)).size;
    career.updatedAt = new Date().toISOString();
    careerStore[id] = career;
    return newEntry;
  }

  addTransfer(id: string, transfer: Omit<CareerTransfer, 'id'>): CareerTransfer {
    const career = this.getCareer(id);
    const newTransfer: CareerTransfer = {
      ...transfer,
      id: `tr_${Date.now()}`,
    };
    career.transfers.unshift(newTransfer);
    career.updatedAt = new Date().toISOString();
    careerStore[id] = career;
    return newTransfer;
  }

  addAchievement(id: string, achievement: Omit<CareerAchievement, 'id'>): CareerAchievement {
    const career = this.getCareer(id);
    const newAchievement: CareerAchievement = {
      ...achievement,
      id: `ach_${Date.now()}`,
    };
    career.achievements.unshift(newAchievement);
    career.updatedAt = new Date().toISOString();
    careerStore[id] = career;
    return newAchievement;
  }
}
