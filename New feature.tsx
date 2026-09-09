import { useState, useMemo } from "react";
import {
  Search, MoreHorizontal, ShieldCheck, ChevronDown, ChevronRight, ChevronLeft,
  Plus, X, ArrowRightLeft, Trash2, MessageSquare, Eye, Users, LayoutGrid
} from "lucide-react";

const POSITIONS = ["Goalkeeper", "Defence", "Midfield", "Wingers", "Forwards", "Strikers"];

const INITIAL_TIERS = [
  {
    id: "t1", name: "First XI / Team A",
    players: {
      Goalkeeper: [{ id: 10, name: "K. Mwangi", age: 24, csi: 71, verified: true, status: "fit" }],
      Defence: [
        { id: 11, name: "D. Otieno", age: 23, csi: 68, verified: false, status: "fit" },
        { id: 12, name: "I. Kiptoo", age: 26, csi: 75, verified: true, status: "fit" },
        { id: 13, name: "J. Wafula", age: 22, csi: 62, verified: false, status: "knock" },
        { id: 14, name: "L. Barasa", age: 25, csi: 70, verified: true, status: "fit" },
      ],
      Midfield: [
        { id: 15, name: "S. Njoroge", age: 24, csi: 66, verified: false, status: "fit" },
        { id: 16, name: "E. Odhiambo", age: 27, csi: 73, verified: true, status: "fit" },
      ],
      Wingers: [
        { id: 17, name: "A. Cheruiyot", age: 20, csi: 64, verified: false, status: "fit" },
        { id: 18, name: "D. Mutua", age: 22, csi: 69, verified: true, status: "fit" },
      ],
      Forwards: [{ id: 1, name: "Haruni Nzau Randu", age: 21, csi: 83, verified: true, status: "fit" }],
      Strikers: [],
    },
  },
  { id: "t2", name: "Team B", players: Object.fromEntries(POSITIONS.map(p => [p, []])) },
  { id: "t3", name: "Academy", players: Object.fromEntries(POSITIONS.map(p => [p, []])) },
];

const INITIAL_STAFF = [
  { id: "s1", name: "James John", role: "Scout", tint: "#9B7BE8" },
  { id: "s2", name: "James Bond", role: "GK Coach", tint: "#3FB6C9" },
  { id: "s3", name: "M. Otieno", role: "Head Coach", tint: "#3DDC84" },
  { id: "s4", name: "R. Achieng", role: "Physio", tint: "#E8A33D" },
];

const TINTS = ["#9B7BE8", "#3FB6C9", "#E8A33D", "#3DDC84", "#E8544A", "#5B8DEF"];

const ORG_TIERS = [
  { key: "head", label: "Head Coach", match: ["head coach", "manager"] },
  { key: "assistant", label: "Assistant Coaches", match: ["assistant coach", "gk coach", "fitness coach", "coach"] },
  { key: "specialist", label: "Specialists & Scouts", match: ["scout", "physio", "analyst", "doctor", "nutritionist"] },
];
function tierForRole(role) {
  const r = role.toLowerCase();
  for (const tier of ORG_TIERS) {
    if (tier.match.some(m => r.includes(m))) return tier.key;
  }
  return "other";
}

const STATUS_COLOR = { fit: "#3DDC84", knock: "#E8A33D", out: "#E8544A" };

function CSIBadge({ value }) {
  const pct = value / 100, r = 15, c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 34, height: 34, flexShrink: 0 }}>
      <svg width="34" height="34" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="17" cy="17" r={r} fill="none" stroke="#232B2E" strokeWidth="3" />
        <circle cx="17" cy="17" r={r} fill="none" stroke="#3DDC84" strokeWidth="3"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600,
      }}>{value}</div>
    </div>
  );
}

