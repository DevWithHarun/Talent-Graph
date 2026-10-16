// TEMPORARY preview harness — delete after visual check
import { useEffect } from 'react';
import { AthleteDashboard } from '@/components/dashboard/athlete-dashboard';
const profile: any = {
  uid: 'preview-uid', firstName: 'Harun', lastName: 'Nzai', username: 'harun', sport: 'Football',
  position: 'Forward', altPositions: ['Winger'], clubName: 'AFC Leopards', clubStatus: 'active', affiliatedClubId: 'x',
  isVerified: true, readinessTier: 'Advanced', riskIndex: 12, performanceIndex: 78, efficiencyIndex: 71,
  consistencyIndex: 84, compositeScoutingIndex: 81, photoUrl: 'https://i.pravatar.cc/150?img=12',
  matchHistory: [{ id: 'm1', updatedAt: new Date().toISOString() }], previousTeams: [],
};
export default function Preview() {
  const p = new URLSearchParams(window.location.search);
  useEffect(() => { const s = Number(p.get('scroll')); if (s) setTimeout(() => window.scrollTo(0, s), 5000); }, []);
  if (p.get('frame')) {
    const f = (q: string) => <iframe src={`/__preview-athlete?${q}`} style={{ width: 390, height: 844, border: 0, background: '#fff' }} />;
    return <div style={{ display: 'flex', gap: 16, background: '#cbd5e1' }}>{f('a=1')}{f('scroll=850')}</div>;
  }
  return <AthleteDashboard userAccount={{ uid: 'preview-uid', role: 'athlete' } as any} athleteProfile={profile} />;
}
