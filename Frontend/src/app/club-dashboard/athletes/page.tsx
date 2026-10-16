'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  Search,
  MoreHorizontal,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  ArrowRightLeft,
  Trash2,
  MessageSquare,
  Eye,
  Users,
  LayoutGrid,
} from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, limit, doc, updateDoc, getDoc, writeBatch, setDoc, deleteDoc } from 'firebase/firestore';
import type { AthleteProfile, ClubMember } from '@/lib/types';

const POSITIONS = ['Goalkeeper', 'Defence', 'Midfield', 'Wingers', 'Forwards', 'Strikers'];
const STAFF_ROLES = new Set(['coach', 'assistant_coach', 'gk_coach', 'fitness_coach', 'scout', 'analyst', 'video_analyst', 'physio', 'doctor', 'kit_manager', 'staff']);
const TINTS = ['#9B7BE8', '#3FB6C9', '#E8A33D', '#3DDC84', '#E8544A', '#5B8DEF'];
const ORG_TIERS = [
  { key: 'head', label: 'Head Coach', match: ['head coach', 'manager'] },
  { key: 'assistant', label: 'Assistant Coaches', match: ['assistant coach', 'gk coach', 'fitness coach', 'coach'] },
  { key: 'specialist', label: 'Specialists & Scouts', match: ['scout', 'physio', 'analyst', 'doctor', 'nutritionist'] },
];
const STATUS_COLOR = { fit: '#3DDC84', knock: '#E8A33D', out: '#E8544A' } as const;

function normalizePosition(raw?: string) {
  const value = (raw || '').toLowerCase();
  if (!value) return 'Forwards';
  if (value.includes('goal') || value.includes('keeper') || value.includes('gk')) return 'Goalkeeper';
  if (value.includes('def') || value.includes('back') || value.includes('centre') || value.includes('cb') || value.includes('lb') || value.includes('rb')) return 'Defence';
  if (value.includes('mid') || value.includes('cm') || value.includes('dm') || value.includes('am')) return 'Midfield';
  if (value.includes('wing') || value.includes('wide') || value.includes('rw') || value.includes('lw')) return 'Wingers';
  if (value.includes('forward') || value.includes('striker') || value.includes('attacker')) return 'Forwards';
  return 'Forwards';
}

function getInitials(name: string) {
  const value = (name || '').trim();
  if (!value) return '?';
  const parts = value.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getPlayerName(player: AthleteProfile) {
  const first = player.firstName || '';
  const last = player.lastName || '';
  if (first && last) return `${first} ${last}`;
  if (player.username) return player.username;
  return 'Unknown Athlete';
}

function getCsiValue(player: AthleteProfile) {
  return Number(player.compositeScoutingIndex ?? player.performanceIndex ?? player.talentGraphScore ?? 0);
}

function tierForRole(role: string) {
  const r = role.toLowerCase();
  for (const tier of ORG_TIERS) {
    if (tier.match.some((match) => r.includes(match))) return tier.key;
  }
  return 'other';
}

function emptyPositionMap(): Record<string, any[]> {
  return Object.fromEntries(POSITIONS.map((position) => [position, []]));
}

function buildTeamTiers(athletes: AthleteProfile[]) {
  const map = new Map<string, { id: string; name: string; players: Record<string, any[]> }>();
  const defaultName = 'First XI / Team A';

  const ensureTier = (teamName: string) => {
    const key = teamName || defaultName;
    if (!map.has(key)) {
      map.set(key, { id: key, name: key, players: emptyPositionMap() });
    }
    return map.get(key)!;
  };

  for (const athlete of athletes) {
    const teamName = athlete.team && athlete.team.trim() ? athlete.team : defaultName;
    const tier = ensureTier(teamName);
    const normalized = normalizePosition(athlete.position);
    tier.players[normalized].push({
      id: athlete.uid,
      name: getPlayerName(athlete),
      age: athlete.age || 0,
      csi: getCsiValue(athlete),
      verified: Boolean(athlete.isVerified),
      status: athlete.isVerified ? 'fit' : 'knock',
      tint: '#3FB6C9',
      photoUrl: athlete.photoUrl || '',
    });
  }

  return Array.from(map.values());
}

function CSIring({ value }: { value: number }) {
  const safeValue = Number.isFinite(value) ? Math.min(Math.max(value, 0), 100) : 0;
  const pct = safeValue / 100;
  const radius = 15;
  const circumference = 2 * Math.PI * radius;

  return (
    <div style={{ position: 'relative', width: 34, height: 34, flexShrink: 0 }}>
      <svg width="34" height="34" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="17" cy="17" r={radius} fill="none" stroke="#232B2E" strokeWidth="3" />
        <circle
          cx="17"
          cy="17"
          r={radius}
          fill="none"
          stroke="#3DDC84"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          fontWeight: 600,
          color: '#EDF2F1',
        }}
      >
        {safeValue}
      </div>
    </div>
  );
}