function Avatar({ initials, tint }) {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
      background: tint ? `${tint}22` : "#1A2226",
      border: `1px solid ${tint ? tint + "55" : "#232B2E"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 12, fontWeight: 600, color: tint || "#8A9699", fontFamily: "'JetBrains Mono', monospace",
    }}>{initials}</div>
  );
}

function OverflowMenu({ onAction, onClose }) {
  const items = [
    { key: "view", label: "View & edit details", icon: Eye },
    { key: "transfer", label: "Transfer position", icon: ArrowRightLeft },
    { key: "message", label: "Message player", icon: MessageSquare },
    { key: "delete", label: "Delete player", icon: Trash2, danger: true },
  ];
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
      <div style={{
        position: "absolute", right: 0, top: 30, zIndex: 20, background: "#161D20",
        border: "1px solid #232B2E", borderRadius: 10, minWidth: 190, overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0,0,0,.4)",
      }}>
        {items.map(({ key, label, icon: Icon, danger }) => (
          <button key={key} onClick={() => { onAction(key); onClose(); }} style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px",
            background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
            color: danger ? "#E8544A" : "#F2F5F4", fontSize: 13,
          }}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>
    </>
  );
}

// modal for moving one or more players to a new position within their tier
function TransferModal({ fromPosition, count, onConfirm, onClose }) {
  const [target, setTarget] = useState(POSITIONS.find(p => p !== fromPosition));
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 40,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#12181B", border: "1px solid #232B2E", borderTopLeftRadius: 18, borderTopRightRadius: 18,
        width: "100%", maxWidth: 420, padding: "18px 18px 24px",
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Transfer position</div>
        <div style={{ fontSize: 12.5, color: "#8A9699", marginBottom: 16 }}>
          Move {count > 1 ? `${count} players` : "player"} from <b style={{ color: "#F2F5F4" }}>{fromPosition}</b> to:
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {POSITIONS.filter(p => p !== fromPosition).map(p => (
            <button key={p} onClick={() => setTarget(p)} style={{
              padding: "7px 12px", borderRadius: 9, fontSize: 12.5, cursor: "pointer",
              border: `1px solid ${target === p ? "#3DDC84" : "#232B2E"}`,
              background: target === p ? "#3DDC8422" : "#0D1214",
              color: target === p ? "#3DDC84" : "#C7D0D2", fontWeight: target === p ? 600 : 400,
            }}>{p}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid #232B2E",
            background: "transparent", color: "#8A9699", fontSize: 13.5, cursor: "pointer",
          }}>Cancel</button>
          <button onClick={() => onConfirm(target)} style={{
            flex: 1, padding: "11px 0", borderRadius: 10, border: "none",
            background: "#3DDC84", color: "#04120A", fontSize: 13.5, fontWeight: 700, cursor: "pointer",
          }}>Confirm transfer</button>
        </div>
      </div>
    </div>
  );
}

function AddStaffModal({ onConfirm, onClose }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const canSave = name.trim() && role.trim();
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 40,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#12181B", border: "1px solid #232B2E", borderTopLeftRadius: 18, borderTopRightRadius: 18,
        width: "100%", maxWidth: 420, padding: "18px 18px 24px",
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Add staff member</div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11.5, color: "#8A9699", marginBottom: 5 }}>NAME</div>
          <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Wanjiru Kamau"
            style={{
              width: "100%", background: "#0D1214", border: "1px solid #232B2E", borderRadius: 10,
              padding: "10px 12px", color: "#F2F5F4", fontSize: 14, outline: "none", boxSizing: "border-box",
            }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11.5, color: "#8A9699", marginBottom: 5 }}>ROLE</div>
          <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Physio, Assistant Coach"
            style={{
              width: "100%", background: "#0D1214", border: "1px solid #232B2E", borderRadius: 10,
              padding: "10px 12px", color: "#F2F5F4", fontSize: 14, outline: "none", boxSizing: "border-box",
            }} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid #232B2E",
            background: "transparent", color: "#8A9699", fontSize: 13.5, cursor: "pointer",
          }}>Cancel</button>
          <button disabled={!canSave} onClick={() => canSave && onConfirm(name.trim(), role.trim())} style={{
            flex: 1, padding: "11px 0", borderRadius: 10, border: "none",
            background: canSave ? "#3DDC84" : "#1E2629", color: canSave ? "#04120A" : "#5C6669",
            fontSize: 13.5, fontWeight: 700, cursor: canSave ? "pointer" : "default",
          }}>Add staff</button>
        </div>
      </div>
    </div>
  );
}

function PitchPlayer({ player }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 64 }}>
      <div style={{
        width: 46, height: 46, borderRadius: "50%", background: "#1A2226",
        border: "2px solid #2E3A3D", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, color: "#E8ECEC", fontFamily: "'JetBrains Mono', monospace",
        boxShadow: "0 2px 6px rgba(0,0,0,.35)",
      }}>
        {player.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
      </div>
      <div style={{
        marginTop: -8, background: "#3DDC84", color: "#04120A", fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10.5, fontWeight: 700, borderRadius: 6, padding: "1px 6px", border: "2px solid #0F2A1B",
      }}>{player.csi}</div>
      <div style={{
        marginTop: 4, fontSize: 10.5, color: "#EDF2F1", textAlign: "center", lineHeight: 1.2,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 68,
      }}>{player.name}</div>
    </div>
  );
}

function PitchRow({ players }) {
  if (players.length === 0) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-evenly", width: "100%", padding: "10px 6px" }}>
      {players.map(p => <PitchPlayer key={p.id} player={p} />)}
    </div>
  );
}

function LineupView({ tier, onBack, onClose }) {
  const rowOrder = ["Goalkeeper", "Defence", "Midfield", "Wingers", "Forwards", "Strikers"];
  const rows = rowOrder.map(pos => tier.players[pos]).filter(list => list.length > 0);
  const formationLabel = rowOrder.slice(1).map(pos => tier.players[pos].length).filter(n => n > 0).join("-") || "\u2014";

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0A0E10", zIndex: 50, overflowY: "auto" }}>
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 16px 8px" }}>
          <button onClick={onBack} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#8A9699", display: "flex" }}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{tier.name}</div>
            <div style={{ fontSize: 12, color: "#8A9699" }}>Formation {formationLabel}</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#8A9699", display: "flex" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{
          margin: "10px 16px 20px", borderRadius: 18, overflow: "hidden",
          background: "linear-gradient(180deg, #0F2A1B 0%, #123420 100%)",
          border: "1px solid #1E4029", position: "relative", paddingBottom: 20,
        }}>
          {/* pitch markings */}
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.35 }} preserveAspectRatio="none" viewBox="0 0 100 100">
            <line x1="0" y1="50" x2="100" y2="50" stroke="#7FCB9E" strokeWidth="0.3" />
            <circle cx="50" cy="50" r="10" fill="none" stroke="#7FCB9E" strokeWidth="0.3" />
            <rect x="25" y="0" width="50" height="16" fill="none" stroke="#7FCB9E" strokeWidth="0.3" />
            <rect x="25" y="84" width="50" height="16" fill="none" stroke="#7FCB9E" strokeWidth="0.3" />
          </svg>
          <div style={{ position: "relative", paddingTop: 18 }}>
            {rows.length === 0 ? (
              <div style={{ textAlign: "center", color: "#7FCB9E99", fontSize: 13, padding: "60px 20px" }}>
                No players assigned to a position yet in {tier.name}.
              </div>
            ) : rows.map((players, i) => <PitchRow key={i} players={players} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamPickerModal({ tiers, onSelect, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 40, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#12181B", border: "1px solid #232B2E", borderTopLeftRadius: 18, borderTopRightRadius: 18,
        width: "100%", maxWidth: 420, padding: "18px 18px 24px",
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>View lineup</div>
        <div style={{ fontSize: 12.5, color: "#8A9699", marginBottom: 16 }}>Choose a team to see its formation</div>
        {tiers.map(t => {
          const count = Object.values(t.players).flat().length;
          return (
            <button key={t.id} onClick={() => onSelect(t)} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "#0D1214", border: "1px solid #1E2629", borderRadius: 12,
              padding: "13px 14px", marginBottom: 8, cursor: "pointer", color: "#F2F5F4",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600 }}>
                <Users size={15} color="#8A9699" />{t.name}
              </span>
              <span style={{ fontSize: 12, color: "#5C6669" }}>{count} players</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OrgCard({ person }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", width: 92,
      background: "#12181B", border: "1px solid #1E2629", borderRadius: 12, padding: "10px 8px",
    }}>
      <Avatar initials={person.name.split(" ").map(n => n[0]).join("")} tint={person.tint} />
      <div style={{ fontSize: 11.5, fontWeight: 600, marginTop: 6, textAlign: "center", lineHeight: 1.2 }}>{person.name}</div>
      <div style={{ fontSize: 10, color: person.tint, marginTop: 2, textAlign: "center", fontWeight: 500 }}>{person.role}</div>
    </div>
  );
}

function OrgStructureView({ staff, onClose }) {
  const byTier = ORG_TIERS.reduce((acc, t) => ({ ...acc, [t.key]: [] }), { other: [] });
  staff.forEach(s => { byTier[tierForRole(s.role)].push(s); });
  const tiersToShow = [...ORG_TIERS, { key: "other", label: "Other Staff" }].filter(t => byTier[t.key].length > 0);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0A0E10", zIndex: 50, overflowY: "auto" }}>
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 16px 8px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Team Administration</div>
            <div style={{ fontSize: 12, color: "#8A9699" }}>Organizational structure</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#8A9699", display: "flex" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "16px 16px 32px" }}>
          {tiersToShow.length === 0 ? (
            <div style={{ textAlign: "center", color: "#5C6669", fontSize: 13, padding: "40px 0" }}>
              No staff added yet.
            </div>
          ) : tiersToShow.map((tier, i) => (
            <div key={tier.key} style={{ marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "10px 0" }}>
                <div style={{ fontSize: 11.5, color: "#5C6669", fontWeight: 700, letterSpacing: 0.3 }}>{tier.label}</div>
                <div style={{ flex: 1, height: 1, background: "#1A2226" }} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", paddingBottom: 14 }}>
                {byTier[tier.key].map(p => <OrgCard key={p.id} person={p} />)}
              </div>
              {i < tiersToShow.length - 1 && (
                <div style={{ width: 1, height: 16, background: "#232B2E", margin: "0 auto" }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerRow({ player, selected, onToggle, onAction }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, background: "#12181B",
      border: `1px solid ${selected ? "#3DDC8455" : "#1E2629"}`, borderRadius: 12,
      padding: "9px 10px", marginBottom: 6, position: "relative",
    }}>
      <input type="checkbox" checked={selected} onChange={onToggle}
        style={{ width: 16, height: 16, accentColor: "#3DDC84", flexShrink: 0, cursor: "pointer" }} />
      <div style={{ position: "relative" }}>
        <Avatar initials={player.name.split(" ").map(n => n[0]).join("").slice(0, 2)} />
        <div style={{
          position: "absolute", bottom: -1, right: -1, width: 8, height: 8, borderRadius: "50%",
          background: STATUS_COLOR[player.status], border: "2px solid #12181B",
        }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {player.name}
          </span>
          {player.verified && <ShieldCheck size={12} color="#3DDC84" style={{ flexShrink: 0 }} />}
        </div>
        <div style={{ fontSize: 11.5, color: "#8A9699", marginTop: 1 }}>{player.age}y</div>
      </div>
      <CSIBadge value={player.csi} />
      <button onClick={() => setMenuOpen(v => !v)} style={{
        background: "transparent", border: "none", cursor: "pointer", width: 26, height: 26,
        display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, flexShrink: 0,
      }}>
        <MoreHorizontal size={16} color="#8A9699" />
      </button>
      {menuOpen && <OverflowMenu onAction={onAction} onClose={() => setMenuOpen(false)} />}
    </div>
  );
}

function PositionGroup({ tierId, position, players, selected, onToggle, onAction, onAddPlayer }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11.5, color: "#5C6669", fontWeight: 600 }}>
          {position.toUpperCase()} · {players.length}
        </span>
        <button onClick={() => onAddPlayer(tierId, position)} style={{
          display: "flex", alignItems: "center", gap: 4, background: "transparent",
          border: "1px dashed #2A3336", borderRadius: 7, padding: "3px 8px", cursor: "pointer",
          color: "#8A9699", fontSize: 11,
        }}>
          <Plus size={11} /> Add player
        </button>
      </div>
      {players.length === 0 ? (
        <div style={{ border: "1px dashed #1E2629", borderRadius: 12, padding: "12px", textAlign: "center", color: "#4A5457", fontSize: 12 }}>
          No {position.toLowerCase()} yet
        </div>
      ) : (
        players.map(p => (
          <PlayerRow key={p.id} player={p} selected={selected.has(p.id)}
            onToggle={() => onToggle(p.id)} onAction={(action) => onAction(action, p, tierId, position)} />
        ))
      )}
    </div>
  );
}

export default function SquadTabV3() {
  const [tab, setTab] = useState("players");
  const [tiers, setTiers] = useState(INITIAL_TIERS);
  const [expanded, setExpanded] = useState({ t1: true, t2: false, t3: false });
  const [selected, setSelected] = useState(new Set());
  const [query, setQuery] = useState("");
  const [addingTeam, setAddingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [toast, setToast] = useState(null);
  const [transferCtx, setTransferCtx] = useState(null); // { tierId, position, playerIds }
  const [staff, setStaff] = useState(INITIAL_STAFF);
  const [addingStaff, setAddingStaff] = useState(false);
  const [pickingTeamForLineup, setPickingTeamForLineup] = useState(false);
  const [lineupTier, setLineupTier] = useState(null);
  const [showOrgStructure, setShowOrgStructure] = useState(false);

  const toggleTier = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));
  const toggleSelect = (id) => setSelected(s => {
    const next = new Set(s); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 1800); };

  const movePlayers = (tierId, fromPosition, playerIds, toPosition) => {
    setTiers(ts => ts.map(t => {
      if (t.id !== tierId) return t;
      const moving = t.players[fromPosition].filter(p => playerIds.includes(p.id));
      const staying = t.players[fromPosition].filter(p => !playerIds.includes(p.id));
      return {
        ...t,
        players: {
          ...t.players,
          [fromPosition]: staying,
          [toPosition]: [...t.players[toPosition], ...moving],
        },
      };
    }));
    showToast(`Moved ${playerIds.length > 1 ? playerIds.length + " players" : "player"} to ${toPosition}`);
    setSelected(new Set());
  };

  const handleAction = (action, player, tierId, position) => {
    if (action === "transfer") {
      setTransferCtx({ tierId, position, playerIds: [player.id] });
      return;
    }
    showToast(`${action === "view" ? "Opening" : action === "message" ? "Messaging" : "Deleting"} ${player.name}...`);
  };

  const handleAddPlayer = (tierId, position) => showToast(`Add player \u2192 ${position}`);

  const addTeam = () => {
    if (!newTeamName.trim()) return;
    const id = "t" + Date.now();
    setTiers(t => [...t, { id, name: newTeamName.trim(), players: Object.fromEntries(POSITIONS.map(p => [p, []])) }]);
    setExpanded(e => ({ ...e, [id]: true }));
    setNewTeamName(""); setAddingTeam(false);
  };

  const totalPlayers = useMemo(() => tiers.reduce((s, t) => s + Object.values(t.players).flat().length, 0), [tiers]);
  const filterPlayers = (players) => query ? players.filter(p => p.name.toLowerCase().includes(query.toLowerCase())) : players;

  // find tier/position for the current bulk selection (assumes same group; fine for a mock)
  const bulkTransferSource = useMemo(() => {
    if (selected.size === 0) return null;
    for (const t of tiers) {
      for (const pos of POSITIONS) {
        const ids = t.players[pos].map(p => p.id);
        if (ids.some(id => selected.has(id))) return { tierId: t.id, position: pos };
      }
    }
    return null;
  }, [selected, tiers]);

  const filteredStaff = query ? staff.filter(s => s.name.toLowerCase().includes(query.toLowerCase())) : staff;

  const addStaff = (name, role) => {
    const tint = TINTS[staff.length % TINTS.length];
    setStaff(s => [...s, { id: "s" + Date.now(), name, role, tint }]);
    setAddingStaff(false);
    showToast(`Added ${name} as ${role}`);
  };

  return (
    <div style={{
      background: "#0A0E10", minHeight: "100vh", color: "#F2F5F4",
      fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 420, margin: "0 auto", paddingBottom: 40,
    }}>
      <div style={{ padding: "20px 18px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>Squad</div>
          <div style={{ fontSize: 13, color: "#8A9699", marginTop: 2 }}>
            {totalPlayers} players · {staff.length} staff · {tiers.length} teams
          </div>
        </div>
        <button onClick={() => setPickingTeamForLineup(true)} style={{
          display: "flex", alignItems: "center", gap: 6, background: "#12181B", border: "1px solid #1E2629",
          borderRadius: 10, padding: "8px 12px", color: "#F2F5F4", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
        }}>
          <LayoutGrid size={14} color="#3DDC84" /> Lineups
        </button>
      </div>

      <div style={{ display: "flex", margin: "16px 18px 0", background: "#12181B", borderRadius: 10, padding: 3, border: "1px solid #1E2629" }}>
        {["players", "staff"].map(t => (
          <button key={t} onClick={() => { setTab(t); setSelected(new Set()); }} style={{
            flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
            background: tab === t ? "#1E2629" : "transparent", color: tab === t ? "#F2F5F4" : "#8A9699",
            fontSize: 13, fontWeight: 600,
          }}>
            {t === "players" ? `Players (${totalPlayers})` : `Staff (${staff.length})`}
          </button>
        ))}
      </div>

      <div style={{ margin: "12px 18px 0", position: "relative" }}>
        <Search size={16} color="#5C6669" style={{ position: "absolute", left: 12, top: 11 }} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search ${tab}...`} style={{
          width: "100%", background: "#12181B", border: "1px solid #1E2629", borderRadius: 10,
          padding: "9px 12px 9px 36px", color: "#F2F5F4", fontSize: 14, outline: "none", boxSizing: "border-box",
        }} />
      </div>

      {tab === "players" && (
        <div style={{ padding: "16px 18px 0" }}>
          {tiers.map(tier => {
            const tierPlayerCount = Object.values(tier.players).flat().length;
            return (
              <div key={tier.id} style={{ marginBottom: 10, border: "1px solid #1A2226", borderRadius: 14, overflow: "hidden" }}>
                <button onClick={() => toggleTier(tier.id)} style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "13px 14px", background: "#12181B", border: "none", cursor: "pointer",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Users size={15} color="#8A9699" />
                    <span style={{ fontSize: 14.5, fontWeight: 700 }}>{tier.name}</span>
                    <span style={{ fontSize: 11.5, color: "#5C6669" }}>({tierPlayerCount})</span>
                  </div>
                  {expanded[tier.id] ? <ChevronDown size={16} color="#8A9699" /> : <ChevronRight size={16} color="#8A9699" />}
                </button>
                {expanded[tier.id] && (
                  <div style={{ padding: "12px 12px 4px", background: "#0D1214" }}>
                    {POSITIONS.map(pos => (
                      <PositionGroup key={pos} tierId={tier.id} position={pos}
                        players={filterPlayers(tier.players[pos])} selected={selected}
                        onToggle={toggleSelect} onAction={handleAction} onAddPlayer={handleAddPlayer} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {addingTeam ? (
            <div style={{ display: "flex", gap: 6, background: "#12181B", border: "1px solid #1E2629", borderRadius: 12, padding: 8, marginTop: 4 }}>
              <input autoFocus value={newTeamName} onChange={e => setNewTeamName(e.target.value)}
                placeholder="Team name (e.g. U-17)" onKeyDown={e => e.key === "Enter" && addTeam()}
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#F2F5F4", fontSize: 13.5, padding: "4px 6px" }} />
              <button onClick={addTeam} style={{ background: "#3DDC8422", border: "1px solid #3DDC8455", borderRadius: 8, color: "#3DDC84", padding: "0 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Add</button>
              <button onClick={() => { setAddingTeam(false); setNewTeamName(""); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#5C6669", display: "flex", alignItems: "center" }}><X size={16} /></button>
            </div>
          ) : (
            <button onClick={() => setAddingTeam(true)} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              background: "transparent", border: "1px dashed #2A3336", borderRadius: 12, padding: "11px 0",
              color: "#8A9699", fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 4,
            }}>
              <Plus size={14} /> Add team
            </button>
          )}
        </div>
      )}

      {tab === "staff" && (
        <div style={{ padding: "16px 18px 0" }}>
          <button onClick={() => setShowOrgStructure(true)} style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            background: "#12181B", border: "1px solid #1E2629", borderRadius: 10, padding: "9px 0",
            color: "#F2F5F4", fontSize: 12.5, fontWeight: 600, cursor: "pointer", marginBottom: 14,
          }}>
            <LayoutGrid size={14} color="#3DDC84" /> Org structure
          </button>
          {filteredStaff.map(s => (
            <div key={s.id} style={{
              display: "flex", alignItems: "center", gap: 12, background: "#12181B",
              border: "1px solid #1E2629", borderRadius: 12, padding: "10px 12px", marginBottom: 8,
            }}>
              <Avatar initials={s.name.split(" ").map(n => n[0]).join("")} tint={s.tint} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 12, marginTop: 2, color: s.tint, fontWeight: 500 }}>{s.role}</div>
              </div>
              <button onClick={() => showToast(`Messaging ${s.name}...`)} style={{ background: "transparent", border: "none", cursor: "pointer", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8 }}>
                <MessageSquare size={15} color="#8A9699" />
              </button>
              <button onClick={() => showToast(`Opening ${s.name}'s profile...`)} style={{ background: "transparent", border: "none", cursor: "pointer", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8 }}>
                <ChevronRight size={15} color="#5C6669" />
              </button>
            </div>
          ))}
          <button onClick={() => setAddingStaff(true)} style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            background: "transparent", border: "1px dashed #2A3336", borderRadius: 12, padding: "11px 0",
            color: "#8A9699", fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 4,
          }}>
            <Plus size={14} /> Add staff
          </button>
        </div>
      )}

      {addingStaff && (
        <AddStaffModal onClose={() => setAddingStaff(false)} onConfirm={addStaff} />
      )}

      {pickingTeamForLineup && (
        <TeamPickerModal
          tiers={tiers}
          onClose={() => setPickingTeamForLineup(false)}
          onSelect={(t) => { setLineupTier(t); setPickingTeamForLineup(false); }}
        />
      )}

      {lineupTier && (
        <LineupView
          tier={tiers.find(t => t.id === lineupTier.id) || lineupTier}
          onBack={() => { setLineupTier(null); setPickingTeamForLineup(true); }}
          onClose={() => setLineupTier(null)}
        />
      )}

      {showOrgStructure && (
        <OrgStructureView staff={staff} onClose={() => setShowOrgStructure(false)} />
      )}

      {tab === "players" && selected.size > 0 && (
        <div style={{
          position: "sticky", bottom: 12, margin: "16px 18px 0", background: "#161D20",
          border: "1px solid #2A3336", borderRadius: 14, padding: "10px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 8px 24px rgba(0,0,0,.5)",
        }}>
          <span style={{ fontSize: 12.5 }}>{selected.size} selected</span>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => bulkTransferSource && setTransferCtx({ ...bulkTransferSource, playerIds: [...selected] })} style={bulkBtn}>
              <ArrowRightLeft size={13} /> Transfer
            </button>
            <button onClick={() => showToast(`Messaging ${selected.size} player(s)...`)} style={bulkBtn}>
              <MessageSquare size={13} /> Message
            </button>
            <button onClick={() => { showToast(`Deleting ${selected.size} player(s)...`); setSelected(new Set()); }} style={{ ...bulkBtn, color: "#E8544A" }}>
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
        <div style={{
          position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
          background: "#1E2629", border: "1px solid #2A3336", borderRadius: 10,
          padding: "8px 16px", fontSize: 12.5, color: "#F2F5F4", zIndex: 30,
        }}>{toast}</div>
      )}
    </div>
  );
}

const bulkBtn = {
  display: "flex", alignItems: "center", gap: 5, background: "transparent", border: "none",
  cursor: "pointer", color: "#F2F5F4", fontSize: 12, fontWeight: 500,
};