function Avatar({ initials, tint }: { initials: string; tint?: string }) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        flexShrink: 0,
        background: tint ? `${tint}22` : '#1A2226',
        border: `1px solid ${tint ? `${tint}55` : '#232B2E'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 600,
        color: tint || '#8A9699',
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      {initials}
    </div>
  );
}

function PlayerAvatar({ photoUrl, initials, tint }: { photoUrl?: string; initials: string; tint?: string }) {
  const hasPhoto = Boolean(photoUrl && photoUrl.trim());

  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        flexShrink: 0,
        overflow: 'hidden',
        position: 'relative',
        border: `1px solid ${tint ? `${tint}55` : '#232B2E'}`,
        background: tint ? `${tint}22` : '#1A2226',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {hasPhoto ? (
        <img
          src={photoUrl}
          alt={initials}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={(event) => {
            const target = event.currentTarget as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      ) : null}
      {!hasPhoto || (hasPhoto && false) ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: tint || '#8A9699',
            fontFamily: 'JetBrains Mono, monospace',
            background: tint ? `${tint}22` : '#1A2226',
          }}
        >
          {initials}
        </div>
      ) : null}
      {!hasPhoto ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: tint || '#8A9699',
            fontFamily: 'JetBrains Mono, monospace',
            background: tint ? `${tint}22` : '#1A2226',
          }}
        >
          {initials}
        </div>
      ) : null}
    </div>
  );
}

function OverflowMenu({ onAction, onClose }: { onAction: (action: string) => void; onClose: () => void }) {
  const items = [
    { key: 'view', label: 'View & edit details', icon: Eye },
    { key: 'transfer', label: 'Transfer position', icon: ArrowRightLeft },
    { key: 'message', label: 'Message player', icon: MessageSquare },
    { key: 'delete', label: 'Delete player', icon: Trash2, danger: true },
  ];

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 30,
          zIndex: 20,
          background: '#161D20',
          border: '1px solid #232B2E',
          borderRadius: 10,
          minWidth: 190,
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,.4)',
        }}
      >
        {items.map(({ key, label, icon: Icon, danger }) => (
          <button
            key={key}
            onClick={() => {
              onAction(key);
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '10px 12px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              color: danger ? '#E8544A' : '#F2F5F4',
              fontSize: 13,
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>
    </>
  );
}

function TransferModal({
  fromPosition,
  count,
  onConfirm,
  onClose,
}: {
  fromPosition: string;
  count: number;
  onConfirm: (target: string) => void;
  onClose: () => void;
}) {
  const [target, setTarget] = useState(POSITIONS.find((position) => position !== fromPosition) || POSITIONS[0]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} style={{ background: '#12181B', border: '1px solid #232B2E', borderTopLeftRadius: 18, borderTopRightRadius: 18, width: '100%', maxWidth: 420, padding: '18px 18px 24px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Transfer position</div>
        <div style={{ fontSize: 12.5, color: '#8A9699', marginBottom: 16 }}>
          Move {count > 1 ? `${count} players` : 'player'} from <b style={{ color: '#F2F5F4' }}>{fromPosition}</b> to:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {POSITIONS.filter((position) => position !== fromPosition).map((position) => (
            <button
              key={position}
              onClick={() => setTarget(position)}
              style={{
                padding: '7px 12px',
                borderRadius: 9,
                fontSize: 12.5,
                cursor: 'pointer',
                border: `1px solid ${target === position ? '#3DDC84' : '#232B2E'}`,
                background: target === position ? '#3DDC8422' : '#0D1214',
                color: target === position ? '#3DDC84' : '#C7D0D2',
                fontWeight: target === position ? 600 : 400,
              }}
            >
              {position}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1px solid #232B2E', background: 'transparent', color: '#8A9699', fontSize: 13.5, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onConfirm(target)} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', background: '#3DDC84', color: '#04120A', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>Confirm transfer</button>
        </div>
      </div>
    </div>
  );
}

function AddStaffModal({ onConfirm, onClose }: { onConfirm: (name: string, role: string) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const canSave = name.trim() && role.trim();

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} style={{ background: '#12181B', border: '1px solid #232B2E', borderTopLeftRadius: 18, borderTopRightRadius: 18, width: '100%', maxWidth: 420, padding: '18px 18px 24px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Add staff member</div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11.5, color: '#8A9699', marginBottom: 5 }}>NAME</div>
          <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Wanjiru Kamau" style={{ width: '100%', background: '#0D1214', border: '1px solid #232B2E', borderRadius: 10, padding: '10px 12px', color: '#F2F5F4', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11.5, color: '#8A9699', marginBottom: 5 }}>ROLE</div>
          <input value={role} onChange={(event) => setRole(event.target.value)} placeholder="e.g. Physio, Assistant Coach" style={{ width: '100%', background: '#0D1214', border: '1px solid #232B2E', borderRadius: 10, padding: '10px 12px', color: '#F2F5F4', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1px solid #232B2E', background: 'transparent', color: '#8A9699', fontSize: 13.5, cursor: 'pointer' }}>Cancel</button>
          <button disabled={!canSave} onClick={() => canSave && onConfirm(name.trim(), role.trim())} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', background: canSave ? '#3DDC84' : '#1E2629', color: canSave ? '#04120A' : '#5C6669', fontSize: 13.5, fontWeight: 700, cursor: canSave ? 'pointer' : 'default' }}>Add staff</button>
        </div>
      </div>
    </div>
  );
}

function PitchPlayer({ player }: { player: { id: string | number; name: string; csi: number } }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 64 }}>
      <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#1A2226', border: '2px solid #2E3A3D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#E8ECEC', fontFamily: 'JetBrains Mono, monospace', boxShadow: '0 2px 6px rgba(0,0,0,.35)' }}>
        {player.name
          .split(' ')
          .map((part) => part[0])
          .join('')
          .slice(0, 2)}
      </div>
      <div style={{ marginTop: -8, background: '#3DDC84', color: '#04120A', fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, fontWeight: 700, borderRadius: 6, padding: '1px 6px', border: '2px solid #0F2A1B' }}>{player.csi}</div>
      <div style={{ marginTop: 4, fontSize: 10.5, color: '#EDF2F1', textAlign: 'center', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 68 }}>{player.name}</div>
    </div>
  );
}

function PitchRow({ players }: { players: { id: string | number; name: string; csi: number }[] }) {
  if (players.length === 0) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-evenly', width: '100%', padding: '10px 6px' }}>
      {players.map((player) => (
        <PitchPlayer key={player.id} player={player} />
      ))}
    </div>
  );
}

function LineupView({ tier, onBack, onClose }: { tier: any; onBack: () => void; onClose: () => void }) {
  const rowOrder = ['Goalkeeper', 'Defence', 'Midfield', 'Wingers', 'Forwards', 'Strikers'];
  const rows = rowOrder.map((position) => tier.players[position]).filter((list: any[]) => list.length > 0);
  const formationLabel = rowOrder
    .slice(1)
    .map((position) => tier.players[position].length)
    .filter((count: number) => count > 0)
    .join('-') || '—';

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0A0E10', zIndex: 50, overflowY: 'auto' }}>
      <div style={{ maxWidth: 420, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 16px 8px' }}>
          <button onClick={onBack} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8A9699', display: 'flex' }}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{tier.name}</div>
            <div style={{ fontSize: 12, color: '#8A9699' }}>Formation {formationLabel}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8A9699', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ margin: '10px 16px 20px', borderRadius: 18, overflow: 'hidden', background: 'linear-gradient(180deg, #0F2A1B 0%, #123420 100%)', border: '1px solid #1E4029', position: 'relative', paddingBottom: 20 }}>
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.35 }} preserveAspectRatio="none" viewBox="0 0 100 100">
            <line x1="0" y1="50" x2="100" y2="50" stroke="#7FCB9E" strokeWidth="0.3" />
            <circle cx="50" cy="50" r="10" fill="none" stroke="#7FCB9E" strokeWidth="0.3" />
            <rect x="25" y="0" width="50" height="16" fill="none" stroke="#7FCB9E" strokeWidth="0.3" />
            <rect x="25" y="84" width="50" height="16" fill="none" stroke="#7FCB9E" strokeWidth="0.3" />
          </svg>
          <div style={{ position: 'relative', paddingTop: 18 }}>
            {rows.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#7FCB9E99', fontSize: 13, padding: '60px 20px' }}>No players assigned to a position yet in {tier.name}.</div>
            ) : (
              rows.map((list: any[], index: number) => <PitchRow key={index} players={list} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamPickerModal({ tiers, onSelect, onClose }: { tiers: any[]; onSelect: (tier: any) => void; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} style={{ background: '#12181B', border: '1px solid #232B2E', borderTopLeftRadius: 18, borderTopRightRadius: 18, width: '100%', maxWidth: 420, padding: '18px 18px 24px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>View lineup</div>
        <div style={{ fontSize: 12.5, color: '#8A9699', marginBottom: 16 }}>Choose a team to see its formation</div>
        {tiers.map((tier) => {
          const count = Object.values(tier.players).flat().length;
          return (
            <button
              key={tier.id}
              onClick={() => onSelect(tier)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0D1214', border: '1px solid #1E2629', borderRadius: 12, padding: '13px 14px', marginBottom: 8, cursor: 'pointer', color: '#F2F5F4' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
                <Users size={15} color="#8A9699" />
                {tier.name}
              </span>
              <span style={{ fontSize: 12, color: '#5C6669' }}>{count} players</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OrgCard({ person }: { person: { id: string; name: string; role: string; tint: string } }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 92, background: '#12181B', border: '1px solid #1E2629', borderRadius: 12, padding: '10px 8px' }}>
      <Avatar initials={getInitials(person.name)} tint={person.tint} />
      <div style={{ fontSize: 11.5, fontWeight: 600, marginTop: 6, textAlign: 'center', lineHeight: 1.2 }}>{person.name}</div>
      <div style={{ fontSize: 10, color: person.tint, marginTop: 2, textAlign: 'center', fontWeight: 500 }}>{person.role}</div>
    </div>
  );
}

function OrgStructureView({ staff, onClose }: { staff: { id: string; name: string; role: string; tint: string }[]; onClose: () => void }) {
  const byTier: Record<string, typeof staff> = { head: [], assistant: [], specialist: [], other: [] };
  staff.forEach((member) => {
    byTier[tierForRole(member.role)].push(member);
  });

  const tiersToShow = [...ORG_TIERS, { key: 'other', label: 'Other Staff' }].filter((tier) => byTier[tier.key].length > 0);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0A0E10', zIndex: 50, overflowY: 'auto' }}>
      <div style={{ maxWidth: 420, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 16px 8px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Team Administration</div>
            <div style={{ fontSize: 12, color: '#8A9699' }}>Organizational structure</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8A9699', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '16px 16px 32px' }}>
          {tiersToShow.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#5C6669', fontSize: 13, padding: '40px 0' }}>No staff added yet.</div>
          ) : (
            tiersToShow.map((tier, index) => (
              <div key={tier.key} style={{ marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0' }}>
                  <div style={{ fontSize: 11.5, color: '#5C6669', fontWeight: 700, letterSpacing: 0.3 }}>{tier.label}</div>
                  <div style={{ flex: 1, height: 1, background: '#1A2226' }} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', paddingBottom: 14 }}>
                  {byTier[tier.key].map((person) => (
                    <OrgCard key={person.id} person={person} />
                  ))}
                </div>
                {index < tiersToShow.length - 1 && <div style={{ width: 1, height: 16, background: '#232B2E', margin: '0 auto' }} />}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function PlayerRow({ player, selected, onToggle, onAction }: { player: any; selected: boolean; onToggle: () => void; onAction: (action: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const statusKey = (player.status as keyof typeof STATUS_COLOR) || 'fit';
  const statusColor = STATUS_COLOR[statusKey] ?? STATUS_COLOR.fit;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#12181B', border: `1px solid ${selected ? '#3DDC8455' : '#1E2629'}`, borderRadius: 12, padding: '9px 10px', marginBottom: 6, position: 'relative' }}>
      <input type="checkbox" checked={selected} onChange={onToggle} style={{ width: 16, height: 16, accentColor: '#3DDC84', flexShrink: 0, cursor: 'pointer' }} />
      <div style={{ position: 'relative' }}>
        <PlayerAvatar photoUrl={player.photoUrl} initials={getInitials(player.name)} tint={player.tint || '#3FB6C9'} />
        <div style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: statusColor, border: '2px solid #12181B' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{player.name}</span>
          {player.verified && <ShieldCheck size={12} color="#3DDC84" style={{ flexShrink: 0 }} />}
        </div>
        <div style={{ fontSize: 11.5, color: '#8A9699', marginTop: 1 }}>{player.age}y{player.jersey ? ` · #${player.jersey}` : ''}</div>
      </div>
      <CSIring value={player.csi} />
      <button onClick={() => setMenuOpen((open) => !open)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, flexShrink: 0 }}>
        <MoreHorizontal size={16} color="#8A9699" />
      </button>
      {menuOpen && <OverflowMenu onAction={onAction} onClose={() => setMenuOpen(false)} />}
    </div>
  );
}

function AddPlayerInline({ position, candidates, onAddExisting, onAddNew, onClose }: { position: string; candidates: AthleteProfile[]; onAddExisting: (athlete: AthleteProfile) => void; onAddNew: (data: { name: string; age: string; jersey: string }) => void; onClose: () => void }) {
  const firestore = useFirestore();
  const [queryTerm, setQueryTerm] = useState('');
  const [remoteResults, setRemoteResults] = useState<AthleteProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [jersey, setJersey] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const localMatches = useMemo(() => {
    const term = queryTerm.trim().toLowerCase();
    if (!term) return candidates.slice(0, 6);
    return candidates.filter((athlete) => {
      const full = `${athlete.firstName || ''} ${athlete.lastName || ''} ${athlete.username || ''}`.toLowerCase();
      return full.includes(term);
    });
  }, [candidates, queryTerm]);

  useEffect(() => {
    if (!firestore) return;
    const term = queryTerm.trim();
    if (!term) {
      setRemoteResults([]);
      return;
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const words = term.split(/\s+/).filter(Boolean);
        const allTerms = [...new Set([term, ...words])];
        const jobs: Promise<any>[] = [];
        for (const w of allTerms) {
          const variants = [w, w.toLowerCase(), w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(), w.toUpperCase()];
          for (const v of variants) {
            jobs.push(
              getDocs(query(collection(firestore, 'athletes'), where('firstName', '>=', v), where('firstName', '<=', v + '\uf8ff'), limit(5))),
              getDocs(query(collection(firestore, 'athletes'), where('lastName', '>=', v), where('lastName', '<=', v + '\uf8ff'), limit(5))),
            );
          }
        }
        const snaps = await Promise.all(jobs);
        const seen = new Set<string>();
        const merged: AthleteProfile[] = [];
        for (const snap of snaps) {
          for (const item of snap.docs) {
            if (seen.has(item.id)) continue;
            seen.add(item.id);
            merged.push(item.data() as AthleteProfile);
          }
        }
        const lower = term.toLowerCase();
        const filtered = merged.filter((athlete) => {
          const full = `${athlete.firstName ?? ''} ${athlete.lastName ?? ''}`.toLowerCase();
          return words.every((word) => full.includes(word.toLowerCase())) || full.includes(lower);
        });
        setRemoteResults(filtered.slice(0, 10));
      } catch {
        setRemoteResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [firestore, queryTerm]);

  const canAddNew = name.trim().length > 0;
  const candidateRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    background: 'transparent',
    border: '1px solid #1E2629',
    borderRadius: 9,
    padding: '8px 10px',
    marginBottom: 5,
    color: '#F2F5F4',
    cursor: 'pointer',
    textAlign: 'left',
  };

  return (
    <div style={{ background: '#0D1214', border: '1px solid #232B2E', borderRadius: 12, padding: 12, marginBottom: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 11.5, color: '#8A9699', fontWeight: 600 }}>ADD PLAYER · {position.toUpperCase()}</div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#5C6669', display: 'flex' }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: 10 }}>
        <Search size={14} color="#5C6669" style={{ position: 'absolute', left: 10, top: 10 }} />
        <input autoFocus value={queryTerm} onChange={(event) => setQueryTerm(event.target.value)} placeholder="Search available players…" style={{ width: '100%', background: '#12181B', border: '1px solid #1E2629', borderRadius: 9, padding: '8px 10px 8px 32px', color: '#F2F5F4', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
      </div>

      {(localMatches.length > 0 || remoteResults.length > 0 || isSearching) && (
        <div style={{ marginBottom: 10 }}>
          {localMatches.length > 0 && (
            <>
              <div style={{ fontSize: 10, color: '#5C6669', fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>YOUR SQUAD</div>
              {localMatches.map((athlete) => (
                <button key={`local-${athlete.uid}`} onClick={() => onAddExisting(athlete)} style={candidateRowStyle}>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {getPlayerName(athlete)}
                    {athlete.position ? <span style={{ color: '#5C6669', fontWeight: 500, fontSize: 11 }}> · {athlete.position}</span> : null}
                  </span>
                  <Plus size={14} color="#3DDC84" style={{ flexShrink: 0 }} />
                </button>
              ))}
            </>
          )}
          {remoteResults.length > 0 && (
            <>
              <div style={{ fontSize: 10, color: '#5C6669', fontWeight: 700, letterSpacing: 0.5, margin: '8px 0 5px' }}>AVAILABLE ON PLATFORM</div>
              {remoteResults.map((athlete) => (
                <button key={`remote-${athlete.uid}`} onClick={() => onAddExisting(athlete)} style={candidateRowStyle}>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {getPlayerName(athlete)}
                    {athlete.position ? <span style={{ color: '#5C6669', fontWeight: 500, fontSize: 11 }}> · {athlete.position}</span> : null}
                  </span>
                  <Plus size={14} color="#3DDC84" style={{ flexShrink: 0 }} />
                </button>
              ))}
            </>
          )}
          {isSearching && <div style={{ fontSize: 11, color: '#5C6669', textAlign: 'center', padding: '6px 0' }}>Searching…</div>}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0 8px' }}>
        <div style={{ flex: 1, height: 1, background: '#1E2629' }} />
        <div style={{ fontSize: 10, color: '#5C6669', fontWeight: 700, letterSpacing: 0.5 }}>OR ADD NEW PLAYER</div>
        <div style={{ flex: 1, height: 1, background: '#1E2629' }} />
      </div>

      <div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10.5, color: '#8A9699', marginBottom: 4 }}>FULL NAME</div>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Brian Otieno" onKeyDown={(event) => event.key === 'Enter' && canAddNew && onAddNew({ name: name.trim(), age, jersey })} style={{ width: '100%', background: '#12181B', border: '1px solid #1E2629', borderRadius: 9, padding: '9px 10px', color: '#F2F5F4', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, color: '#8A9699', marginBottom: 4 }}>AGE</div>
            <input value={age} onChange={(event) => setAge(event.target.value.replace(/\D/g, ''))} placeholder="e.g. 20" style={{ width: '100%', background: '#12181B', border: '1px solid #1E2629', borderRadius: 9, padding: '9px 10px', color: '#F2F5F4', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, color: '#8A9699', marginBottom: 4 }}>JERSEY #</div>
            <input value={jersey} onChange={(event) => setJersey(event.target.value.replace(/\D/g, ''))} placeholder="e.g. 9" style={{ width: '100%', background: '#12181B', border: '1px solid #1E2629', borderRadius: 9, padding: '9px 10px', color: '#F2F5F4', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
        <button onClick={() => onAddNew({ name: name.trim(), age, jersey })} disabled={!canAddNew} style={{ width: '100%', padding: '10px 0', borderRadius: 9, border: 'none', background: canAddNew ? '#3DDC84' : '#1E2629', color: canAddNew ? '#04120A' : '#5C6669', fontSize: 13, fontWeight: 700, cursor: canAddNew ? 'pointer' : 'default' }}>
          Add player
        </button>
      </div>
    </div>
  );
}

function PositionGroup({ tierId, position, players, candidates, selected, onToggle, onAction, onAddExisting, onAddNew }: { tierId: string; position: string; players: any[]; candidates: AthleteProfile[]; selected: Set<string>; onToggle: (id: string) => void; onAction: (action: string, player: any, tierId: string, position: string) => void; onAddExisting: (athlete: AthleteProfile, tierId: string, position: string) => void; onAddNew: (data: { name: string; age: string; jersey: string }, tierId: string, position: string) => void }) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11.5, color: '#5C6669', fontWeight: 600 }}>{position.toUpperCase()} · {players.length}</span>
        <button onClick={() => setShowAdd((open) => !open)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: '1px dashed #2A3336', borderRadius: 7, padding: '3px 8px', cursor: 'pointer', color: '#8A9699', fontSize: 11 }}>
          {showAdd ? <><X size={11} /> Close</> : <><Plus size={11} /> Add player</>}
        </button>
      </div>
      {showAdd && (
        <AddPlayerInline
          position={position}
          candidates={candidates}
          onClose={() => setShowAdd(false)}
          onAddExisting={(athlete) => { onAddExisting(athlete, tierId, position); setShowAdd(false); }}
          onAddNew={(data) => { onAddNew(data, tierId, position); setShowAdd(false); }}
        />
      )}
      {players.length === 0 ? (
        <div style={{ border: '1px dashed #1E2629', borderRadius: 12, padding: '12px', textAlign: 'center', color: '#4A5457', fontSize: 12 }}>No {position.toLowerCase()} yet</div>
      ) : (
        players.map((player: any) => (
          <PlayerRow key={player.id} player={player} selected={selected.has(player.id)} onToggle={() => onToggle(player.id)} onAction={(action) => onAction(action, player, tierId, position)} />
        ))
      )}
    </div>
  );
}

export default function SquadListPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [tab, setTab] = useState<'players' | 'staff'>('players');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [addingTeam, setAddingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [addingStaff, setAddingStaff] = useState(false);
  const [pickingTeamForLineup, setPickingTeamForLineup] = useState(false);
  const [lineupTier, setLineupTier] = useState<any | null>(null);
  const [showOrgStructure, setShowOrgStructure] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [transferCtx, setTransferCtx] = useState<{ tierId: string; position: string; playerIds: string[] } | null>(null);
  const [extraTeams, setExtraTeams] = useState<any[]>([]);
  const [extraStaff, setExtraStaff] = useState<any[]>([]);
  const [extraPlayers, setExtraPlayers] = useState<{ id: string; tierId: string; position: string; player: any }[]>([]);

  const clubMemberQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'club_members'), where('userId', '==', user.uid)) : null),
    [firestore, user],
  );
  const { data: userMemberships } = useCollection<ClubMember>(clubMemberQuery);
  const clubId = userMemberships?.[0]?.clubId;

  const squadMembersQuery = useMemoFirebase(
    () => (firestore && clubId ? query(collection(firestore, 'club_members'), where('clubId', '==', clubId), where('status', '==', 'active')) : null),
    [firestore, clubId],
  );

  const { data: squadMembers, isLoading: squadLoading } = useCollection<ClubMember>(squadMembersQuery);

  const { staffMembers, athleteIds } = useMemo(() => {
    const staff: ClubMember[] = [];
    const ids: string[] = [];

    for (const member of squadMembers || []) {
      if (member.role && STAFF_ROLES.has(member.role)) {
        staff.push(member);
      } else if (member.userId) {
        ids.push(member.userId);
      }
    }

    return { staffMembers: staff, athleteIds: [...new Set(ids)] };
  }, [squadMembers]);

  const athletesQuery = useMemoFirebase(
    () => (firestore && athleteIds.length > 0 ? query(collection(firestore, 'athletes'), where('uid', 'in', athleteIds)) : null),
    [firestore, athleteIds],
  );

  const { data: athletes, isLoading: athletesLoading } = useCollection<AthleteProfile>(athletesQuery);
  const athleteList = athletes ?? [];

  const squadRosterQuery = useMemoFirebase(
    () => (firestore && clubId ? collection(firestore, 'clubs', clubId, 'squad') : null),
    [firestore, clubId],
  );
  const { data: squadRoster } = useCollection<any>(squadRosterQuery);
  const manualRoster = useMemo(() => (squadRoster ?? []).filter((entry) => entry.manualAdded === true), [squadRoster]);

  const baseTiers = useMemo(() => buildTeamTiers(athleteList), [athleteList]);
  const allTiers = useMemo(() => {
    const tiers: any[] = [...baseTiers, ...extraTeams].map((tier) => ({ ...tier, players: { ...tier.players } }));
    const tiersById = new Map<string, any>();
    tiers.forEach((tier) => tiersById.set(tier.id, tier));

    const ensureTier = (name: string) => {
      const key = name || 'First XI / Team A';
      let tier = tiersById.get(key);
      if (!tier) {
        tier = { id: key, name: key, players: emptyPositionMap() };
        tiersById.set(key, tier);
        tiers.push(tier);
      }
      return tier;
    };

    for (const roster of manualRoster) {
      const tier = ensureTier(roster.team || '');
      const normalized = normalizePosition(roster.position);
      tier.players[normalized] = [
        ...(tier.players[normalized] || []),
        {
          id: `manual-${roster.id}`,
          rosterId: roster.id,
          name: roster.fullName || 'Unknown Player',
          age: roster.age || 0,
          csi: 0,
          verified: false,
          status: 'knock',
          tint: '#3FB6C9',
          photoUrl: '',
          jersey: roster.jerseyNumber || undefined,
        },
      ];
    }

    for (const entry of extraPlayers) {
      const tier = tiersById.get(entry.tierId);
      if (!tier) continue;
      tier.players[entry.position] = [...(tier.players[entry.position] || []), entry.player];
    }

    return tiers;
  }, [baseTiers, extraTeams, manualRoster, extraPlayers]);

  useEffect(() => {
    const nextExpanded: Record<string, boolean> = {};
    allTiers.forEach((tier, index) => {
      nextExpanded[tier.id] = index === 0 ? true : Boolean(expanded[tier.id]);
    });
    setExpanded((current) => ({ ...current, ...nextExpanded }));
  }, [allTiers]);

  const filteredStaff = useMemo(() => {
    const merged = [...(staffMembers || []).map((member) => ({ id: member.id || member.userId || 'staff', name: member.displayName || 'Staff Member', role: member.role || 'staff', tint: TINTS[(member.role ? member.role.length : 0) % TINTS.length] })), ...extraStaff];
    const next = searchTerm ? merged.filter((person) => person.name.toLowerCase().includes(searchTerm.toLowerCase()) || person.role.toLowerCase().includes(searchTerm.toLowerCase())) : merged;
    return next;
  }, [staffMembers, extraStaff, searchTerm]);

  const visibleTiers = useMemo(() => {
    return allTiers.map((tier) => {
      const playersByPosition: Record<string, any[]> = {};
      for (const position of POSITIONS) {
        const source = tier.players[position] || [];
        const matches = searchTerm ? source.filter((player: { name: string }) => player.name.toLowerCase().includes(searchTerm.toLowerCase())) : source;
        playersByPosition[position] = matches;
      }
      return { ...tier, players: playersByPosition };
    });
  }, [allTiers, searchTerm]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const bulkTransferSource = useMemo(() => {
    if (selectedIds.length === 0) return null;
    for (const tier of visibleTiers) {
      for (const position of POSITIONS) {
        const found = tier.players[position].some((player: { id: string }) => selectedIds.includes(player.id));
        if (found) return { tierId: tier.id, position };
      }
    }
    return null;
  }, [visibleTiers, selectedIds]);

  const toggleTier = (tierId: string) => setExpanded((current) => ({ ...current, [tierId]: !current[tierId] }));
  const toggleSelect = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  };

  const handleAction = (action: string, player: any, tierId: string, position: string) => {
    if (action === 'transfer') {
      setTransferCtx({ tierId, position, playerIds: [player.id] });
      return;
    }
    if (action === 'message') {
      showToast(`Messaging ${player.name}...`);
      return;
    }
    if (action === 'view') {
      showToast(`Opening ${player.name}...`);
      return;
    }
    if (action === 'delete' && player.rosterId && firestore && clubId) {
      deleteDoc(doc(firestore, 'clubs', clubId, 'squad', player.rosterId))
        .then(() => showToast(`Deleted ${player.name}`))
        .catch((err) => showToast(`Could not delete: ${err?.message || 'please retry'}`));
      return;
    }
    showToast(`Deleting ${player.name}...`);
  };

  const candidatesFor = (tierId: string, position: string) => {
    const tier = allTiers.find((team) => team.id === tierId);
    const existingIds = new Set<string>((tier?.players[position] || []).map((player: any) => player.id));
    return athleteList.filter((athlete) => !existingIds.has(athlete.uid));
  };

  const addExistingPlayer = async (athlete: AthleteProfile, tierId: string, position: string) => {
    const tier = allTiers.find((team) => team.id === tierId);
    const tierName = tier?.name || tierId;
    const isMember = athleteList.some((candidate) => candidate.uid === athlete.uid);

    if (!firestore || !clubId) {
      const player = {
        id: `existing-${athlete.uid}-${Date.now()}`,
        name: getPlayerName(athlete),
        age: athlete.age || 0,
        csi: getCsiValue(athlete),
        verified: Boolean(athlete.isVerified),
        status: athlete.isVerified ? 'fit' : 'knock',
        tint: '#3FB6C9',
        photoUrl: athlete.photoUrl || '',
      };
      setExtraPlayers((current) => [...current, { id: player.id, tierId, position, player }]);
      setExpanded((current) => ({ ...current, [tierId]: true }));
      showToast(`${player.name} added to ${tierName}`);
      return;
    }

    try {
      if (isMember) {
        await updateDoc(doc(firestore, 'athletes', athlete.uid), {
          team: tierName,
          position,
          updatedAt: new Date().toISOString(),
        });
        showToast(`${getPlayerName(athlete)} assigned to ${tierName}`);
      } else {
        const clubSnap = await getDoc(doc(firestore, 'clubs', clubId));
        const resolvedClubName = (clubSnap.data() as any)?.clubName || '';
        const batch = writeBatch(firestore);

        batch.set(doc(firestore, 'clubs', clubId, 'squad', athlete.uid), {
          uid: athlete.uid,
          fullName: getPlayerName(athlete),
          email: (athlete as any).email ?? null,
          position,
          team: tierName,
          jerseyNumber: athlete.jerseyNumber || null,
          age: athlete.age || 0,
          status: 'active',
          joinedAt: new Date().toISOString(),
        });

        batch.update(doc(firestore, 'athletes', athlete.uid), {
          affiliatedClubId: clubId,
          clubName: resolvedClubName,
          clubStatus: 'active',
          team: tierName,
          position,
          updatedAt: new Date().toISOString(),
        });

        batch.set(doc(firestore, 'club_members', `${athlete.uid}_${clubId}`), {
          userId: athlete.uid,
          clubId,
          clubName: resolvedClubName,
          displayName: getPlayerName(athlete),
          role: 'athlete',
          status: 'active',
          joinedAt: new Date().toISOString(),
        });

        await batch.commit();
        showToast(`${getPlayerName(athlete)} added to ${tierName} squad`);
      }
    } catch (err) {
      showToast(`Could not save: ${(err as any)?.message || 'please retry'}`);
    }
  };

  const addNewPlayer = async (data: { name: string; age: string; jersey: string }, tierId: string, position: string) => {
    const tier = allTiers.find((team) => team.id === tierId);
    const tierName = tier?.name || tierId;
    const id = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const player = {
      id,
      name: data.name,
      age: Number(data.age) || 0,
      csi: 0,
      verified: false,
      status: 'knock',
      tint: '#3FB6C9',
      photoUrl: '',
      jersey: data.jersey || undefined,
    };
    setExtraPlayers((current) => [...current, { id, tierId, position, player }]);
    setExpanded((current) => ({ ...current, [tierId]: true }));

    if (!firestore || !clubId) {
      showToast(`${player.name} added to ${tierName}`);
      return;
    }

    try {
      await setDoc(doc(firestore, 'clubs', clubId, 'squad', id), {
        uid: id,
        fullName: data.name,
        position,
        team: tierName,
        jerseyNumber: data.jersey || null,
        age: Number(data.age) || 0,
        status: 'active',
        manualAdded: true,
        joinedAt: new Date().toISOString(),
      });
      setExtraPlayers((current) => current.filter((entry) => entry.id !== id));
      showToast(`${player.name} added to ${tierName}`);
    } catch (err) {
      showToast(`Could not save: ${(err as any)?.message || 'please retry'}`);
    }
  };

  const movePlayers = (tierId: string, fromPosition: string, playerIds: string[], toPosition: string) => {
    setExtraTeams((current) => current);
    setExpanded((current) => ({ ...current, [tierId]: true }));

    const nextTiers = allTiers.map((tier) => {
      if (tier.id !== tierId) return tier;

      const nextPlayers = { ...tier.players };
      nextPlayers[toPosition] = [...(nextPlayers[toPosition] || [])];
      nextPlayers[fromPosition] = [...(nextPlayers[fromPosition] || [])];

      const moving = nextPlayers[fromPosition].filter((player: any) => playerIds.includes(player.id));
      nextPlayers[fromPosition] = nextPlayers[fromPosition].filter((player: any) => !playerIds.includes(player.id));
      nextPlayers[toPosition] = [...nextPlayers[toPosition], ...moving];

      return { ...tier, players: nextPlayers };
    });

    const merged = nextTiers.filter((tier) => extraTeams.some((extra) => extra.id === tier.id) || !baseTiers.some((base) => base.id === tier.id));
    const base = nextTiers.filter((tier) => baseTiers.some((base) => base.id === tier.id));
    setExtraTeams(merged.filter((tier) => !base.some((baseTier) => baseTier.id === tier.id)));
    setSelectedIds([]);
    showToast(`Moved ${playerIds.length > 1 ? `${playerIds.length} players` : 'player'} to ${toPosition}`);
  };

  const addTeam = () => {
    if (!newTeamName.trim()) return;
    const nextName = newTeamName.trim();
    const newTier = { id: `team-${Date.now()}`, name: nextName, players: emptyPositionMap() };
    setExtraTeams((current) => [...current, newTier]);
    setExpanded((current) => ({ ...current, [newTier.id]: true }));
    setNewTeamName('');
    setAddingTeam(false);
    showToast(`Added team ${nextName}`);
  };

  const addStaff = (name: string, role: string) => {
    const nextPerson = {
      id: `staff-${Date.now()}`,
      name,
      role,
      tint: TINTS[(extraStaff.length + filteredStaff.length) % TINTS.length],
    };
    setExtraStaff((current) => [...current, nextPerson]);
    setAddingStaff(false);
    showToast(`Added ${name} as ${role}`);
  };

  const totalPlayers = athleteList.length;
  const totalTeams = allTiers.length;

  return (
    <div style={{ background: '#0A0E10', minHeight: '100vh', color: '#F2F5F4', fontFamily: 'Inter, system-ui, sans-serif', maxWidth: 420, margin: '0 auto', paddingBottom: 96 }}>
      <div style={{ padding: '20px 18px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>Squad</div>
          <div style={{ fontSize: 13, color: '#8A9699', marginTop: 2 }}>{totalPlayers} players · {filteredStaff.length} staff · {totalTeams} teams</div>
        </div>
        <button onClick={() => setPickingTeamForLineup(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#12181B', border: '1px solid #1E2629', borderRadius: 10, padding: '8px 12px', color: '#F2F5F4', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
          <LayoutGrid size={14} color="#3DDC84" />
          Lineups
        </button>
      </div>

      <div style={{ display: 'flex', margin: '16px 18px 0', background: 'linear-gradient(180deg, rgba(17,22,26,0.96), rgba(13,18,20,0.96))', borderRadius: 12, padding: 4, border: '1px solid #243033', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
        {[
          { key: 'players', label: `Players (${totalPlayers})` },
          { key: 'staff', label: `Staff (${filteredStaff.length})` },
        ].map((segment) => (
          <button
            key={segment.key}
            onClick={() => {
              setTab(segment.key as 'players' | 'staff');
              setSelectedIds([]);
            }}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: 9,
              border: 'none',
              cursor: 'pointer',
              background: tab === segment.key ? 'linear-gradient(135deg, rgba(61,220,132,0.18), rgba(50,156,214,0.18))' : 'transparent',
              color: tab === segment.key ? '#ECFFF4' : '#8A9699',
              fontSize: 13,
              fontWeight: 700,
              boxShadow: tab === segment.key ? 'inset 0 0 0 1px rgba(61,220,132,0.42), 0 8px 18px rgba(61,220,132,0.12)' : 'none',
              letterSpacing: '0.02em',
            }}
          >
            {segment.label}
          </button>
        ))}
      </div>

      <div style={{ margin: '12px 18px 0', position: 'relative' }}>
        <Search size={16} color="#5C6669" style={{ position: 'absolute', left: 12, top: 11 }} />
        <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder={`Search ${tab}...`} style={{ width: '100%', background: '#12181B', border: '1px solid #1E2629', borderRadius: 10, padding: '9px 12px 9px 36px', color: '#F2F5F4', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
      </div>

      {tab === 'players' && (
        <div style={{ padding: '16px 18px 0' }}>
          {squadLoading || athletesLoading ? (
            <div style={{ padding: '18px 0', textAlign: 'center', color: '#8A9699' }}>Loading squad…</div>
          ) : (
            <>
              {visibleTiers.length > 0 && (
                <div style={{ marginBottom: 12, background: 'linear-gradient(180deg, rgba(17,24,29,0.96), rgba(12,18,20,0.96))', border: '1px solid #1E2A2F', borderRadius: 14, padding: 12, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, letterSpacing: 1.4, color: '#5C6669', textTransform: 'uppercase', fontWeight: 700 }}>Squad Overview</div>
                      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{visibleTiers[0].name}</div>
                    </div>
                    <button onClick={() => setPickingTeamForLineup(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0F1B1D', border: '1px solid #233136', borderRadius: 10, padding: '7px 10px', color: '#ECFFF4', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                      <LayoutGrid size={12} color="#3DDC84" />
                      Lineups
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                    {['Goalkeeper', 'Midfield', 'Forwards'].map((position) => {
                      const count = (visibleTiers[0].players[position] || []).length;
                      return (
                        <div key={position} style={{ background: '#0D1214', border: '1px solid #1E2629', borderRadius: 10, padding: '8px 9px' }}>
                          <div style={{ fontSize: 10, color: '#5C6669', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{position}</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#F2F5F4' }}>{count}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {visibleTiers.map((tier) => {
                const tierPlayerCount = Object.values(tier.players).flat().length;
                const isExpanded = expanded[tier.id] ?? true;

                return (
                  <div key={tier.id} style={{ marginBottom: 10, border: '1px solid #1A2226', borderRadius: 14, overflow: 'hidden' }}>
                    <button onClick={() => toggleTier(tier.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', background: '#12181B', border: 'none', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Users size={15} color="#8A9699" />
                        <span style={{ fontSize: 14.5, fontWeight: 700 }}>{tier.name}</span>
                        <span style={{ fontSize: 11.5, color: '#5C6669' }}>({tierPlayerCount})</span>
                      </div>
                      {isExpanded ? <ChevronDown size={16} color="#8A9699" /> : <ChevronRight size={16} color="#8A9699" />}
                    </button>

                    {isExpanded && (
                      <div style={{ padding: '12px 12px 4px', background: '#0D1214' }}>
                        {POSITIONS.map((position) => (
                          <PositionGroup key={`${tier.id}-${position}`} tierId={tier.id} position={position} players={tier.players[position]} candidates={candidatesFor(tier.id, position)} selected={selectedSet} onToggle={toggleSelect} onAction={handleAction} onAddExisting={addExistingPlayer} onAddNew={addNewPlayer} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {addingTeam ? (
            <div style={{ display: 'flex', gap: 6, background: '#12181B', border: '1px solid #1E2629', borderRadius: 12, padding: 8, marginTop: 4 }}>
              <input autoFocus value={newTeamName} onChange={(event) => setNewTeamName(event.target.value)} placeholder="Team name (e.g. U-17)" onKeyDown={(event) => event.key === 'Enter' && addTeam()} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F2F5F4', fontSize: 13.5, padding: '4px 6px' }} />
              <button onClick={addTeam} style={{ background: '#3DDC8422', border: '1px solid #3DDC8455', borderRadius: 8, color: '#3DDC84', padding: '0 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Add</button>
              <button onClick={() => { setAddingTeam(false); setNewTeamName(''); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#5C6669', display: 'flex', alignItems: 'center' }}>
                <X size={16} />
              </button>
            </div>
          ) : (
            <button onClick={() => setAddingTeam(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'transparent', border: '1px dashed #2A3336', borderRadius: 12, padding: '11px 0', color: '#8A9699', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
              <Plus size={14} /> Add team
            </button>
          )}
        </div>
      )}

      {tab === 'staff' && (
        <div style={{ padding: '16px 18px 0' }}>
          <button onClick={() => setShowOrgStructure(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#12181B', border: '1px solid #1E2629', borderRadius: 10, padding: '9px 0', color: '#F2F5F4', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', marginBottom: 14 }}>
            <LayoutGrid size={14} color="#3DDC84" />
            Org structure
          </button>
          {filteredStaff.map((member) => (
            <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#12181B', border: '1px solid #1E2629', borderRadius: 12, padding: '10px 12px', marginBottom: 8 }}>
              <Avatar initials={getInitials(member.name)} tint={member.tint} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{member.name}</div>
                <div style={{ fontSize: 12, marginTop: 2, color: member.tint, fontWeight: 500 }}>{member.role}</div>
              </div>
              <button onClick={() => showToast(`Messaging ${member.name}...`)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                <MessageSquare size={15} color="#8A9699" />
              </button>
              <button onClick={() => showToast(`Opening ${member.name}'s profile...`)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                <ChevronRight size={15} color="#5C6669" />
              </button>
            </div>
          ))}
          <button onClick={() => setAddingStaff(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'transparent', border: '1px dashed #2A3336', borderRadius: 12, padding: '11px 0', color: '#8A9699', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
            <Plus size={14} /> Add staff
          </button>
        </div>
      )}

      {addingStaff && <AddStaffModal onClose={() => setAddingStaff(false)} onConfirm={addStaff} />}
      {pickingTeamForLineup && <TeamPickerModal tiers={visibleTiers} onClose={() => setPickingTeamForLineup(false)} onSelect={(tier) => { setLineupTier(tier); setPickingTeamForLineup(false); }} />}
      {lineupTier && <LineupView tier={lineupTier} onBack={() => { setLineupTier(null); setPickingTeamForLineup(true); }} onClose={() => setLineupTier(null)} />}
      {showOrgStructure && <OrgStructureView staff={filteredStaff} onClose={() => setShowOrgStructure(false)} />}

      {tab === 'players' && selectedIds.length > 0 && (
        <div style={{ position: 'sticky', bottom: 12, margin: '16px 18px 0', background: '#161D20', border: '1px solid #2A3336', borderRadius: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 24px rgba(0,0,0,.5)' }}>
          <span style={{ fontSize: 12.5 }}>{selectedIds.length} selected</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => bulkTransferSource && setTransferCtx({ ...bulkTransferSource, playerIds: selectedIds })} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', cursor: 'pointer', color: '#F2F5F4', fontSize: 12, fontWeight: 500 }}>
              <ArrowRightLeft size={13} /> Transfer
            </button>
            <button onClick={() => showToast(`Messaging ${selectedIds.length} player(s)...`)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', cursor: 'pointer', color: '#F2F5F4', fontSize: 12, fontWeight: 500 }}>
              <MessageSquare size={13} /> Message
            </button>
            <button onClick={() => { showToast(`Deleting ${selectedIds.length} player(s)...`); setSelectedIds([]); }} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', cursor: 'pointer', color: '#E8544A', fontSize: 12, fontWeight: 500 }}>
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>
      )}

      {transferCtx && (
        <TransferModal
          fromPosition={transferCtx.position}
          count={transferCtx.playerIds.length}
          onClose={() => setTransferCtx(null)}
          onConfirm={(toPosition) => {
            movePlayers(transferCtx.tierId, transferCtx.position, transferCtx.playerIds, toPosition);
            setTransferCtx(null);
          }}
        />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: '#1E2629', border: '1px solid #2A3336', borderRadius: 10, padding: '8px 16px', fontSize: 12.5, color: '#F2F5F4', zIndex: 30 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
