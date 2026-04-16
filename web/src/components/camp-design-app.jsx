"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  addContactAction,
  addParentAction,
  awardPointsAction,
  createActivityAction,
  createAgendaItemAction,
  createCompetitionAction,
  completeCompetitionAction,
  createWardAction,
  createWardMealAction,
  deleteLeaderInvitationAction,
  deleteActivityAction,
  updateActivityAction,
  deleteAgendaItemAction,
  updateAgendaItemAction,
  saveCampRulesAction,
  deleteCompetitionAction,
  deleteContactAction,
  deleteParentAction,
  deleteWardAction,
  deleteWardMealAction,
  updateWardAction,
  updateWardMealAction,
  inviteLeaderAction,
  updateLeaderAction,
  refreshCampDesignDataAction,
  sendParentInviteAction,
  signOutCampAction,
  updateMyProfileAction,
} from "@/lib/app/camp-design-actions";
import { parseTimeLabel, timeLabelSortKey } from "@/lib/app/time-sort";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// ─── Design Tokens ───
const T = {
  bg: "#1a1612", bgCard: "#231f1a", bgCardHover: "#2c2720", bgSidebar: "#15120f",
  bgInput: "#2c2720", border: "#3a332b", borderLight: "#4a4238",
  text: "#e8e0d4", textMuted: "#9a8e7f", textDim: "#6b6054",
  accent: "#d4915e", accentLight: "#e6a872", accentDim: "#b07a4a",
  green: "#6b9e6b", greenBg: "#2a3528", blue: "#6b8eb0", blueBg: "#1e2a35",
  red: "#c46b5e", redBg: "#352220", yellow: "#c4a84e", yellowBg: "#35301e",
  purple: "#9a7eb8", purpleBg: "#2a2435",
  radius: "10px", radiusSm: "6px", shadow: "0 2px 12px rgba(0,0,0,0.3)",
  font: "'DM Sans', sans-serif", fontDisplay: "'Playfair Display', serif",
};

const Icon = ({ name, size = 20, color }) => {
  if (name === "utensils") {
    return (
      <img
        src="/meal-icon.svg"
        alt=""
        width={size}
        height={size}
        style={{ flexShrink: 0, display: "block", objectFit: "contain" }}
      />
    );
  }
  const s = { width: size, height: size, color: color || T.textMuted, strokeWidth: 1.8, fill: "none", stroke: "currentColor", flexShrink: 0 };
  const P = {
    home: <><path d="M3 12l9-8 9 8"/><path d="M5 10v10h4v-6h6v6h4V10"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
    trophy: <><path d="M6 9H4a2 2 0 01-2-2V5a2 2 0 012-2h2M18 9h2a2 2 0 002-2V5a2 2 0 00-2-2h-2"/><path d="M6 3h12v6a6 6 0 01-12 0V3zM9 21h6M12 15v6"/></>,
    camera: <><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></>,
    phone: <><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    clipboard: <><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></>,
    sun: <><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>,
    star: <><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    chevRight: <><path d="M9 18l6-6-6-6"/></>,
    menu: <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    flag: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>,
    check: <><path d="M20 6L9 17l-5-5"/></>,
    trash: <><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></>,
    edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    logOut: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></>,
  };
  return <svg viewBox="0 0 24 24" style={s} xmlns="http://www.w3.org/2000/svg">{P[name] || P.star}</svg>;
};

const CAMP_DAYS = ["Mon Jun 15", "Tue Jun 16", "Wed Jun 17", "Thu Jun 18", "Fri Jun 19"];

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

function todayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

const CAT_COLORS = { Sport: { bg: "#2a3528", text: "#6b9e6b" }, Water: { bg: "#1e2a35", text: "#6b8eb0" }, Spiritual: { bg: "#35301e", text: "#c4a84e" }, Competition: { bg: "#352220", text: "#c46b5e" }, Adventure: { bg: "#2a2435", text: "#9a7eb8" }, Service: { bg: "#2a3030", text: "#6bb0a0" } };
const STATUS_COLORS = { approved: { bg: T.greenBg, text: T.green }, pending: { bg: T.yellowBg, text: T.yellow }, waitlisted: { bg: T.purpleBg, text: T.purple }, active: { bg: T.greenBg, text: T.green }, completed: { bg: T.blueBg, text: T.blue }, upcoming: { bg: T.yellowBg, text: T.yellow }, revoked: { bg: T.redBg, text: T.red } };
const MEAL_TYPE_LABELS = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };

function MealWardLabel({ name, color }) {
  const fill = color && String(color).trim() ? color : T.textDim;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: fill,
          border: `1px solid ${T.border}`,
          flexShrink: 0,
        }}
        aria-hidden
      />
      <span>{name || "—"}</span>
    </span>
  );
}

const css = {
  badge: (bg, text) => ({ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, background: bg, color: text, letterSpacing: "0.02em", textTransform: "uppercase" }),
  card: { background: T.bgCard, borderRadius: T.radius, padding: "20px", boxShadow: T.shadow, border: `1px solid ${T.border}` },
  btn: (v = "primary") => ({ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: T.radiusSm, border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: T.font, transition: "all 0.15s ease", ...(v === "primary" ? { background: T.accent, color: "#1a1612" } : v === "ghost" ? { background: "transparent", color: T.textMuted, border: `1px solid ${T.border}` } : { background: T.redBg, color: T.red, border: `1px solid ${T.red}33` }) }),
  input: { width: "100%", padding: "10px 14px", borderRadius: T.radiusSm, border: `1px solid ${T.border}`, background: T.bgInput, color: T.text, fontSize: "14px", fontFamily: T.font, outline: "none" },
  select: { width: "100%", padding: "10px 14px", borderRadius: T.radiusSm, border: `1px solid ${T.border}`, background: T.bgInput, color: T.text, fontSize: "14px", fontFamily: T.font, outline: "none" },
  label: { display: "block", fontSize: "12px", fontWeight: 600, color: T.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" },
};

function dashboardHoverCss() {
  return `
    .camp-dash-stat {
      transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background-color 0.18s ease;
    }
    .camp-dash-stat:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 28px rgba(0,0,0,0.42);
      border-color: ${T.accent}66 !important;
      background-color: ${T.bgCardHover} !important;
    }
    .camp-dash-stat:active {
      transform: translateY(-1px);
    }
    .camp-dash-row {
      transition: background-color 0.15s ease, box-shadow 0.15s ease, transform 0.12s ease;
      cursor: pointer;
      border-radius: ${T.radiusSm};
    }
    .camp-dash-row:hover {
      background-color: ${T.accent}12;
      box-shadow: inset 0 0 0 1px ${T.accent}40;
    }
    .camp-dash-row:active {
      transform: scale(0.995);
    }
    .camp-dash-row:focus-visible {
      outline: 2px solid ${T.accent};
      outline-offset: 2px;
    }
    .camp-dash-ghost {
      transition: border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease, transform 0.12s ease, box-shadow 0.15s ease;
    }
    .camp-dash-ghost:hover:not(:disabled) {
      border-color: ${T.accent}77 !important;
      color: ${T.accentLight} !important;
      background-color: ${T.accent}18 !important;
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(0,0,0,0.25);
    }
    .camp-dash-ghost:active:not(:disabled) {
      transform: translateY(0);
    }
  `;
}

const Spinner = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" opacity="0.25" />
    <path d="M12 2a10 10 0 019.8 8" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
  </svg>
);

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: "home" },
  { key: "activities", label: "Activities", icon: "calendar" },
  { key: "agenda", label: "Daily Agenda", icon: "clock" },
  { key: "wardRosters", label: "Ward Rosters", icon: "users" },
  { key: "competitions", label: "Competitions", icon: "trophy" },
  { key: "photos", label: "Photo Gallery", icon: "camera" },
  { key: "contacts", label: "Contacts", icon: "phone" },
  { key: "rules", label: "Camp Rules", icon: "shield" },
  { key: "docs", label: "Documentation", icon: "book" },
  { section: "Leadership" },
  { key: "wards", label: "Wards", icon: "flag", leaderOnly: true },
  { key: "registration", label: "Registration", icon: "clipboard", leaderOnly: true },
  { key: "leaders", label: "Leaders", icon: "star", leaderOnly: true },
  { key: "inspiration", label: "Daily Inspiration", icon: "sun", leaderOnly: true },
  { key: "meals", label: "Meals", icon: "utensils", leaderOnly: true },
];

const PAGE_TO_PATH = {
  dashboard: "/",
  activities: "/activities",
  agenda: "/agenda",
  wardRosters: "/ward-rosters",
  wards: "/wards",
  competitions: "/competitions",
  registration: "/registration",
  photos: "/photos",
  contacts: "/contacts",
  rules: "/rules",
  inspiration: "/inspiration",
  leaders: "/stake-leaders",
  meals: "/meals",
  docs: "/documentation",
  profile: "/profile",
};

const LEADER_ONLY_PAGE_KEYS = new Set(["wards", "registration", "leaders", "inspiration", "meals"]);

function isLeaderOnlyPageKey(key) {
  return LEADER_ONLY_PAGE_KEYS.has(key);
}

function resolvePageFromPathname(pathname) {
  if (!pathname || pathname === "/" || pathname === "/dashboard") {
    return "dashboard";
  }

  if (pathname.startsWith("/activities")) return "activities";
  if (pathname.startsWith("/agenda")) return "agenda";
  if (pathname.startsWith("/ward-rosters") || pathname.startsWith("/unit-roster")) return "wardRosters";
  if (pathname.startsWith("/wards")) return "wards";
  if (pathname.startsWith("/competitions")) return "competitions";
  if (pathname.startsWith("/contacts")) return "contacts";
  if (pathname.startsWith("/rules")) return "rules";
  if (pathname.startsWith("/inspiration")) return "inspiration";
  if (pathname.startsWith("/meals")) return "meals";
  if (pathname.startsWith("/stake-leaders")) return "leaders";
  if (pathname.startsWith("/photos")) return "photos";
  if (pathname.startsWith("/documentation")) return "docs";
  if (pathname.startsWith("/profile")) return "profile";
  if (pathname.startsWith("/registration")) return "registration";

  return "dashboard";
}

const Badge = ({ children, bg, text }) => <span style={css.badge(bg, text)}>{children}</span>;
const StatusBadge = ({ status }) => { const c = STATUS_COLORS[status] || {}; return <Badge bg={c.bg} text={c.text}>{status}</Badge>; };
const formatInviteTimestamp = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(parsed);
};
const PageHeader = ({ icon, title, subtitle, action }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
    <div><div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}><Icon name={icon} size={26} color={T.accent} /><h1 style={{ fontFamily: T.fontDisplay, fontSize: "28px", fontWeight: 700, color: T.text, margin: 0 }}>{title}</h1></div>{subtitle && <p style={{ color: T.textMuted, fontSize: "14px", margin: "4px 0 0 38px" }}>{subtitle}</p>}</div>{action}
  </div>
);
const EmptyState = ({ icon, message }) => (<div style={{ textAlign: "center", padding: "60px 20px", color: T.textDim }}><Icon name={icon} size={48} color={T.textDim} /><p style={{ marginTop: "16px", fontSize: "15px" }}>{message}</p></div>);
const Modal = ({ open, onClose, title, children, width = 520 }) => {
  if (!open) return null;
  return (<div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
    <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }} />
    <div style={{ position: "relative", background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: T.radius, boxShadow: "0 16px 48px rgba(0,0,0,0.5)", width: "100%", maxWidth: width, maxHeight: "85vh", overflow: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: `1px solid ${T.border}` }}>
        <h3 style={{ fontFamily: T.fontDisplay, fontSize: "18px", color: T.text, margin: 0 }}>{title}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}><Icon name="x" size={20} color={T.textMuted} /></button>
      </div>
      <div style={{ padding: "22px" }}>{children}</div>
    </div>
  </div>);
};
const ConfirmDeleteModal = ({ open, onClose, onConfirm, title, message }) => {
  const [deleting, setDeleting] = useState(false);
  useEffect(() => { if (!open) setDeleting(false); }, [open]);
  const handleConfirm = async () => {
    if (deleting) return;
    setDeleting(true);
    try { await onConfirm(); } finally { setDeleting(false); }
  };
  if (!open) return null;
  return (<div style={{ position: "fixed", inset: 0, zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
    <div onClick={deleting ? undefined : onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }} />
    <div style={{ position: "relative", background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: T.radius, boxShadow: "0 16px 48px rgba(0,0,0,0.5)", width: "100%", maxWidth: 420 }}>
      <div style={{ padding: "24px 22px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: T.redBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="trash" size={20} color={T.red} />
          </div>
          <h3 style={{ fontFamily: T.fontDisplay, fontSize: "18px", color: T.text, margin: 0 }}>{title}</h3>
        </div>
        <p style={{ color: T.textMuted, fontSize: "14px", lineHeight: 1.6, margin: "0 0 20px" }}>{message}</p>
      </div>
      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", padding: "16px 22px", borderTop: `1px solid ${T.border}` }}>
        <button onClick={onClose} disabled={deleting} style={{ ...css.btn("ghost"), padding: "10px 20px", opacity: deleting ? 0.5 : 1 }}>Cancel</button>
        <button onClick={handleConfirm} disabled={deleting} style={{ background: T.red, color: "#fff", border: "none", borderRadius: T.radiusSm, padding: "10px 20px", fontSize: "14px", fontWeight: 600, cursor: deleting ? "not-allowed" : "pointer", fontFamily: T.font, opacity: deleting ? 0.7 : 1, display: "inline-flex", alignItems: "center", gap: "6px" }}>{deleting ? <><Spinner size={14} color="#fff" /> Deleting…</> : "Delete"}</button>
      </div>
    </div>
  </div>);
};
function fieldStyle(base, error) {
  if (!error) return base;
  return { ...base, borderColor: T.red, boxShadow: `0 0 0 1px ${T.red}55` };
}

function isValidEmailLoose(value) {
  const t = (value || "").trim();
  return t.includes("@") && !t.startsWith("@") && !t.endsWith("@");
}

function hasFirstAndLastName(value) {
  const tokens = (value || "").trim().split(/\s+/).filter(Boolean);
  return tokens.length >= 2;
}

const Field = ({ label, children, required, error, hint }) => (
  <div style={{ marginBottom: "16px" }}>
    <label style={css.label}>
      {label}
      {required ? <span style={{ color: T.red }} aria-hidden="true"> *</span> : null}
    </label>
    {children}
    {error ? (
      <p role="alert" style={{ color: T.red, fontSize: "12px", marginTop: "6px", marginBottom: 0 }}>{error}</p>
    ) : null}
    {hint && !error ? (
      <p style={{ color: T.textDim, fontSize: "11px", marginTop: "6px", marginBottom: 0 }}>{hint}</p>
    ) : null}
  </div>
);

function initialsFromName(name) {
  const tokens = (name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!tokens.length) return "U";
  if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
  return `${tokens[0][0]}${tokens[tokens.length - 1][0]}`.toUpperCase();
}

const Avatar = ({ name, src, size = 40, fontSize = 13 }) => {
  const initials = initialsFromName(name);
  const wrapperStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    border: `1px solid ${T.border}`,
    background: `linear-gradient(135deg, ${T.accent}44, ${T.accentDim}44)`,
    color: T.accent,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
    fontWeight: 700,
    fontSize: `${fontSize}px`,
    fontFamily: T.fontDisplay,
  };

  if (src) {
    return (
      <div style={wrapperStyle}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`${name || "User"} avatar`}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    );
  }

  return <div style={wrapperStyle}>{initials}</div>;
};

const PROFILE_AVATAR_BUCKET = "profile-avatars";
const MAX_AVATAR_FILE_BYTES = 40 * 1024 * 1024;
const MAX_AVATAR_DIMENSION = 800;
const MAX_AVATAR_OUTPUT_BYTES = 500 * 1024;

function parseAvatarObjectPath(avatarUrl) {
  if (!avatarUrl) {
    return null;
  }

  try {
    const parsed = new URL(avatarUrl);
    const marker = `/storage/v1/object/public/${PROFILE_AVATAR_BUCKET}/`;
    const markerIndex = parsed.pathname.indexOf(marker);
    if (markerIndex === -1) {
      return null;
    }

    return decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

async function compressAvatarImage(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Unable to read selected image."));
      img.src = objectUrl;
    });

    const sourceWidth = image.width || 1;
    const sourceHeight = image.height || 1;
    const longestSide = Math.max(sourceWidth, sourceHeight);
    const scale = longestSide > MAX_AVATAR_DIMENSION
      ? MAX_AVATAR_DIMENSION / longestSide
      : 1;
    const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
    const targetHeight = Math.max(1, Math.round(sourceHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Image compression is not supported in this browser.");
    }
    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    let quality = 0.85;
    let blob = null;
    while (quality >= 0.1) {
      blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, "image/webp", quality);
      });
      if (!blob) {
        throw new Error("Unable to compress image.");
      }
      if (blob.size <= MAX_AVATAR_OUTPUT_BYTES) break;
      quality -= 0.1;
    }

    if (blob && blob.size > MAX_AVATAR_OUTPUT_BYTES) {
      const reductionFactor = Math.sqrt(MAX_AVATAR_OUTPUT_BYTES / blob.size);
      const reducedWidth = Math.max(1, Math.round(targetWidth * reductionFactor));
      const reducedHeight = Math.max(1, Math.round(targetHeight * reductionFactor));
      canvas.width = reducedWidth;
      canvas.height = reducedHeight;
      context.drawImage(image, 0, 0, reducedWidth, reducedHeight);
      blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, "image/webp", 0.7);
      });
    }

    if (!blob) {
      throw new Error("Unable to compress image.");
    }

    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};
const EMPTY_PROFILE_OPTIONS = {
  wards: [],
  quorums: [],
  shirtSizes: [],
};

const NOTE_EDITOR_LINE_HEIGHT = 1.45;

/** Split note into plain text vs roster @Name segments (name must end before space/newline/end). */
function splitNoteForMentionHighlight(note, youngMen) {
  const names = Array.from(
    new Set(youngMen.map((m) => (m.name || "").trim()).filter(Boolean)),
  ).sort((a, b) => b.length - a.length || a.localeCompare(b));
  const parts = [];
  let i = 0;
  while (i < note.length) {
    if (note[i] !== "@") {
      let j = i + 1;
      while (j < note.length && note[j] !== "@") j++;
      if (j > i) parts.push({ kind: "text", text: note.slice(i, j) });
      i = j;
      continue;
    }
    let matched = "";
    for (const name of names) {
      if (name && note.startsWith(name, i + 1)) {
        const after = i + 1 + name.length;
        if (after >= note.length || /[\s\n]/.test(note[after])) {
          matched = name;
          break;
        }
      }
    }
    if (matched) {
      parts.push({ kind: "mention", text: `@${matched}` });
      i += 1 + matched.length;
    } else {
      parts.push({ kind: "text", text: "@" });
      i += 1;
    }
  }
  return parts;
}

// ═══════════════════════════════════════════
// PAGES
// ═══════════════════════════════════════════

const Dashboard = ({ goTo, wards, activities, competitions, pointLog, agenda, inspiration, meals }) => {
  const [mealMenuModal, setMealMenuModal] = useState(null);
  const today = inspiration[0] || { verse: "", ref: "" };
  const agendaDates = Object.keys(agenda).sort();
  const mealDates = [...new Set((meals || []).map((m) => m.mealDate))].sort();
  const firstDate = agendaDates[0] || mealDates[0] || "";
  const mergedAgendaRows = useMemo(() => {
    if (!firstDate) return [];
    const agendaItems = agenda[firstDate] || [];
    const mealItems = (meals || []).filter((m) => m.mealDate === firstDate);
    const rows = [
      ...agendaItems.map((a) => ({ kind: "agenda", ...a })),
      ...mealItems.map((m) => ({ kind: "meal", ...m })),
    ];
    rows.sort((a, b) => {
      const ta = timeLabelSortKey(a.kind === "agenda" ? a.time : a.time);
      const tb = timeLabelSortKey(b.kind === "agenda" ? b.time : b.time);
      if (ta !== tb) return ta - tb;
      const la = a.kind === "agenda" ? a.item : a.wardName;
      const lb = b.kind === "agenda" ? b.item : b.wardName;
      return la.localeCompare(lb);
    });
    return rows;
  }, [firstDate, agenda, meals]);
  const displayRows = mergedAgendaRows.slice(0, 6);
  const totalCampers = wards.reduce((s, w) => s + w.campers.length, 0);
  const totals = {}; wards.forEach(w => { totals[w.id] = 0; }); pointLog.forEach(p => { totals[p.wardId] = (totals[p.wardId] || 0) + p.points; });
  const top = Object.entries(totals).sort((a, b) => b[1] - a[1]).map(([wid]) => wards.find(w => w.id === wid)).filter(Boolean);
  return (
    <div>
      <style>{dashboardHoverCss()}</style>
      <PageHeader icon="home" title="Camp Dashboard" subtitle="Lehi Utah 3rd Stake — June 15–19, 2026" />
      <div style={{ ...css.card, marginBottom: "24px", background: `linear-gradient(135deg, ${T.bgCard} 0%, #2e2518 100%)`, borderLeft: `4px solid ${T.accent}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: "-20px", top: "-20px", opacity: 0.06, fontSize: "140px" }}>⛺</div>
        <p style={{ color: T.accentLight, fontFamily: T.fontDisplay, fontSize: "18px", fontStyle: "italic", margin: "0 0 8px", lineHeight: 1.5 }}>&quot;{today.verse}&quot;</p>
        <p style={{ color: T.textMuted, fontSize: "13px", margin: 0 }}>— {today.ref}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "14px", marginBottom: "28px" }}>
        {[{ label: "Wards", value: wards.length, icon: "flag", color: T.green, go: "wardRosters" }, { label: "Young Men", value: totalCampers, icon: "users", color: T.blue, go: "wardRosters" }, { label: "Activities", value: activities.length, icon: "calendar", color: T.accent, go: "activities" }, { label: "Competitions", value: competitions.length, icon: "trophy", color: T.yellow, go: "competitions" }].map(s => (
          <div key={s.label} className="camp-dash-stat" style={{ ...css.card, textAlign: "center", padding: "18px", cursor: "pointer" }} onClick={() => goTo(s.go)}>
            <Icon name={s.icon} size={22} color={s.color} />
            <div style={{ fontSize: "28px", fontWeight: 700, color: T.text, margin: "8px 0 2px", fontFamily: T.fontDisplay }}>{s.value}</div>
            <div style={{ fontSize: "12px", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div style={css.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}><h3 style={{ fontFamily: T.fontDisplay, fontSize: "17px", color: T.text, margin: 0 }}>Upcoming Agenda</h3>{firstDate && <span style={{ fontSize: "12px", color: T.textMuted }}>{formatDateLabel(firstDate)}</span>}</div>
          {displayRows.length ? displayRows.map((row, i) => (row.kind === "agenda" ? (
            <div
              key={`a-${row.id}`}
              role="button"
              tabIndex={0}
              className="camp-dash-row"
              onClick={() => goTo("agenda")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goTo("agenda"); } }}
              style={{ display: "flex", gap: "14px", padding: "10px 10px", margin: "0 -10px", borderBottom: i < displayRows.length - 1 ? `1px solid ${T.border}` : "none" }}
            >
              <span style={{ fontSize: "12px", color: T.accent, fontWeight: 600, minWidth: "70px", fontFamily: "monospace" }}>{row.time}</span>
              <span style={{ fontSize: "13px", color: T.text }}>{row.item}</span>
            </div>
          ) : (
            <div
              key={`m-${row.id}`}
              role="button"
              tabIndex={0}
              className="camp-dash-row"
              onClick={() => setMealMenuModal(row)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setMealMenuModal(row); } }}
              style={{ display: "flex", gap: "14px", padding: "10px 10px", margin: "0 -10px", borderBottom: i < displayRows.length - 1 ? `1px solid ${T.border}` : "none" }}
            >
              <span style={{ fontSize: "12px", color: T.accent, fontWeight: 600, minWidth: "70px", fontFamily: "monospace" }}>{row.time}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", color: T.text, display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <span>{MEAL_TYPE_LABELS[row.mealType]} ·</span>
                  <MealWardLabel name={row.wardName} color={row.wardColor} />
                </div>
                <div style={{ fontSize: "11px", color: T.textDim, marginTop: "2px" }}>Menu</div>
              </div>
            </div>
          ))) : (
            <p style={{ color: T.textDim, fontSize: "14px", margin: "0 0 8px" }}>{firstDate ? "No agenda items or meals for this day." : "No upcoming agenda or meals yet."}</p>
          )}
          <button type="button" className="camp-dash-ghost" onClick={() => goTo("agenda")} style={{ ...css.btn("ghost"), width: "100%", justifyContent: "center", marginTop: "12px" }}>Full Agenda →</button>
        </div>
        <div style={css.card}>
          <h3 style={{ fontFamily: T.fontDisplay, fontSize: "17px", color: T.text, margin: "0 0 18px" }}>🏆 Leaderboard</h3>
          {top.slice(0, 4).map((u, i) => (<div key={u.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 0", borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}><span style={{ fontSize: "18px", fontWeight: 800, color: i === 0 ? T.yellow : T.textDim, fontFamily: T.fontDisplay, minWidth: "28px" }}>#{i + 1}</span><div style={{ width: "10px", height: "10px", borderRadius: "50%", background: u.color }} /><span style={{ flex: 1, fontWeight: 600, color: T.text, fontSize: "14px" }}>{u.name}</span><span style={{ fontFamily: "monospace", color: T.accent, fontWeight: 700 }}>{totals[u.id]} pts</span></div>))}
          <button type="button" className="camp-dash-ghost" onClick={() => goTo("competitions")} style={{ ...css.btn("ghost"), width: "100%", justifyContent: "center", marginTop: "12px" }}>Competitions →</button>
        </div>
      </div>
      <Modal
        open={!!mealMenuModal}
        onClose={() => setMealMenuModal(null)}
        title={
          mealMenuModal ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span>{`${MEAL_TYPE_LABELS[mealMenuModal.mealType]} —`}</span>
              <MealWardLabel name={mealMenuModal.wardName} color={mealMenuModal.wardColor} />
            </span>
          ) : ""
        }
        width={520}
      >
        {mealMenuModal ? <p style={{ color: T.text, lineHeight: 1.65, whiteSpace: "pre-wrap", margin: 0, fontSize: "14px" }}>{mealMenuModal.menu}</p> : null}
      </Modal>
    </div>
  );
};

const ActivitiesPage = ({ activities, applyResult, isLeader }) => {
  const [view, setView] = useState("timeline");
  const [modal, setModal] = useState(false);
  const [editActivity, setEditActivity] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const busy = saving || !!deletingId;
  const emptyForm = { title: "", category: "Sport", date: todayDateStr(), time: "", location: "", desc: "" };
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const clearActivityErr = (key) => setFormErrors((e) => { if (!e[key]) return e; const n = { ...e }; delete n[key]; return n; });
  const validateActivityForm = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required.";
    if (!form.date) e.date = "Date is required.";
    if (!form.time.trim()) e.time = "Time is required.";
    else if (!parseTimeLabel(form.time)) e.time = "Enter a valid time (e.g. 9:00 AM or 14:00).";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };
  const openCreate = () => { setEditActivity(null); setForm(emptyForm); setFormErrors({}); setModal(true); };
  const openEdit = (a) => { setEditActivity(a); setForm({ title: a.title, category: a.category, date: a.date, time: a.time, location: a.location, desc: a.desc }); setFormErrors({}); setModal(true); };
  const closeModal = () => { setModal(false); setEditActivity(null); setFormErrors({}); };
  const save = async () => {
    if (saving || !validateActivityForm()) return;
    setSaving(true);
    try {
      const result = editActivity
        ? await updateActivityAction(editActivity.id, form)
        : await createActivityAction(form);
      if (applyResult(result)) {
        setForm(emptyForm);
        closeModal();
      }
    } finally { setSaving(false); }
  };
  const del = async (id) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const result = await deleteActivityAction(id);
      applyResult(result);
    } finally { setDeletingId(null); }
  };
  const dateGroups = useMemo(() => {
    const groups = {};
    activities.forEach(a => { if (!groups[a.date]) groups[a.date] = []; groups[a.date].push(a); });
    return Object.keys(groups).sort().map(date => ({ date, label: formatDateLabel(date), acts: groups[date] }));
  }, [activities]);
  return (
    <div>
      <PageHeader icon="calendar" title="Activities" subtitle={`${activities.length} activities scheduled`}
        action={<div style={{ display: "flex", gap: "8px" }}>{["timeline", "grid"].map(v => <button key={v} onClick={() => setView(v)} style={{ ...css.btn(view === v ? "primary" : "ghost"), padding: "6px 14px", fontSize: "12px", textTransform: "capitalize" }}>{v}</button>)}{isLeader && <button onClick={openCreate} style={css.btn()}><Icon name="plus" size={16} color="#1a1612" /> Add</button>}</div>} />
      <Modal open={modal} onClose={closeModal} title={editActivity ? "Edit Activity" : "New Activity"}>
        <Field label="Title" required error={formErrors.title}>
          <input style={fieldStyle(css.input, formErrors.title)} value={form.title} onChange={e => { setForm(p => ({ ...p, title: e.target.value })); clearActivityErr("title"); }} placeholder="Activity name" />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Field label="Category"><select style={css.select} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>{Object.keys(CAT_COLORS).map(c => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Date" required error={formErrors.date}>
            <input type="date" style={fieldStyle(css.input, formErrors.date)} value={form.date} onChange={e => { setForm(p => ({ ...p, date: e.target.value })); clearActivityErr("date"); }} />
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Field label="Time" required error={formErrors.time}>
            <input style={fieldStyle(css.input, formErrors.time)} value={form.time} onChange={e => { setForm(p => ({ ...p, time: e.target.value })); clearActivityErr("time"); }} placeholder="9:00 AM" />
          </Field>
          <Field label="Location"><input style={css.input} value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Field B" /></Field>
        </div>
        <Field label="Description"><textarea style={{ ...css.input, minHeight: "70px", resize: "vertical" }} value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} /></Field>
        <button onClick={save} disabled={saving} style={{ ...css.btn(), width: "100%", justifyContent: "center", padding: "12px", opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}>{saving ? <><Spinner size={14} /> Saving…</> : editActivity ? "Save Changes" : "Create Activity"}</button>
      </Modal>
      {view === "timeline" ? (dateGroups.length ? dateGroups.map(({ date, label, acts }) => (
        <div key={date} style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}><div style={{ width: "8px", height: "8px", borderRadius: "50%", background: T.accent }} /><h3 style={{ fontFamily: T.fontDisplay, fontSize: "16px", color: T.accentLight, margin: 0 }}>{label}</h3><div style={{ flex: 1, height: "1px", background: T.border }} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px", paddingLeft: "20px" }}>{acts.map(a => { const cc = CAT_COLORS[a.category] || {}; return (<div key={a.id} style={{ ...css.card, padding: "16px", position: "relative" }}>{isLeader && <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: "6px" }}><button disabled={busy} onClick={() => openEdit(a)} style={{ background: "none", border: "none", cursor: busy ? "not-allowed" : "pointer", opacity: 0.4 }}><Icon name="edit" size={14} color={T.accent} /></button><button disabled={busy} onClick={() => del(a.id)} style={{ background: "none", border: "none", cursor: busy ? "not-allowed" : "pointer", opacity: 0.4 }}>{deletingId === a.id ? <Spinner size={14} color={T.red} /> : <Icon name="trash" size={14} color={T.red} />}</button></div>}<div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", paddingRight: isLeader ? "48px" : "0" }}><span style={{ fontWeight: 600, color: T.text }}>{a.title}</span><Badge bg={cc.bg} text={cc.text}>{a.category}</Badge></div><p style={{ fontSize: "13px", color: T.textMuted, margin: "0 0 10px" }}>{a.desc}</p><div style={{ display: "flex", gap: "16px", fontSize: "12px", color: T.textDim }}><span>🕐 {a.time}</span><span>📍 {a.location}</span></div></div>); })}</div>
        </div>
      )) : <EmptyState icon="calendar" message="No activities scheduled yet." />) : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px" }}>{activities.map(a => { const cc = CAT_COLORS[a.category] || {}; return (<div key={a.id} style={{ ...css.card, padding: "16px", position: "relative" }}>{isLeader && <button disabled={busy} onClick={() => openEdit(a)} style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", cursor: busy ? "not-allowed" : "pointer", opacity: 0.4 }}><Icon name="edit" size={14} color={T.accent} /></button>}<Badge bg={cc.bg} text={cc.text}>{a.category}</Badge><h4 style={{ color: T.text, margin: "10px 0 6px" }}>{a.title}</h4><p style={{ fontSize: "13px", color: T.textMuted, margin: "0 0 10px" }}>{a.desc}</p><div style={{ fontSize: "12px", color: T.textDim }}>{formatDateLabel(a.date)} · {a.time} · {a.location}</div></div>); })}</div>}
    </div>
  );
};

const AgendaPage = ({ agenda, applyResult, isLeader }) => {
  const dateTabs = useMemo(() => Object.keys(agenda).sort(), [agenda]);
  const [activeDate, setActiveDate] = useState(() => dateTabs[0] || "");
  useEffect(() => { if (!agenda[activeDate] && dateTabs.length) setActiveDate(dateTabs[0]); }, [dateTabs, activeDate, agenda]);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const busy = saving || !!deletingId;
  const emptyForm = { date: activeDate || todayDateStr(), time: "", item: "", location: "" };
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const clearAgendaErr = (key) => setFormErrors((e) => { if (!e[key]) return e; const n = { ...e }; delete n[key]; return n; });
  const validateAgendaForm = () => {
    const e = {};
    if (!form.date) e.date = "Date is required.";
    if (!form.time.trim()) e.time = "Time is required.";
    else if (!parseTimeLabel(form.time)) e.time = "Enter a valid time (e.g. 10:00 AM or 14:00).";
    if (!form.item.trim()) e.item = "Activity is required.";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };
  const items = agenda[activeDate] || [];
  const openCreate = () => { setEditItem(null); setForm({ ...emptyForm, date: activeDate || todayDateStr() }); setFormErrors({}); setModal(true); };
  const openEdit = (a) => { setEditItem(a); setForm({ date: a.date, time: a.time, item: a.item, location: a.location }); setFormErrors({}); setModal(true); };
  const closeModal = () => { setModal(false); setEditItem(null); setFormErrors({}); };
  const save = async () => {
    if (saving || !validateAgendaForm()) return;
    setSaving(true);
    try {
      const result = editItem
        ? await updateAgendaItemAction(editItem.id, form)
        : await createAgendaItemAction(form);
      if (applyResult(result)) {
        setForm(emptyForm);
        closeModal();
      }
    } finally { setSaving(false); }
  };
  const del = async (id) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const result = await deleteAgendaItemAction(id);
      applyResult(result);
    } finally { setDeletingId(null); }
  };
  return (
    <div>
      <PageHeader icon="clock" title="Daily Agenda" subtitle="Day-by-day schedule" action={isLeader ? <button onClick={openCreate} style={css.btn()}><Icon name="plus" size={16} color="#1a1612" /> Add Item</button> : null} />
      <Modal open={modal} onClose={closeModal} title={editItem ? "Edit Agenda Item" : "New Agenda Item"}>
        <Field label="Date" required error={formErrors.date}>
          <input type="date" style={fieldStyle(css.input, formErrors.date)} value={form.date} onChange={e => { setForm(p => ({ ...p, date: e.target.value })); clearAgendaErr("date"); }} />
        </Field>
        <Field label="Time" required error={formErrors.time}>
          <input style={fieldStyle(css.input, formErrors.time)} value={form.time} onChange={e => { setForm(p => ({ ...p, time: e.target.value })); clearAgendaErr("time"); }} placeholder="10:00 AM" />
        </Field>
        <Field label="Activity" required error={formErrors.item}>
          <input style={fieldStyle(css.input, formErrors.item)} value={form.item} onChange={e => { setForm(p => ({ ...p, item: e.target.value })); clearAgendaErr("item"); }} placeholder="Activity name" />
        </Field>
        <Field label="Location"><input style={css.input} value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Pavilion" /></Field>
        <button onClick={save} disabled={saving} style={{ ...css.btn(), width: "100%", justifyContent: "center", padding: "12px", opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}>{saving ? <><Spinner size={14} /> Saving…</> : editItem ? "Save Changes" : "Add Item"}</button>
      </Modal>
      {dateTabs.length ? (
        <>
          <div style={{ display: "flex", gap: "6px", marginBottom: "24px", flexWrap: "wrap" }}>{dateTabs.map(d => <button key={d} onClick={() => setActiveDate(d)} style={{ ...css.btn(activeDate === d ? "primary" : "ghost"), padding: "8px 18px" }}>{formatDateLabel(d)}</button>)}</div>
          {items.length ? <div style={{ ...css.card, padding: 0, overflow: "hidden" }}>{items.map((a, i) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "20px", padding: "14px 20px", borderBottom: i < items.length - 1 ? `1px solid ${T.border}` : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
              <div style={{ minWidth: "80px", fontFamily: "monospace", fontSize: "13px", fontWeight: 700, color: T.accent }}>{a.time}</div>
              <div style={{ width: "3px", height: "28px", borderRadius: "2px", background: T.accent, opacity: 0.3 }} />
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600, color: T.text, fontSize: "14px" }}>{a.item}</div><div style={{ fontSize: "12px", color: T.textDim, marginTop: "2px" }}>📍 {a.location}</div></div>
              {isLeader && <div style={{ display: "flex", gap: "6px" }}><button disabled={busy} onClick={() => openEdit(a)} style={{ background: "none", border: "none", cursor: busy ? "not-allowed" : "pointer", opacity: 0.4 }}><Icon name="edit" size={14} color={T.accent} /></button><button disabled={busy} onClick={() => del(a.id)} style={{ background: "none", border: "none", cursor: busy ? "not-allowed" : "pointer", opacity: 0.4 }}>{deletingId === a.id ? <Spinner size={14} color={T.red} /> : <Icon name="trash" size={14} color={T.red} />}</button></div>}
            </div>
          ))}</div> : <EmptyState icon="clock" message="No agenda items for this day." />}
        </>
      ) : <EmptyState icon="clock" message="No agenda items yet." />}
    </div>
  );
};

const MealsPage = ({ meals, wards, applyResult, canManageContent }) => {
  const dateTabs = useMemo(() => {
    const sorted = [...new Set(meals.map((m) => m.mealDate))].sort();
    return sorted.length ? sorted : [todayDateStr()];
  }, [meals]);
  const [activeDate, setActiveDate] = useState(() => dateTabs[0] || todayDateStr());
  useEffect(() => {
    if (dateTabs.includes(activeDate)) return;
    setActiveDate(dateTabs[0] || todayDateStr());
  }, [dateTabs, activeDate]);
  const [modal, setModal] = useState(false);
  const [editMeal, setEditMeal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const busy = saving || !!deletingId;
  const [form, setForm] = useState({
    wardId: "",
    date: todayDateStr(),
    time: "7:00 AM",
    mealType: "breakfast",
    menu: "",
  });
  const [mealErrors, setMealErrors] = useState({});
  const clearMealErr = (key) => setMealErrors((e) => { if (!e[key]) return e; const n = { ...e }; delete n[key]; return n; });
  const rows = useMemo(
    () =>
      [...meals.filter((m) => m.mealDate === activeDate)].sort(
        (a, b) => timeLabelSortKey(a.time) - timeLabelSortKey(b.time),
      ),
    [meals, activeDate],
  );
  const openCreate = () => {
    setEditMeal(null);
    setForm({
      wardId: wards[0]?.id || "",
      date: activeDate || todayDateStr(),
      time: "7:00 AM",
      mealType: "breakfast",
      menu: "",
    });
    setMealErrors({});
    setModal(true);
  };
  const openEdit = (m) => {
    setEditMeal(m);
    setForm({
      wardId: m.wardId,
      date: m.mealDate,
      time: m.time,
      mealType: m.mealType,
      menu: m.menu,
    });
    setMealErrors({});
    setModal(true);
  };
  const closeModal = () => {
    setModal(false);
    setEditMeal(null);
    setMealErrors({});
  };
  const validateMealForm = () => {
    const e = {};
    if (!form.wardId) e.wardId = "Select a ward.";
    if (!form.date) e.date = "Choose a date.";
    if (!form.time?.trim()) e.time = "Enter a time.";
    else if (!parseTimeLabel(form.time)) e.time = 'Use a time like "7:00 AM", "12:30 PM", or 24-hour "13:00".';
    if (!form.menu.trim()) e.menu = "Enter the menu.";
    setMealErrors(e);
    return Object.keys(e).length === 0;
  };
  const save = async () => {
    if (saving || !validateMealForm()) return;
    setSaving(true);
    try {
      const payload = {
        wardId: form.wardId,
        date: form.date,
        time: form.time,
        mealType: form.mealType,
        menu: form.menu,
      };
      const result = editMeal
        ? await updateWardMealAction(editMeal.id, payload)
        : await createWardMealAction(payload);
      if (applyResult(result)) closeModal();
    } finally {
      setSaving(false);
    }
  };
  const del = async (id) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const result = await deleteWardMealAction(id);
      applyResult(result);
    } finally {
      setDeletingId(null);
    }
  };
  const preview = (text) => {
    const t = (text || "").trim();
    if (t.length <= 72) return t || "—";
    return `${t.slice(0, 72)}…`;
  };
  return (
    <div>
      <PageHeader
        icon="utensils"
        title="Meals"
        subtitle="Ward meal assignments and menus"
        action={canManageContent && wards.length ? (
          <button type="button" onClick={openCreate} style={css.btn()}>
            <Icon name="plus" size={16} color="#1a1612" /> Add Meal
          </button>
        ) : null}
      />
      <Modal open={modal} onClose={closeModal} title={editMeal ? "Edit Meal" : "New Meal"} width={560}>
        <Field label="Ward" required error={mealErrors.wardId}>
          <select style={fieldStyle(css.select, mealErrors.wardId)} value={form.wardId} onChange={(e) => { setForm((p) => ({ ...p, wardId: e.target.value })); clearMealErr("wardId"); }}>
            <option value="">Select ward</option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Field label="Date" required error={mealErrors.date}>
            <input type="date" style={fieldStyle(css.input, mealErrors.date)} value={form.date} onChange={(e) => { setForm((p) => ({ ...p, date: e.target.value })); clearMealErr("date"); }} />
          </Field>
          <Field label="Time" required error={mealErrors.time}>
            <input style={fieldStyle(css.input, mealErrors.time)} value={form.time} onChange={(e) => { setForm((p) => ({ ...p, time: e.target.value })); clearMealErr("time"); }} placeholder="7:00 AM" />
          </Field>
        </div>
        <Field label="Meal">
          <select style={css.select} value={form.mealType} onChange={(e) => setForm((p) => ({ ...p, mealType: e.target.value }))}>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </select>
        </Field>
        <Field label="Menu" required error={mealErrors.menu}>
          <textarea style={{ ...fieldStyle(css.input, mealErrors.menu), minHeight: "100px", resize: "vertical" }} value={form.menu} onChange={(e) => { setForm((p) => ({ ...p, menu: e.target.value })); clearMealErr("menu"); }} placeholder="Main dishes, sides, drinks…" />
        </Field>
        <button type="button" onClick={save} disabled={saving} style={{ ...css.btn(), width: "100%", justifyContent: "center", padding: "12px", opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}>{saving ? <><Spinner size={14} /> Saving…</> : editMeal ? "Save Changes" : "Create Meal"}</button>
      </Modal>
      {!wards.length ? (
        <EmptyState icon="flag" message="Add wards before scheduling meals." />
      ) : (
        <>
          <div style={{ display: "flex", gap: "6px", marginBottom: "24px", flexWrap: "wrap" }}>
            {dateTabs.map((d) => (
              <button key={d} type="button" onClick={() => setActiveDate(d)} style={{ ...css.btn(activeDate === d ? "primary" : "ghost"), padding: "8px 18px" }}>{formatDateLabel(d)}</button>
            ))}
          </div>
          {rows.length ? (
            <div style={{ ...css.card, padding: 0, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "720px" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    {["Time", "Ward", "Meal", "Menu", ...(canManageContent ? ["Actions"] : [])].map((h) => (
                      <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: T.textMuted, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((m, index) => (
                    <tr key={m.id} style={{ borderBottom: `1px solid ${T.border}`, background: index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                      <td style={{ padding: "11px 14px", fontFamily: "monospace", color: T.accent, fontWeight: 600 }}>{m.time}</td>
                      <td style={{ padding: "11px 14px", color: T.text }}>
                        <MealWardLabel name={m.wardName} color={m.wardColor} />
                      </td>
                      <td style={{ padding: "11px 14px", color: T.textMuted }}>{MEAL_TYPE_LABELS[m.mealType]}</td>
                      <td style={{ padding: "11px 14px", color: T.textDim, maxWidth: "280px" }}>{preview(m.menu)}</td>
                      {canManageContent ? (
                        <td style={{ padding: "11px 14px", width: "88px" }}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button type="button" disabled={busy} onClick={() => openEdit(m)} style={{ background: "none", border: "none", cursor: busy ? "not-allowed" : "pointer", opacity: 0.5 }}><Icon name="edit" size={14} color={T.accent} /></button>
                            <button type="button" disabled={busy} onClick={() => del(m.id)} style={{ background: "none", border: "none", cursor: busy ? "not-allowed" : "pointer", opacity: 0.5 }}>{deletingId === m.id ? <Spinner size={14} color={T.red} /> : <Icon name="trash" size={14} color={T.red} />}</button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon="utensils" message="No meals for this day." />
          )}
        </>
      )}
    </div>
  );
};


const WARD_COLOR_PRESETS = [
  "#d4915e", "#6b9e6b", "#6b8eb0", "#c46b5e", "#c4a84e",
  "#9a7eb8", "#e6735c", "#5c9e9e", "#b8864e", "#7a8ec4",
  "#c47ea8", "#8eb85c", "#d4b86b", "#6bc4c4", "#b85c7a",
];

const WardsPage = ({ wards, applyResult, isLeader }) => {
  const [modal, setModal] = useState(false);
  const [editWard, setEditWard] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const busy = saving || !!deletingId;
  const emptyForm = { name: "", leader: "", leader_phone: "", color: "" };
  const [wardForm, setWardForm] = useState(emptyForm);
  const [wardErrors, setWardErrors] = useState({});

  const openCreateModal = () => {
    setEditWard(null);
    setWardForm(emptyForm);
    setWardErrors({});
    setModal(true);
  };

  const openEditModal = (ward) => {
    setEditWard(ward);
    setWardForm({ name: ward.name, leader: ward.leader, leader_phone: ward.leader_phone, color: ward.color || "" });
    setWardErrors({});
    setModal(true);
  };

  const saveWard = async () => {
    if (saving) return;
    if (!wardForm.name.trim()) {
      setWardErrors({ name: "Ward name is required." });
      return;
    }
    setWardErrors({});
    setSaving(true);
    try {
      if (editWard) {
        const result = await updateWardAction(editWard.id, wardForm);
        if (applyResult(result)) {
          setWardForm(emptyForm);
          setEditWard(null);
          setModal(false);
        }
      } else {
        const result = await createWardAction(wardForm);
        if (applyResult(result)) {
          setWardForm(emptyForm);
          setModal(false);
        }
      }
    } finally { setSaving(false); }
  };

  const deleteWard = async (wardId) => {
    if (deletingId) return;
    setDeletingId(wardId);
    try {
      const result = await deleteWardAction(wardId);
      applyResult(result);
    } finally { setDeletingId(null); }
  };

  const closeModal = () => {
    setModal(false);
    setEditWard(null);
    setWardForm(emptyForm);
    setWardErrors({});
  };

  return (
    <div>
      <PageHeader icon="flag" title="Wards" subtitle={`${wards.length} wards in the stake`} action={isLeader ? <button onClick={openCreateModal} style={css.btn()}><Icon name="plus" size={16} color="#1a1612" /> Add Ward</button> : null} />
      <Modal open={modal} onClose={closeModal} title={editWard ? "Edit Ward" : "Create Ward"} width={560}>
        <Field label="Ward Name" required error={wardErrors.name}>
          <input style={fieldStyle(css.input, wardErrors.name)} value={wardForm.name} onChange={e => { setWardForm(p => ({ ...p, name: e.target.value })); if (wardErrors.name) setWardErrors({}); }} placeholder="Lehi 3rd Ward" />
        </Field>
        <Field label="Ward Leader"><input style={css.input} value={wardForm.leader} onChange={e => setWardForm(p => ({ ...p, leader: e.target.value }))} placeholder="Bro. Smith" /></Field>
        <Field label="Leader Phone"><input style={css.input} type="tel" value={wardForm.leader_phone} onChange={e => setWardForm(p => ({ ...p, leader_phone: e.target.value }))} placeholder="(801) 555-1234" /></Field>
        <Field label="Ward Color">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
            {WARD_COLOR_PRESETS.map((c) => (
              <button key={c} onClick={() => setWardForm(p => ({ ...p, color: c }))} style={{
                width: 32, height: 32, borderRadius: "6px", border: wardForm.color === c ? "2px solid #fff" : "2px solid transparent",
                background: c, cursor: "pointer", boxShadow: wardForm.color === c ? "0 0 0 2px " + c : "none", transition: "all 0.15s",
              }} />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input type="color" value={wardForm.color || "#d4915e"} onChange={e => setWardForm(p => ({ ...p, color: e.target.value }))} style={{ width: 40, height: 32, border: "none", background: "none", cursor: "pointer", padding: 0 }} />
            <input style={{ ...css.input, flex: 1 }} value={wardForm.color} onChange={e => setWardForm(p => ({ ...p, color: e.target.value }))} placeholder="#d4915e" />
            {wardForm.color && <button onClick={() => setWardForm(p => ({ ...p, color: "" }))} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: "12px" }}>Clear</button>}
          </div>
        </Field>
        <button onClick={saveWard} disabled={saving} style={{ ...css.btn(), width: "100%", justifyContent: "center", padding: "12px", opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}>{saving ? <><Spinner size={14} /> Saving…</> : editWard ? "Save Changes" : "Create Ward"}</button>
      </Modal>
      {!wards.length ? (
        <EmptyState icon="flag" message="No wards yet. Create your first ward to get started." />
      ) : (
        <div style={{ ...css.card, padding: 0, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "640px" }}>
            <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>{["_color", "Ward", "Leader", "Phone", "Young Men", ...(isLeader ? ["_actions"] : [])].map(h => <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: T.textMuted, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{h.startsWith("_") ? "" : h}</th>)}</tr></thead>
            <tbody>{wards.map((ward, index) => (
              <tr key={ward.id} style={{ borderBottom: `1px solid ${T.border}`, background: index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                <td style={{ padding: "11px 14px", width: "36px" }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", background: ward.color || T.textDim, border: `1px solid ${T.border}` }} />
                </td>
                <td style={{ padding: "11px 14px", fontWeight: 700, color: T.text }}>{ward.name}</td>
                <td style={{ padding: "11px 14px", color: T.textMuted }}>{ward.leader || "—"}</td>
                <td style={{ padding: "11px 14px", color: T.textMuted }}>{ward.leader_phone || "—"}</td>
                <td style={{ padding: "11px 14px", color: T.textMuted }}>{ward.campers.length}</td>
                {isLeader && <td style={{ padding: "11px 14px", width: "100px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => openEditModal(ward)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.45 }}><Icon name="edit" size={14} color={T.accent} /></button>
                    <button disabled={busy} onClick={() => deleteWard(ward.id)} style={{ background: "none", border: "none", cursor: busy ? "not-allowed" : "pointer", opacity: 0.45 }}>{deletingId === ward.id ? <Spinner size={14} color={T.red} /> : <Icon name="trash" size={14} color={T.red} />}</button>
                  </div>
                </td>}
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const CompetitionsPage = ({
  competitions,
  pointLog,
  wards,
  awardLeaderName,
  mentionYoungMen = EMPTY_ARRAY,
  applyResult,
  isLeader,
  canCompleteCompetition = false,
}) => {
  const [expanded, setExpanded] = useState(null);
  const [modal, setModal] = useState(null);
  const [awardComp, setAwardComp] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const [compForm, setCompForm] = useState({ name: "", rules: "", status: "upcoming" });
  const [compFormErrors, setCompFormErrors] = useState({});
  const [pointForm, setPointForm] = useState({ wardId: "", points: "", note: "" });
  const [pointFormErrors, setPointFormErrors] = useState({});
  const [mentionPicker, setMentionPicker] = useState(null);
  const noteRef = useRef(null);
  const noteMirrorInnerRef = useRef(null);

  const noteHighlightParts = useMemo(
    () => splitNoteForMentionHighlight(pointForm.note, mentionYoungMen),
    [pointForm.note, mentionYoungMen],
  );

  const syncNoteMirrorScroll = (el) => {
    const inner = noteMirrorInnerRef.current;
    if (!inner || !el) return;
    inner.style.transform = `translate(${-el.scrollLeft}px, ${-el.scrollTop}px)`;
  };

  const totals = useMemo(() => { const t = {}; wards.forEach(w => { t[w.id] = 0; }); pointLog.forEach(p => { t[p.wardId] = (t[p.wardId] || 0) + p.points; }); return t; }, [pointLog, wards]);
  const leaderboard = useMemo(() => Object.entries(totals).map(([wid, pts]) => ({ ward: wards.find(w => w.id === wid), pts })).filter(e => e.ward).sort((a, b) => b.pts - a.pts), [totals, wards]);

  const [savingComp, setSavingComp] = useState(false);
  const [deletingCompId, setDeletingCompId] = useState(null);
  const [awarding, setAwarding] = useState(false);

  const addComp = async () => {
    if (savingComp) return;
    if (!compForm.name.trim()) {
      setCompFormErrors({ name: "Name is required." });
      return;
    }
    setCompFormErrors({});
    setSavingComp(true);
    try {
      const result = await createCompetitionAction(compForm);
      if (applyResult(result)) {
        setCompForm({ name: "", rules: "", status: "upcoming" });
        setModal(null);
      }
    } finally { setSavingComp(false); }
  };
  const delComp = async (id) => {
    if (deletingCompId) return;
    setDeletingCompId(id);
    try {
      const result = await deleteCompetitionAction(id);
      applyResult(result);
    } finally { setDeletingCompId(null); }
  };
  const markComplete = async (id) => {
    if (!id || completingId) return;
    setCompletingId(id);
    try {
      const result = await completeCompetitionAction(id);
      applyResult(result);
    } finally {
      setCompletingId(null);
    }
  };
  const openAward = (c) => {
    if (c.status === "completed") return;
    setAwardComp(c);
    setMentionPicker(null);
    setPointForm({ wardId: wards[0]?.id || "", points: "", note: "" });
    setPointFormErrors({});
    setModal("points");
  };

  const displayAwardLeader = (awardLeaderName || "").trim() || "No display name in profile";

  const handlePointsInput = (raw) => {
    let v = raw.replace(/[^\d-]/g, "");
    if (v.startsWith("-")) {
      v = `-${v.slice(1).replace(/-/g, "")}`;
    } else {
      v = v.replace(/-/g, "");
    }
    setPointForm((p) => ({ ...p, points: v }));
  };

  const handleNoteChange = (e) => {
    const note = e.target.value;
    const sel = typeof e.target.selectionStart === "number" ? e.target.selectionStart : note.length;
    setPointForm((p) => ({ ...p, note }));
    const before = note.slice(0, sel);
    const at = before.lastIndexOf("@");
    if (at === -1) {
      setMentionPicker(null);
      return;
    }
    const afterAt = before.slice(at + 1);
    if (afterAt.includes("\n")) {
      setMentionPicker(null);
      return;
    }
    setMentionPicker({ anchor: at, caret: sel, query: afterAt });
  };

  const bumpNoteField = (e) => {
    handleNoteChange(e);
    syncNoteMirrorScroll(e.currentTarget);
  };

  const pickYoungManMention = (ym) => {
    if (!mentionPicker) return;
    const { anchor, caret } = mentionPicker;
    const note = pointForm.note;
    const name = (ym.name || "").trim();
    if (!name) return;
    const next = `${note.slice(0, anchor)}@${name} ${note.slice(caret)}`;
    setPointForm((p) => ({ ...p, note: next }));
    setMentionPicker(null);
    requestAnimationFrame(() => {
      const el = noteRef.current;
      if (!el) return;
      const pos = anchor + name.length + 2;
      el.focus();
      try {
        el.setSelectionRange(pos, pos);
      } catch {
        /* ignore */
      }
      syncNoteMirrorScroll(el);
    });
  };

  const award = async () => {
    if (awarding || !awardComp?.id) return;
    const pts = parseInt(pointForm.points, 10);
    const err = {};
    if (!pointForm.wardId) err.wardId = "Select a ward.";
    if (!pointForm.note.trim()) err.note = "Note is required.";
    if (pointForm.points.trim() === "" || Number.isNaN(pts)) err.points = "Enter a whole number of points.";
    else if (pts === 0 || Math.abs(pts) > 100) err.points = "Points must be from -100 to 100, not 0.";
    if (Object.keys(err).length) {
      setPointFormErrors(err);
      return;
    }
    setPointFormErrors({});
    setAwarding(true);
    try {
      const result = await awardPointsAction({
        competitionId: awardComp.id,
        wardId: pointForm.wardId,
        points: pts,
        note: pointForm.note,
        leader: (awardLeaderName || "").trim(),
      });
      if (applyResult(result)) {
        setMentionPicker(null);
        setPointForm({ wardId: wards[0]?.id || "", points: "", note: "" });
        setModal(null);
      }
    } finally { setAwarding(false); }
  };

  const mentionMatches = useMemo(() => {
    const q = (mentionPicker?.query ?? "").trim().toLowerCase();
    if (!q) return mentionYoungMen.slice(0, 12);
    return mentionYoungMen.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 12);
  }, [mentionPicker, mentionYoungMen]);

  const bumpNoteClearingErr = (e) => {
    bumpNoteField(e);
    if (pointFormErrors.note) setPointFormErrors((prev) => { const n = { ...prev }; delete n.note; return n; });
  };

  return (
    <div>
      <PageHeader icon="trophy" title="Competitions" subtitle="Track scores, award points, view history" action={isLeader ? <button onClick={() => { setCompFormErrors({}); setModal("comp"); }} style={css.btn()}><Icon name="plus" size={16} color="#1a1612" /> New Competition</button> : null} />
      <Modal open={modal === "comp"} onClose={() => { setCompFormErrors({}); setModal(null); }} title="Create Competition">
        <Field label="Name" required error={compFormErrors.name}>
          <input style={fieldStyle(css.input, compFormErrors.name)} value={compForm.name} onChange={e => { setCompForm(p => ({ ...p, name: e.target.value })); if (compFormErrors.name) setCompFormErrors({}); }} placeholder="Competition name" />
        </Field>
        <Field label="Rules"><textarea style={{ ...css.input, minHeight: "70px", resize: "vertical" }} value={compForm.rules} onChange={e => setCompForm(p => ({ ...p, rules: e.target.value }))} /></Field>
        <Field label="Status"><select style={css.select} value={compForm.status} onChange={e => setCompForm(p => ({ ...p, status: e.target.value }))}><option value="upcoming">Upcoming</option><option value="active">Active</option><option value="completed">Completed</option></select></Field>
        <button onClick={addComp} disabled={savingComp} style={{ ...css.btn(), width: "100%", justifyContent: "center", padding: "12px", opacity: savingComp ? 0.7 : 1, cursor: savingComp ? "not-allowed" : "pointer" }}>{savingComp ? <><Spinner size={14} /> Creating…</> : "Create Competition"}</button>
      </Modal>
      <Modal open={modal === "points"} onClose={() => { setMentionPicker(null); setPointFormErrors({}); setModal(null); }} title={`Award Points — ${awardComp?.name || ""}`}>
        <Field label="Awarding as">
          <div style={{ ...css.input, display: "flex", alignItems: "center", color: T.textMuted, cursor: "default" }}>{displayAwardLeader}</div>
        </Field>
        <Field label="Ward" required error={pointFormErrors.wardId}>
          <select style={fieldStyle(css.select, pointFormErrors.wardId)} value={pointForm.wardId} onChange={e => { setPointForm(p => ({ ...p, wardId: e.target.value })); if (pointFormErrors.wardId) setPointFormErrors((prev) => { const n = { ...prev }; delete n.wardId; return n; }); }}>{wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select>
        </Field>
        <Field label="Points (negative for deductions, max ±100)" required error={pointFormErrors.points}>
          <input
            style={fieldStyle(css.input, pointFormErrors.points)}
            type="text"
            inputMode="decimal"
            enterKeyHint="done"
            autoComplete="off"
            name="competition-points"
            value={pointForm.points}
            onChange={(e) => { handlePointsInput(e.target.value); if (pointFormErrors.points) setPointFormErrors((prev) => { const n = { ...prev }; delete n.points; return n; }); }}
            placeholder="25 or -5"
          />
        </Field>
        <Field label="Note — type @ to tag a young man" required error={pointFormErrors.note}>
          <div style={{ position: "relative" }}>
            <div style={{ display: "grid", width: "100%" }}>
              <div
                aria-hidden
                style={{
                  gridArea: "1 / 1",
                  minHeight: "60px",
                  padding: "10px 14px",
                  borderRadius: T.radiusSm,
                  border: `1px solid ${pointFormErrors.note ? T.red : T.border}`,
                  boxShadow: pointFormErrors.note ? `0 0 0 1px ${T.red}55` : "none",
                  background: T.bgInput,
                  color: T.text,
                  fontSize: "14px",
                  fontFamily: T.font,
                  lineHeight: NOTE_EDITOR_LINE_HEIGHT,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflow: "hidden",
                  pointerEvents: "none",
                  zIndex: 0,
                  boxSizing: "border-box",
                  textAlign: "left",
                }}
              >
                <div ref={noteMirrorInnerRef} style={{ transform: "translate(0px, 0px)" }}>
                  {noteHighlightParts.map((part, idx) =>
                    part.kind === "mention" ? (
                      <span
                        key={idx}
                        style={{
                          background: `${T.accent}40`,
                          color: T.accentLight,
                          borderRadius: "4px",
                          padding: "0 3px",
                          boxDecorationBreak: "clone",
                          WebkitBoxDecorationBreak: "clone",
                        }}
                      >
                        {part.text}
                      </span>
                    ) : (
                      <span key={idx}>{part.text}</span>
                    ),
                  )}
                </div>
              </div>
              <textarea
                ref={noteRef}
                style={{
                  gridArea: "1 / 1",
                  minHeight: "60px",
                  padding: "10px 14px",
                  borderRadius: T.radiusSm,
                  border: `1px solid ${pointFormErrors.note ? T.red : T.border}`,
                  boxShadow: pointFormErrors.note ? `0 0 0 1px ${T.red}55` : "none",
                  background: "transparent",
                  color: "transparent",
                  caretColor: T.text,
                  fontSize: "14px",
                  fontFamily: T.font,
                  lineHeight: NOTE_EDITOR_LINE_HEIGHT,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  resize: "vertical",
                  overflow: "auto",
                  outline: "none",
                  zIndex: 1,
                  boxSizing: "border-box",
                }}
                value={pointForm.note}
                onChange={bumpNoteClearingErr}
                onKeyUp={bumpNoteClearingErr}
                onClick={bumpNoteClearingErr}
                onSelect={bumpNoteClearingErr}
                onScroll={(e) => syncNoteMirrorScroll(e.currentTarget)}
                placeholder="Won round 2, Best presentation… Type @ then a name"
              />
            </div>
            {mentionPicker && mentionMatches.length > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: "100%",
                  marginTop: "4px",
                  maxHeight: "200px",
                  overflowY: "auto",
                  background: T.bgCard,
                  border: `1px solid ${T.border}`,
                  borderRadius: T.radiusSm,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                  zIndex: 50,
                }}
              >
                {mentionMatches.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickYoungManMention(m)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 12px",
                      border: "none",
                      borderBottom: `1px solid ${T.border}`,
                      background: "transparent",
                      color: T.text,
                      fontSize: "13px",
                      cursor: "pointer",
                      fontFamily: T.font,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{m.name}</span>
                    <span style={{ color: T.textDim, fontSize: "11px", marginLeft: "8px" }}>{m.wardName}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </Field>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => { setMentionPicker(null); setModal(null); }} style={{ ...css.btn("ghost"), flex: 1, justifyContent: "center" }}>Cancel</button>
          <button
            onClick={award}
            disabled={awarding}
            style={{
              ...css.btn(),
              flex: 1,
              justifyContent: "center",
              padding: "12px",
              cursor: awarding ? "not-allowed" : "pointer",
              opacity:
                awarding ||
                !pointForm.points ||
                !pointForm.note.trim() ||
                Number.isNaN(parseInt(pointForm.points, 10)) ||
                parseInt(pointForm.points, 10) === 0
                  ? 0.5
                  : 1,
            }}
          >
            {awarding ? <><Spinner size={14} /> Awarding…</> : "Award Points"}
          </button>
        </div>
      </Modal>

      {/* Leaderboard */}
      <div style={{ ...css.card, marginBottom: "24px", borderTop: `3px solid ${T.yellow}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <h3 style={{ fontFamily: T.fontDisplay, fontSize: "18px", color: T.text, margin: 0 }}>🏆 Overall Leaderboard</h3>
          <span style={{ fontSize: "12px", color: T.textDim }}>{pointLog.length} point entries</span>
        </div>
        {leaderboard.map((entry, i) => { const maxPts = Math.max(leaderboard[0]?.pts || 1, 1); const wardColor = entry.ward.color || T.accent; return (
          <div key={entry.ward.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "10px 14px", borderRadius: T.radiusSm, background: i === 0 ? T.yellowBg : T.bg, marginBottom: "6px" }}>
            <span style={{ fontSize: "20px", fontWeight: 800, color: i === 0 ? T.yellow : T.textDim, fontFamily: T.fontDisplay, minWidth: "30px" }}>#{i + 1}</span>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: wardColor }} />
            <span style={{ fontWeight: 600, color: T.text, minWidth: "100px" }}>{entry.ward.name}</span>
            <div style={{ flex: 1, height: "8px", borderRadius: "4px", background: T.border, overflow: "hidden" }}><div style={{ height: "100%", borderRadius: "4px", background: wardColor, width: `${Math.max(0, (entry.pts / maxPts) * 100)}%`, transition: "width 0.5s ease" }} /></div>
            <span style={{ fontWeight: 700, color: T.accent, minWidth: "55px", textAlign: "right", fontFamily: "monospace" }}>{entry.pts} pts</span>
          </div>
        ); })}
      </div>

      {/* Competitions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {competitions.map(c => {
          const isExp = expanded === c.id;
          const isComplete = c.status === "completed";
          const logs = pointLog.filter(p => p.compId === c.id);
          const ct = {}; wards.forEach(w => { ct[w.id] = 0; }); logs.forEach(l => { ct[l.wardId] = (ct[l.wardId] || 0) + l.points; });
          return (
            <div
              key={c.id}
              style={{
                ...css.card,
                padding: 0,
                overflow: "hidden",
                opacity: isComplete ? 0.72 : 1,
                background: isComplete ? "#1c1916" : T.bgCard,
                border: `1px solid ${isComplete ? "#2f2a24" : T.border}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px 20px", cursor: "pointer", flexWrap: "wrap" }} onClick={() => setExpanded(isExp ? null : c.id)}>
                <div style={{ transform: isExp ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><Icon name="chevRight" size={18} color={T.textDim} /></div>
                <h4 style={{ color: isComplete ? T.textMuted : T.text, margin: 0, flex: "1 1 140px", fontSize: "16px" }}>{c.name}</h4>
                <StatusBadge status={c.status} />
                {canCompleteCompetition && !isComplete ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      markComplete(c.id);
                    }}
                    disabled={completingId === c.id}
                    style={{
                      ...css.btn("ghost"),
                      padding: "6px 12px",
                      fontSize: "12px",
                      opacity: completingId === c.id ? 0.6 : 1,
                      cursor: completingId === c.id ? "wait" : "pointer",
                    }}
                  >
                    {completingId === c.id ? <Spinner size={14} color={T.textMuted} /> : <Icon name="check" size={14} color={T.textMuted} />}
                    {completingId === c.id ? "Saving…" : "Mark complete"}
                  </button>
                ) : null}
                {isLeader ? (
                  <button
                    type="button"
                    disabled={isComplete}
                    title={isComplete ? "This competition is completed." : undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isComplete) openAward(c);
                    }}
                    style={{
                      ...css.btn(),
                      padding: "6px 12px",
                      fontSize: "12px",
                      opacity: isComplete ? 0.45 : 1,
                      cursor: isComplete ? "not-allowed" : "pointer",
                      pointerEvents: isComplete ? "none" : "auto",
                    }}
                  >
                    <Icon name="plus" size={14} color={isComplete ? T.textDim : "#1a1612"} /> Award
                  </button>
                ) : null}
                {isLeader && <button type="button" disabled={!!deletingCompId} onClick={(e) => { e.stopPropagation(); delComp(c.id); }} style={{ background: "none", border: "none", cursor: deletingCompId ? "not-allowed" : "pointer", opacity: 0.4 }}>{deletingCompId === c.id ? <Spinner size={14} color={T.red} /> : <Icon name="trash" size={14} color={T.red} />}</button>}
              </div>
              {isExp && <div style={{ borderTop: `1px solid ${T.border}` }}>
                <div style={{ padding: "16px 20px", background: "rgba(255,255,255,0.01)" }}><p style={{ fontSize: "13px", color: T.textMuted, margin: 0 }}><strong style={{ color: T.text }}>Rules:</strong> {c.rules}</p></div>
                <div style={{ padding: "12px 20px", borderTop: `1px solid ${T.border}`, display: "flex", gap: "10px", flexWrap: "wrap" }}>{wards.map(w => { const wc = w.color || T.accent; return <div key={w.id} style={{ ...css.badge(wc + "22", wc), fontSize: "12px", padding: "5px 12px" }}>{w.name}: {ct[w.id] || 0} pts</div>; })}</div>
                <div style={{ borderTop: `1px solid ${T.border}` }}>
                  <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: "8px" }}><Icon name="clock" size={14} color={T.textDim} /><span style={{ fontSize: "12px", fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Point History ({logs.length})</span></div>
                  {!logs.length ? <div style={{ padding: "20px", textAlign: "center", color: T.textDim, fontSize: "13px" }}>No points awarded yet.</div> : (
                    <div style={{ maxHeight: "300px", overflowY: "auto" }}>{[...logs].reverse().map(l => {
                      const ward = wards.find(w => w.id === l.wardId); const isNeg = l.points < 0; const wc = ward?.color || T.textDim;
                      return (<div key={l.id} style={{ display: "flex", gap: "14px", padding: "10px 20px", borderTop: `1px solid ${T.border}`, alignItems: "flex-start" }}>
                        <div style={{ minWidth: "50px", textAlign: "right" }}><span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "15px", color: isNeg ? T.red : T.green }}>{isNeg ? "" : "+"}{l.points}</span></div>
                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: wc, marginTop: "5px", flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}><span style={{ fontWeight: 600, color: T.text, fontSize: "13px" }}>{ward?.name || "?"}</span>{isNeg && <Badge bg={T.redBg} text={T.red}>deduction</Badge>}</div>
                          <p style={{ fontSize: "13px", color: T.textMuted, margin: "0 0 4px", lineHeight: 1.4 }}>{l.note}</p>
                          <div style={{ fontSize: "11px", color: T.textDim }}>by <strong style={{ color: T.textMuted }}>{l.leader}</strong> · {l.timestamp}</div>
                        </div>
                      </div>);
                    })}</div>
                  )}
                </div>
              </div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const WardRostersPage = ({ wards, leaders }) => {
  const leadersByWard = useMemo(() => {
    const map = {};
    (leaders || []).forEach(l => {
      if (l.ward_id && l.status === "active") {
        if (!map[l.ward_id]) map[l.ward_id] = [];
        map[l.ward_id].push(l);
      }
    });
    return map;
  }, [leaders]);

  const totalYoungMen = wards.reduce((sum, w) => sum + w.campers.length, 0);
  const totalLeaders = Object.values(leadersByWard).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div>
      <PageHeader icon="users" title="Ward Rosters" subtitle={`${wards.length} wards · ${totalLeaders} leaders · ${totalYoungMen} young men`} />
      {!wards.length ? (
        <EmptyState icon="users" message="No wards have been created yet." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {wards.map(ward => {
            const wardColor = ward.color || T.accent;
            const wardLeaders = leadersByWard[ward.id] || [];
            const memberCount = wardLeaders.length + ward.campers.length;
            return (
              <div key={ward.id} style={{ ...css.card, padding: 0, borderLeft: `3px solid ${wardColor}` }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: wardColor, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: T.fontDisplay, fontSize: "17px", color: T.text, margin: 0 }}>{ward.name}</h3>
                  </div>
                  <Badge bg={`${wardColor}22`} text={wardColor}>{memberCount} {memberCount === 1 ? "member" : "members"}</Badge>
                </div>
                {wardLeaders.length > 0 && (
                  <div style={{ padding: "10px 20px", borderBottom: `1px solid ${T.border}`, background: "rgba(255,255,255,0.015)" }}>
                    <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", color: T.textDim, fontWeight: 600, margin: "0 0 6px" }}>Leaders ({wardLeaders.length})</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {wardLeaders.map(l => (
                        <div key={l.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 0" }}>
                          <Avatar name={l.name} src={l.avatar_url || null} size={28} fontSize={11} />
                          <span style={{ color: T.text, fontSize: "13px", fontWeight: 600 }}>{l.name}</span>
                          {l.role_label && <span style={{ color: T.textMuted, fontSize: "12px" }}>{l.role_label}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {ward.campers.length > 0 ? (
                  <div style={{ padding: "0" }}>
                    <div style={{ padding: "10px 20px 4px" }}>
                      <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", color: T.textDim, fontWeight: 600, margin: 0 }}>Young Men ({ward.campers.length})</p>
                    </div>
                    {ward.campers.map((camper, ci) => (
                      <div key={camper.id} style={{ padding: "6px 20px", display: "flex", alignItems: "center", gap: "10px", borderBottom: ci < ward.campers.length - 1 ? `1px solid ${T.border}22` : "none" }}>
                        <Avatar name={camper.name} src={camper.photo_url || null} size={28} fontSize={11} />
                        <span style={{ color: T.text, fontSize: "13px" }}>{camper.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ padding: "16px 20px", color: T.textDim, fontSize: "13px" }}>No young men registered yet.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const INVITE_STATUS_COLORS = {
  not_invited_yet: { bg: T.yellowBg, text: T.yellow, label: "Not Invited" },
  not_sent: { bg: T.yellowBg, text: T.yellow, label: "Not Sent" },
  pending: { bg: T.blueBg, text: T.blue, label: "Pending" },
  sent: { bg: T.blueBg, text: T.blue, label: "Sent" },
  active: { bg: T.greenBg, text: T.green, label: "Active" },
  accepted: { bg: T.greenBg, text: T.green, label: "Accepted" },
};

const RegistrationPage = ({ registrations, applyResult, isLeader }) => {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ parentName: "", parentEmail: "" });
  const [formErrors, setFormErrors] = useState({});
  const [expanded, setExpanded] = useState({});
  const [sending, setSending] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const validateInviteParent = () => {
    const e = {};
    if (!form.parentName.trim()) e.parentName = "Name is required.";
    else if (!hasFirstAndLastName(form.parentName)) e.parentName = "Enter first and last name.";
    if (!form.parentEmail.trim()) e.parentEmail = "Email is required.";
    else if (!isValidEmailLoose(form.parentEmail)) e.parentEmail = "Enter a valid email address.";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const addParent = async () => {
    if (saving || !validateInviteParent()) return;
    setSaving(true);
    try {
      const result = await addParentAction({
        parentName: form.parentName,
        parentEmail: form.parentEmail,
      });
      if (applyResult(result)) {
        setForm({ parentName: "", parentEmail: "" });
        setFormErrors({});
        setModal(false);
      }
    } finally { setSaving(false); }
  };

  const sendInvite = async (parentId) => {
    setSending(p => ({ ...p, [parentId]: true }));
    const result = await sendParentInviteAction(parentId);
    applyResult(result);
    setSending(p => ({ ...p, [parentId]: false }));
  };

  const del = (parentId, parentName) => {
    setDeleteConfirm({ id: parentId, name: parentName });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const result = await deleteParentAction(deleteConfirm.id);
    applyResult(result);
    setDeleteConfirm(null);
  };

  const toggleExpand = (id) => {
    setExpanded(p => ({ ...p, [id]: !p[id] }));
  };

  const totalYoungMen = registrations.reduce((s, r) => s + r.youngMen.length, 0);

  return (
    <div>
      <PageHeader
        icon="clipboard"
        title="Registration"
        subtitle={`${registrations.length} parents · ${totalYoungMen} young men`}
        action={isLeader ? <button type="button" onClick={() => { setFormErrors({}); setModal(true); }} style={css.btn()}><Icon name="plus" size={16} color="#1a1612" /> Invite Parent</button> : null}
      />
      <Modal open={modal} onClose={() => { setFormErrors({}); setModal(false); }} title="Invite a Parent" width={480}>
        <Field label="Parent's Full Name" required error={formErrors.parentName}>
          <input style={fieldStyle(css.input, formErrors.parentName)} value={form.parentName} onChange={e => { setForm(p => ({ ...p, parentName: e.target.value })); if (formErrors.parentName) setFormErrors((prev) => { const n = { ...prev }; delete n.parentName; return n; }); }} placeholder="John Smith" />
        </Field>
        <Field label="Parent's Email" required error={formErrors.parentEmail}>
          <input style={fieldStyle(css.input, formErrors.parentEmail)} type="email" autoComplete="email" value={form.parentEmail} onChange={e => { setForm(p => ({ ...p, parentEmail: e.target.value })); if (formErrors.parentEmail) setFormErrors((prev) => { const n = { ...prev }; delete n.parentEmail; return n; }); }} placeholder="parent@email.com" />
        </Field>
        <button onClick={addParent} disabled={saving} style={{ ...css.btn(), width: "100%", justifyContent: "center", padding: "12px", opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}>{saving ? <><Spinner size={14} /> Adding…</> : "Add Parent"}</button>
      </Modal>
      <ConfirmDeleteModal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title={`Delete ${deleteConfirm?.name || "this parent"}?`}
        message="This will permanently delete this parent's account, their linked young men, and all related data. This action cannot be undone."
      />
      {!registrations.length ? (
        <EmptyState icon="clipboard" message="No parents have been invited yet. Click 'Invite Parent' to get started." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {registrations.map(reg => {
            const isExpanded = expanded[reg.id];
            const regStatusColor = INVITE_STATUS_COLORS[reg.registrationStatus] || {};
            const invStatusColor = INVITE_STATUS_COLORS[reg.inviteStatus] || {};
            const canSend = reg.inviteStatus === "not_sent" || reg.inviteStatus === "sent";
            return (
              <div key={reg.id} style={{ ...css.card, padding: 0 }}>
                <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px", cursor: reg.youngMen.length > 0 ? "pointer" : "default" }} onClick={() => reg.youngMen.length > 0 && toggleExpand(reg.id)}>
                  <Avatar name={reg.parentName} src={reg.parentAvatarUrl || null} size={40} fontSize={14} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, color: T.text, fontSize: "14px" }}>{reg.parentName}</span>
                      <span style={{ color: T.textDim, fontSize: "12px" }}>{reg.email}</span>
                      {reg.wardName && <span style={{ color: T.textMuted, fontSize: "11px" }}>· {reg.wardName}</span>}
                    </div>
                    {reg.youngMen.length > 0 && (
                      <div style={{ display: "flex", gap: "4px", marginTop: "4px", flexWrap: "wrap" }}>
                        {reg.youngMen.map(ym => (
                          <span key={ym.id} style={{ fontSize: "11px", color: T.accent, background: `${T.accent}15`, padding: "2px 8px", borderRadius: "10px" }}>{ym.name} ({ym.age})</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    <Badge bg={regStatusColor.bg} text={regStatusColor.text}>{regStatusColor.label}</Badge>
                    {isLeader && canSend && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); sendInvite(reg.id); }}
                        disabled={sending[reg.id]}
                        style={{ ...css.btn(), fontSize: "11px", padding: "5px 12px", opacity: sending[reg.id] ? 0.5 : 1 }}
                      >
                        {sending[reg.id] ? <><Spinner size={12} /> Sending…</> : reg.inviteStatus === "sent" ? "Resend" : "Send Invite"}
                      </button>
                    )}
                    {isLeader && (
                      <button type="button" onClick={(e) => { e.stopPropagation(); del(reg.id, reg.parentName); }} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.4, padding: "4px" }}><Icon name="trash" size={14} color={T.red} /></button>
                    )}
                    {reg.youngMen.length > 0 && <Icon name="chevRight" size={16} color={T.textDim} />}
                  </div>
                </div>
                {isExpanded && reg.youngMen.length > 0 && (
                  <div style={{ borderTop: `1px solid ${T.border}`, padding: "4px 0" }}>
                    {reg.youngMen.map((ym, yi) => (
                      <div key={ym.id} style={{ padding: "10px 18px 10px 36px", borderBottom: yi < reg.youngMen.length - 1 ? `1px solid ${T.border}22` : "none", display: "flex", alignItems: "center", gap: "12px" }}>
                        <Avatar name={ym.name} src={ym.photoUrl || null} size={28} fontSize={11} />
                        <div style={{ flex: 1 }}>
                          <span style={{ color: T.text, fontSize: "13px", fontWeight: 600 }}>{ym.name}</span>
                          <span style={{ color: T.textMuted, fontSize: "12px", marginLeft: "8px" }}>Age {ym.age}</span>
                        </div>
                        {ym.shirtSize && <span style={{ color: T.textMuted, fontSize: "11px" }}>Shirt: {ym.shirtSize}</span>}
                        {ym.allergies && <span style={{ color: T.yellow, fontSize: "11px" }}>Allergies: {ym.allergies}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ContactsPage = ({ contacts, applyResult, isLeader }) => {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", phone: "", email: "", emergency: false });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const busy = saving || !!deletingId;
  const validateContact = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.phone.trim()) e.phone = "Phone is required.";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };
  const add = async () => {
    if (saving || !validateContact()) return;
    setSaving(true);
    try {
      const result = await addContactAction(form);
      if (applyResult(result)) {
        setForm({ name: "", role: "", phone: "", email: "", emergency: false });
        setFormErrors({});
        setModal(false);
      }
    } finally { setSaving(false); }
  };
  const del = async (id) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const result = await deleteContactAction(id);
      applyResult(result);
    } finally { setDeletingId(null); }
  };
  const staff = contacts.filter(c => !c.emergency); const emergency = contacts.filter(c => c.emergency);
  return (
    <div>
      <PageHeader icon="phone" title="Contacts" subtitle="Camp staff & emergency" action={isLeader ? <button onClick={() => { setFormErrors({}); setModal(true); }} style={css.btn()}><Icon name="plus" size={16} color="#1a1612" /> Add</button> : null} />
      <Modal open={modal} onClose={() => { setFormErrors({}); setModal(false); }} title="Add Contact">
        <Field label="Name" required error={formErrors.name}>
          <input style={fieldStyle(css.input, formErrors.name)} value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); if (formErrors.name) setFormErrors((prev) => { const n = { ...prev }; delete n.name; return n; }); }} />
        </Field>
        <Field label="Role"><input style={css.input} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} placeholder="Optional" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Field label="Phone" required error={formErrors.phone}>
            <input style={fieldStyle(css.input, formErrors.phone)} type="tel" value={form.phone} onChange={e => { setForm(p => ({ ...p, phone: e.target.value })); if (formErrors.phone) setFormErrors((prev) => { const n = { ...prev }; delete n.phone; return n; }); }} />
          </Field>
          <Field label="Email"><input style={css.input} type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="Optional" /></Field>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "8px 0" }}><input type="checkbox" checked={form.emergency} onChange={e => setForm(p => ({ ...p, emergency: e.target.checked }))} style={{ width: "18px", height: "18px", accentColor: T.accent }} /><span style={{ fontSize: "14px", color: T.text }}>Emergency contact</span></label>
        <button onClick={add} disabled={saving} style={{ ...css.btn(), width: "100%", justifyContent: "center", padding: "12px", marginTop: "8px", opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}>{saving ? <><Spinner size={14} /> Adding…</> : "Add Contact"}</button>
      </Modal>
      <h3 style={{ fontFamily: T.fontDisplay, fontSize: "17px", color: T.text, margin: "0 0 14px" }}>Camp Staff</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px", marginBottom: "32px" }}>{staff.map(c => (<div key={c.id} style={{ ...css.card, position: "relative" }}>{isLeader && <button disabled={busy} onClick={() => del(c.id)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: busy ? "not-allowed" : "pointer", opacity: 0.3 }}>{deletingId === c.id ? <Spinner size={14} color={T.red} /> : <Icon name="trash" size={14} color={T.red} />}</button>}<div style={{ fontWeight: 600, color: T.text, fontSize: "15px", marginBottom: "4px" }}>{c.name}</div><div style={{ color: T.textMuted, fontSize: "13px", marginBottom: "10px" }}>{c.role}</div><div style={{ fontSize: "13px", color: T.accent }}>{c.phone}</div>{c.email && <div style={{ fontSize: "12px", color: T.textDim }}>{c.email}</div>}</div>))}</div>
      <h3 style={{ fontFamily: T.fontDisplay, fontSize: "17px", color: T.text, margin: "0 0 14px", display: "flex", alignItems: "center", gap: "8px" }}><span style={{ color: T.red }}>⚠</span> Emergency Contacts</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>{emergency.map(c => (<div key={c.id} style={{ ...css.card, borderLeft: `3px solid ${T.red}`, position: "relative" }}>{isLeader && <button disabled={busy} onClick={() => del(c.id)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: busy ? "not-allowed" : "pointer", opacity: 0.3 }}>{deletingId === c.id ? <Spinner size={14} color={T.red} /> : <Icon name="trash" size={14} color={T.red} />}</button>}<div style={{ fontWeight: 600, color: T.text, fontSize: "15px", marginBottom: "4px" }}>{c.name}</div><div style={{ color: T.textMuted, fontSize: "13px", marginBottom: "8px" }}>{c.role}</div><div style={{ fontSize: "15px", color: T.red, fontWeight: 700, fontFamily: "monospace" }}>{c.phone}</div></div>))}</div>
    </div>
  );
};

const RulesPage = ({ rules, applyResult, isLeader }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const items = rules;
  const startEdit = () => { setDraft(items.map((r, i) => `${i + 1}. ${r}`).join("\n")); setEditing(true); };
  const cancelEdit = () => { setEditing(false); };
  const saveRules = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const result = await saveCampRulesAction(draft);
      if (applyResult(result)) { setEditing(false); }
    } finally { setSaving(false); }
  };
  return (
    <div>
      <PageHeader icon="shield" title="Camp Rules" subtitle="Official camp guidelines"
        action={isLeader ? (editing
          ? <div style={{ display: "flex", gap: "8px" }}><button onClick={cancelEdit} disabled={saving} style={{ ...css.btn("ghost"), opacity: saving ? 0.5 : 1 }}>Cancel</button><button onClick={saveRules} disabled={saving} style={{ ...css.btn(), opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}>{saving ? <><Spinner size={14} /> Saving…</> : "Save Rules"}</button></div>
          : <button onClick={startEdit} style={css.btn()}><Icon name="edit" size={16} color="#1a1612" /> Edit</button>
        ) : null}
      />
      {editing ? (
        <div style={css.card}>
          <textarea
            style={{ ...css.input, minHeight: "300px", resize: "vertical", fontFamily: "monospace", fontSize: "13px", lineHeight: 1.8 }}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={"1. Be respectful\n2. Follow instructions\n3. Have fun"}
          />
          <p style={{ fontSize: "12px", color: T.textDim, marginTop: "8px" }}>One rule per line. Numbering is optional.</p>
        </div>
      ) : (
        <div style={css.card}>
          {items.length ? items.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: "16px", padding: "14px 0", borderBottom: i < items.length - 1 ? `1px solid ${T.border}` : "none", alignItems: "flex-start" }}>
              <span style={{ minWidth: "28px", height: "28px", borderRadius: "50%", background: i === items.length - 1 ? T.accentDim + "33" : T.bgInput, color: i === items.length - 1 ? T.accent : T.textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>{i + 1}</span>
              <span style={{ color: T.text, fontSize: "14px", lineHeight: 1.6, fontWeight: i === items.length - 1 ? 600 : 400, fontStyle: i === items.length - 1 ? "italic" : "normal" }}>{r}</span>
            </div>
          )) : <EmptyState icon="shield" message="No camp rules yet." />}
        </div>
      )}
    </div>
  );
};

const InspirationPage = ({ inspiration }) => {
  const messages = inspiration;
  return (<div><PageHeader icon="sun" title="Daily Inspiration" subtitle="A message for each day" /><div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>{messages.map((m, i) => (<div key={i} style={{ ...css.card, borderLeft: `4px solid ${T.accent}`, background: `linear-gradient(135deg, ${T.bgCard} 0%, #2e2518 100%)` }}><div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}><Badge bg={T.accentDim + "33"} text={T.accent}>Day {i + 1}</Badge><span style={{ fontSize: "12px", color: T.textDim }}>{CAMP_DAYS[i] ?? `Day ${i + 1}`}</span></div><h3 style={{ fontFamily: T.fontDisplay, fontSize: "22px", color: T.accentLight, margin: "0 0 12px" }}>{m.title}</h3><p style={{ color: T.text, fontSize: "15px", lineHeight: 1.7, fontStyle: "italic", margin: 0 }}>&quot;{m.verse}&quot;</p><p style={{ color: T.textMuted, fontSize: "13px", marginTop: "8px" }}>— {m.ref}</p></div>))}</div></div>);
};

const LeadersPage = ({ leaders, wards, callingOptions, applyResult, isLeader }) => {
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editLeader, setEditLeader] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editForm, setEditForm] = useState({ displayName: "", role: "", wardId: "", calling: "", newCalling: "" });
  const [editAddingCalling, setEditAddingCalling] = useState(false);
  const [addingCalling, setAddingCalling] = useState(false);
  const [resendingLeaderId, setResendingLeaderId] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    role: "ward_leader",
    wardId: "",
    calling: "",
    newCalling: "",
  });

  const inviteRoleOptions = [
    { value: "stake_leader", label: "Stake Leader", wardRequired: false },
    { value: "stake_camp_director", label: "Stake Camp Director", wardRequired: false },
    { value: "camp_committee", label: "Camp Committee", wardRequired: false },
    { value: "ward_leader", label: "Ward Leader", wardRequired: true },
  ];
  const editRoleOptions = useMemo(() => {
    if (
      editForm.role === "young_men_captain" &&
      !inviteRoleOptions.some((o) => o.value === editForm.role)
    ) {
      return [
        ...inviteRoleOptions,
        {
          value: "young_men_captain",
          label: "Young Men Captain (legacy — assign camp staff role)",
          wardRequired: true,
        },
      ];
    }
    return inviteRoleOptions;
  }, [editForm.role]);
  const selectedRoleOption =
    inviteRoleOptions.find((option) => option.value === form.role) ?? inviteRoleOptions[0];

  const [saving, setSaving] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [inviteErrors, setInviteErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});

  const submitInvite = async () => {
    const callingValue = addingCalling ? form.newCalling : form.calling;
    if (saving) return;
    const e = {};
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!isValidEmailLoose(form.email)) e.email = "Enter a valid email address.";
    if (!callingValue.trim()) e.calling = addingCalling ? "Enter a calling." : "Select a calling.";
    if (selectedRoleOption.wardRequired && !form.wardId) e.wardId = "Select a ward for this role.";
    if (Object.keys(e).length) {
      setInviteErrors(e);
      return;
    }
    setInviteErrors({});
    setSaving(true);
    try {
      const result = await inviteLeaderAction({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        role: form.role,
        wardId: form.wardId || null,
        calling: callingValue.trim(),
      });
      if (applyResult(result)) {
        setForm({
          fullName: "",
          email: "",
          role: "ward_leader",
          wardId: "",
          calling: "",
          newCalling: "",
        });
        setAddingCalling(false);
        setModal(false);
      }
    } finally { setSaving(false); }
  };

  const removeInvite = (invitationId, leaderName) => {
    setDeleteConfirm({ id: invitationId, name: leaderName });
  };

  const confirmRemoveInvite = async () => {
    if (!deleteConfirm) return;
    const result = await deleteLeaderInvitationAction(deleteConfirm.id);
    applyResult(result);
    setDeleteConfirm(null);
  };

  const openEdit = (leader) => {
    setEditLeader(leader);
    setEditForm({
      displayName: leader.name || "",
      role: leader.role || "ward_leader",
      wardId: leader.ward_id || "",
      calling: leader.calling || "",
      newCalling: "",
    });
    setEditAddingCalling(false);
    setEditErrors({});
    setEditModal(true);
  };

  const submitEdit = async () => {
    if (editSaving || !editLeader) return;
    const callingValue = editAddingCalling ? editForm.newCalling : editForm.calling;
    const editRoleOption = editRoleOptions.find((o) => o.value === editForm.role) ?? editRoleOptions[0];
    const e = {};
    if (!callingValue.trim()) e.calling = editAddingCalling ? "Enter a calling." : "Select a calling.";
    if (editRoleOption?.wardRequired && !editForm.wardId) e.wardId = "Select a ward for this role.";
    if (Object.keys(e).length) {
      setEditErrors(e);
      return;
    }
    setEditErrors({});
    setEditSaving(true);
    try {
      const result = await updateLeaderAction(editLeader.invitation_id ?? editLeader.id, {
        displayName: editForm.displayName.trim() || undefined,
        role: editForm.role,
        wardId: editRoleOption.wardRequired ? editForm.wardId || null : null,
        calling: callingValue.trim() || undefined,
      });
      if (applyResult(result)) {
        setEditModal(false);
        setEditLeader(null);
      }
    } finally { setEditSaving(false); }
  };

  const editRoleOption = editModal ? (editRoleOptions.find((o) => o.value === editForm.role) ?? editRoleOptions[0]) : null;

  const sendOrResendInvite = async (leader) => {
    if (!leader?.email || !leader?.calling || leader.status === "active") {
      return;
    }
    if (leader.role === "young_men_captain") {
      window.alert(
        "Young Men Captain is a camper role, not camp staff. Use Edit to assign a staff role (e.g. Ward Leader) before sending an invite.",
      );
      return;
    }

    setResendingLeaderId(leader.id);
    const result = await inviteLeaderAction({
      email: leader.email.trim(),
      role: leader.role,
      wardId: leader.ward_id ?? null,
      calling: leader.calling.trim(),
    });
    setResendingLeaderId(null);
    applyResult(result);
  };

  return (
    <div>
      <PageHeader
        icon="star"
        title="Leaders"
        subtitle="Manage stake and ward leadership invitations, statuses, and roles"
        action={isLeader ? <button type="button" onClick={() => { setInviteErrors({}); setModal(true); }} style={css.btn()}><Icon name="plus" size={16} color="#1a1612" /> Invite Leader</button> : null}
      />
      <Modal open={modal} onClose={() => { setInviteErrors({}); setModal(false); }} title="Invite Leader" width={560}>
        <Field label="Full Name" hint="Optional — used in the invite email">
          <input style={css.input} value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} placeholder="John Doe" />
        </Field>
        <Field label="Email" required error={inviteErrors.email}>
          <input style={fieldStyle(css.input, inviteErrors.email)} type="email" autoComplete="email" value={form.email} onChange={e => { setForm(p => ({ ...p, email: e.target.value })); if (inviteErrors.email) setInviteErrors((prev) => { const n = { ...prev }; delete n.email; return n; }); }} placeholder="leader@email.com" />
        </Field>
        <Field label="Leadership Role"><select style={css.select} value={form.role} onChange={e => { setForm(p => ({ ...p, role: e.target.value })); if (inviteErrors.wardId) setInviteErrors((prev) => { const n = { ...prev }; delete n.wardId; return n; }); }}>{inviteRoleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
        <Field label="Ward" required={selectedRoleOption.wardRequired} error={inviteErrors.wardId}>
          <select style={fieldStyle(css.select, inviteErrors.wardId)} value={form.wardId} onChange={e => { setForm(p => ({ ...p, wardId: e.target.value })); if (inviteErrors.wardId) setInviteErrors((prev) => { const n = { ...prev }; delete n.wardId; return n; }); }}>
            <option value="">{selectedRoleOption.wardRequired ? "Select ward" : "Stake-wide (no ward)"}</option>
            {wards.map((ward) => (
              <option key={ward.id} value={ward.id}>{ward.name}</option>
            ))}
          </select>
        </Field>
        {!addingCalling ? (
          <Field label="Calling" required error={inviteErrors.calling}>
            <div style={{ display: "flex", gap: "8px" }}>
              <select style={{ ...fieldStyle(css.select, inviteErrors.calling), flex: 1 }} value={form.calling} onChange={e => { setForm(p => ({ ...p, calling: e.target.value })); if (inviteErrors.calling) setInviteErrors((prev) => { const n = { ...prev }; delete n.calling; return n; }); }}>
                <option value="">Select a calling</option>
                {callingOptions.map((calling) => (
                  <option key={calling} value={calling}>{calling}</option>
                ))}
              </select>
              <button type="button" onClick={() => { setAddingCalling(true); if (inviteErrors.calling) setInviteErrors((prev) => { const n = { ...prev }; delete n.calling; return n; }); }} style={css.btn("ghost")}>New</button>
            </div>
          </Field>
        ) : (
          <Field label="New Calling" required error={inviteErrors.calling}>
            <div style={{ display: "flex", gap: "8px" }}>
              <input style={{ ...fieldStyle(css.input, inviteErrors.calling), flex: 1 }} value={form.newCalling} onChange={e => { setForm(p => ({ ...p, newCalling: e.target.value })); if (inviteErrors.calling) setInviteErrors((prev) => { const n = { ...prev }; delete n.calling; return n; }); }} placeholder="Assistant Camp Director" />
              <button type="button" onClick={() => setAddingCalling(false)} style={css.btn("ghost")}>Use List</button>
            </div>
          </Field>
        )}
        <button onClick={submitInvite} disabled={saving} style={{ ...css.btn(), width: "100%", justifyContent: "center", padding: "12px", opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}>{saving ? <><Spinner size={14} /> Sending…</> : "Send Invitation"}</button>
      </Modal>

      <Modal open={editModal} onClose={() => { setEditErrors({}); setEditModal(false); }} title="Edit Leader" width={560}>
        <Field label="Full Name"><input style={css.input} value={editForm.displayName} onChange={e => setEditForm(p => ({ ...p, displayName: e.target.value }))} placeholder="Full name" /></Field>
        <Field label="Leadership Role"><select style={css.select} value={editForm.role} onChange={e => { setEditForm(p => ({ ...p, role: e.target.value })); if (editErrors.wardId) setEditErrors((prev) => { const n = { ...prev }; delete n.wardId; return n; }); }}>{editRoleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
        <Field label="Ward" required={editRoleOption?.wardRequired} error={editErrors.wardId}>
          <select style={fieldStyle(css.select, editErrors.wardId)} value={editForm.wardId} onChange={e => { setEditForm(p => ({ ...p, wardId: e.target.value })); if (editErrors.wardId) setEditErrors((prev) => { const n = { ...prev }; delete n.wardId; return n; }); }}>
            <option value="">{editRoleOption?.wardRequired ? "Select ward" : "Stake-wide (no ward)"}</option>
            {wards.map((ward) => (
              <option key={ward.id} value={ward.id}>{ward.name}</option>
            ))}
          </select>
        </Field>
        {!editAddingCalling ? (
          <Field label="Calling" required error={editErrors.calling}>
            <div style={{ display: "flex", gap: "8px" }}>
              <select style={{ ...fieldStyle(css.select, editErrors.calling), flex: 1 }} value={editForm.calling} onChange={e => { setEditForm(p => ({ ...p, calling: e.target.value })); if (editErrors.calling) setEditErrors((prev) => { const n = { ...prev }; delete n.calling; return n; }); }}>
                <option value="">Select a calling</option>
                {callingOptions.map((calling) => (
                  <option key={calling} value={calling}>{calling}</option>
                ))}
              </select>
              <button type="button" onClick={() => { setEditAddingCalling(true); if (editErrors.calling) setEditErrors((prev) => { const n = { ...prev }; delete n.calling; return n; }); }} style={css.btn("ghost")}>New</button>
            </div>
          </Field>
        ) : (
          <Field label="New Calling" required error={editErrors.calling}>
            <div style={{ display: "flex", gap: "8px" }}>
              <input style={{ ...fieldStyle(css.input, editErrors.calling), flex: 1 }} value={editForm.newCalling} onChange={e => { setEditForm(p => ({ ...p, newCalling: e.target.value })); if (editErrors.calling) setEditErrors((prev) => { const n = { ...prev }; delete n.calling; return n; }); }} placeholder="Assistant Camp Director" />
              <button type="button" onClick={() => setEditAddingCalling(false)} style={css.btn("ghost")}>Use List</button>
            </div>
          </Field>
        )}
        <button onClick={submitEdit} disabled={editSaving} style={{ ...css.btn(), width: "100%", justifyContent: "center", padding: "12px", opacity: editSaving ? 0.7 : 1, cursor: editSaving ? "not-allowed" : "pointer" }}>{editSaving ? <><Spinner size={14} /> Saving…</> : "Save Changes"}</button>
      </Modal>
      <ConfirmDeleteModal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmRemoveInvite}
        title={`Delete ${deleteConfirm?.name || "this leader"}?`}
        message="This will permanently delete this leader's account and roles. They will need a new invite to sign in again. This action cannot be undone."
      />

      {!leaders.length ? (
        <EmptyState icon="star" message="No leadership invitations yet." />
      ) : (
        <div style={{ ...css.card, padding: 0, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: isLeader ? "1120px" : "720px" }}>
            <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>{["Leader", "Role", "Ward", "Calling", ...(isLeader ? ["Invite", "Status", "Actions"] : ["Status"])].map(h => <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: T.textMuted, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{h}</th>)}</tr></thead>
            <tbody>{leaders.map((leader, index) => (
              <tr key={leader.id} style={{ borderBottom: `1px solid ${T.border}`, background: index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                <td style={{ padding: "11px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Avatar name={leader.name || leader.email} src={leader.avatar_url || null} size={30} />
                    <div>
                      <div style={{ color: T.text, fontWeight: 600 }}>{leader.name || "Pending User"}</div>
                      <div style={{ color: T.textDim, fontSize: "11px" }}>{leader.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "11px 14px", color: T.textMuted }}>{leader.role_label || leader.role}</td>
                <td style={{ padding: "11px 14px", color: T.textMuted }}>{leader.ward_name || "Stake-wide"}</td>
                <td style={{ padding: "11px 14px", color: T.accent }}>{leader.calling}</td>
                {isLeader ? (
                  <td style={{ padding: "11px 14px", color: T.textDim, fontSize: "12px", lineHeight: 1.45 }}>
                    {leader.invitation_id ? (
                      <>
                        <div>Sent {formatInviteTimestamp(leader.invite_sent_at)}</div>
                        <div>{leader.invite_accepted_at ? `Accepted ${formatInviteTimestamp(leader.invite_accepted_at)}` : "Awaiting acceptance"}</div>
                      </>
                    ) : (
                      <span>Role-managed</span>
                    )}
                    <div style={{ marginTop: "8px" }}>
                      <button
                        type="button"
                        onClick={() => sendOrResendInvite(leader)}
                        style={{ ...css.btn("ghost"), padding: "6px 10px", fontSize: "12px", opacity: resendingLeaderId === leader.id ? 0.6 : 1, cursor: resendingLeaderId === leader.id ? "not-allowed" : "pointer" }}
                        disabled={
                          resendingLeaderId === leader.id ||
                          leader.status === "active" ||
                          !leader.email ||
                          !leader.calling ||
                          leader.role === "young_men_captain"
                        }
                      >
                        {resendingLeaderId === leader.id
                          ? <><Spinner size={12} /> Sending…</>
                          : leader.status === "active"
                            ? "Active"
                            : leader.invitation_id
                              ? "Send Again"
                              : "Send Invite"}
                      </button>
                    </div>
                  </td>
                ) : null}
                <td style={{ padding: "11px 14px" }}>
                  <StatusBadge status={leader.status} />
                </td>
                {isLeader ? (
                  <td style={{ padding: "11px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button type="button" onClick={() => openEdit(leader)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.55 }}><Icon name="edit" size={14} color={T.accent} /></button>
                      {leader.invitation_id ? (
                        <button type="button" onClick={() => removeInvite(leader.invitation_id, leader.name)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.45 }}><Icon name="trash" size={14} color={T.red} /></button>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const ProfilePage = ({
  profile,
  profileOptions,
  userProfiles,
  onSaveProfile,
  onUploadAvatar,
  uploadingAvatar,
  savingProfile,
  onSignOut,
  signingOut,
}) => {
  const [displayName, setDisplayName] = useState(profile.displayName || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [wardId, setWardId] = useState(profile.wardId || "");
  const [profileFieldErrors, setProfileFieldErrors] = useState({});

  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const saveProfile = () => {
    if (!displayName.trim()) {
      setProfileFieldErrors({ displayName: "Display name is required." });
      return;
    }
    setProfileFieldErrors({});
    onSaveProfile(buildProfileInput());
  };

  const buildProfileInput = (overrides = {}) => ({
    displayName,
    avatarUrl,
    phone,
    wardId: wardId || null,
    ...overrides,
  });

  const processUploadFile = async (file) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      window.alert("Please choose an image file.");
      return;
    }

    if (file.size > MAX_AVATAR_FILE_BYTES) {
      window.alert("Please upload an image smaller than 40MB.");
      return;
    }

    const uploadedUrl = await onUploadAvatar(file, buildProfileInput());
    if (uploadedUrl) {
      setAvatarUrl(uploadedUrl);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <PageHeader
        icon="user"
        title="Profile"
        subtitle="Your account and access details"
        action={(
          <button onClick={onSignOut} style={css.btn("ghost")} disabled={signingOut}>
            <Icon name="logOut" size={16} color={T.textMuted} />
            {signingOut ? "Signing Out..." : "Log Out"}
          </button>
        )}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
        <div style={css.card}>
          <h3 style={{ color: T.text, fontSize: "16px", margin: "0 0 14px", fontFamily: T.fontDisplay }}>Account</h3>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "14px" }}>
            <Avatar name={displayName || profile.email} src={avatarUrl || null} size={52} fontSize={18} />
            <div>
              <p style={{ color: T.text, margin: 0, fontSize: "14px", fontWeight: 600 }}>
                {displayName || "Unnamed user"}
              </p>
              <p style={{ color: T.textDim, margin: "2px 0 0", fontSize: "12px" }}>{profile.email}</p>
            </div>
          </div>
          <Field label="Name" required error={profileFieldErrors.displayName}>
            <input
              style={fieldStyle(css.input, profileFieldErrors.displayName)}
              value={displayName}
              onChange={(event) => {
                setDisplayName(event.target.value);
                if (profileFieldErrors.displayName) setProfileFieldErrors({});
              }}
              placeholder="Brother Jones"
            />
          </Field>
          <Field label="Phone Number">
            <input
              style={css.input}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="(555) 555-5555"
            />
          </Field>
          <Field label="Ward">
            <select
              style={css.select}
              value={wardId}
              onChange={(event) => {
                setWardId(event.target.value);
              }}
            >
              <option value="">Select ward</option>
              {(profileOptions?.wards ?? []).map((ward) => (
                <option key={ward.id} value={ward.id}>
                  {ward.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Upload Avatar (Drag & Drop or Click)">
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                if (!uploadingAvatar) {
                  fileInputRef.current?.click();
                }
              }}
              onKeyDown={(event) => {
                if ((event.key === "Enter" || event.key === " ") && !uploadingAvatar) {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                if (!uploadingAvatar) {
                  setDragActive(true);
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                if (!uploadingAvatar) {
                  setDragActive(true);
                }
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                if (event.currentTarget === event.target) {
                  setDragActive(false);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragActive(false);
                if (!uploadingAvatar) {
                  const droppedFile = event.dataTransfer.files?.[0];
                  void processUploadFile(droppedFile);
                }
              }}
              style={{
                border: `1px dashed ${dragActive ? T.accent : T.borderLight}`,
                borderRadius: T.radiusSm,
                padding: "18px 14px",
                textAlign: "center",
                background: dragActive ? `${T.accent}1A` : T.bgInput,
                cursor: uploadingAvatar ? "not-allowed" : "pointer",
                opacity: uploadingAvatar ? 0.65 : 1,
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style={{ display: "none" }}
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0];
                  void processUploadFile(selectedFile);
                }}
              />
              <p style={{ color: T.text, fontSize: "13px", margin: 0 }}>
                {uploadingAvatar
                  ? "Uploading and compressing..."
                  : "Drop image here or click to upload"}
              </p>
              <p style={{ color: T.textDim, fontSize: "11px", margin: "6px 0 0" }}>
                Auto-compressed to WebP before upload.
              </p>
            </div>
          </Field>
          <button
            type="button"
            onClick={saveProfile}
            style={{ ...css.btn(), width: "100%", justifyContent: "center" }}
            disabled={savingProfile || uploadingAvatar}
          >
            {savingProfile ? "Saving..." : uploadingAvatar ? "Uploading..." : "Save Profile"}
          </button>
        </div>
        <div style={css.card}>
          <h3 style={{ color: T.text, fontSize: "16px", margin: "0 0 10px", fontFamily: T.fontDisplay }}>Roles</h3>
          {!profile.roleLabels.length ? (
            <p style={{ color: T.textDim, margin: 0, fontSize: "13px" }}>No roles assigned.</p>
          ) : (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {profile.roleLabels.map((label) => (
                <Badge key={label} bg={T.blueBg} text={T.blue}>{label}</Badge>
              ))}
            </div>
          )}
        </div>
        <div style={css.card}>
          <h3 style={{ color: T.text, fontSize: "16px", margin: "0 0 10px", fontFamily: T.fontDisplay }}>Permissions</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { label: "Stake Admin", enabled: profile.isStakeAdmin },
              { label: "Manage Content", enabled: profile.canManageContent },
              { label: "Manage Units", enabled: profile.canManageUnits },
              { label: "Manage Registrations", enabled: profile.canManageRegistrations },
              { label: "Award Competition Points", enabled: profile.canAwardCompetitionPoints },
            ].map((entry) => (
              <div key={entry.label} style={{ display: "flex", justifyContent: "space-between", gap: "10px", fontSize: "13px" }}>
                <span style={{ color: T.textMuted }}>{entry.label}</span>
                <span style={{ color: entry.enabled ? T.green : T.textDim, fontWeight: 600 }}>
                  {entry.enabled ? "Enabled" : "No"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ ...css.card, marginTop: "14px" }}>
        <h3 style={{ color: T.text, fontSize: "16px", margin: "0 0 12px", fontFamily: T.fontDisplay }}>User Avatars</h3>
        {!userProfiles.length ? (
          <p style={{ color: T.textDim, margin: 0, fontSize: "13px" }}>No user profiles found yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "10px" }}>
            {userProfiles.map((userProfile) => (
              <div key={userProfile.user_id} style={{ border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: "10px", display: "flex", alignItems: "center", gap: "10px", background: T.bgInput }}>
                <Avatar
                  name={userProfile.display_name || userProfile.email}
                  src={userProfile.avatar_url}
                  size={36}
                />
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: T.text, margin: 0, fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {userProfile.display_name}
                  </p>
                  <p style={{ color: T.textDim, margin: "2px 0 0", fontSize: "11px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {userProfile.email || "No email"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ONBOARDING_COPY = {
  youth: { title: "Welcome, Camper!", subtitle: "Let\u2019s get your camp profile set up.", namePlaceholder: "Your name" },
  leader: { title: "Welcome, Leader!", subtitle: "Set up your account so you can manage your ward\u2019s camp experience.", namePlaceholder: "Brother Jones" },
  parent: { title: "Complete Registration", subtitle: "Set up your account, add your young men, and complete camp registration.", namePlaceholder: "Parent/Guardian name" },
  default: { title: "Welcome to Camp Tracker", subtitle: "Let\u2019s set up your account details before you jump in.", namePlaceholder: "Your name" },
};

const TERMS_OF_SERVICE_TEXT = `By completing this registration, I acknowledge and agree to the following:

1. ASSUMPTION OF RISK: I understand that participation in the Young Men Camp involves physical activities that carry inherent risks, including but not limited to hiking, water activities, sports, and outdoor camping. I voluntarily assume all risks associated with participation.

2. MEDICAL AUTHORIZATION: In the event of a medical emergency, I authorize camp leaders to seek and consent to emergency medical treatment for my child/ward if I cannot be reached.

3. MEDICAL INFORMATION: I have disclosed all known medical conditions, allergies, and medications for each registered young man. I understand it is my responsibility to keep this information current.

4. CODE OF CONDUCT: My child/ward agrees to follow all camp rules, respect camp leaders, and treat fellow campers with kindness and respect.

5. PHOTO/VIDEO RELEASE: I grant permission for photographs and videos taken during camp to be used for church and camp-related purposes.

6. LIABILITY RELEASE: To the fullest extent permitted by law, I release and hold harmless the camp organizers, leaders, volunteers, and The Church of Jesus Christ of Latter-day Saints from any claims arising from participation in camp activities.

7. PICKUP AUTHORIZATION: I understand that my child/ward will only be released to authorized individuals as designated during registration.

This agreement is binding for all young men registered under my account for the duration of the camp event (June 15-19, 2026).`;

const YoungManFormEntry = ({
  entry,
  index,
  onUpdate,
  onRemove,
  shirtSizes,
  uploadingPhoto,
  onPhotoFile,
  fieldErrors = {},
}) => {
  const photoInputRef = useRef(null);
  const [dragPhoto, setDragPhoto] = useState(false);
  const displayName = `${entry.firstName || "Young"} ${entry.lastName || "Man"}`.trim() || "Young man";

  return (
    <div style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: "14px", marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <span style={{ fontSize: "13px", fontWeight: 700, color: T.accent }}>Young Man #{index + 1}</span>
        <button type="button" onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}><Icon name="x" size={16} color={T.red} /></button>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
        <Avatar name={displayName} src={entry.photoUrl || null} size={56} fontSize={18} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Field label="Camper photo" required error={fieldErrors.photoUrl}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => { if (!uploadingPhoto) photoInputRef.current?.click(); }}
              onKeyDown={(event) => {
                if ((event.key === "Enter" || event.key === " ") && !uploadingPhoto) {
                  event.preventDefault();
                  photoInputRef.current?.click();
                }
              }}
              onDragEnter={(event) => { event.preventDefault(); if (!uploadingPhoto) setDragPhoto(true); }}
              onDragOver={(event) => { event.preventDefault(); if (!uploadingPhoto) setDragPhoto(true); }}
              onDragLeave={(event) => { event.preventDefault(); if (event.currentTarget === event.target) setDragPhoto(false); }}
              onDrop={(event) => {
                event.preventDefault();
                setDragPhoto(false);
                if (!uploadingPhoto) void onPhotoFile(event.dataTransfer.files?.[0]);
              }}
              style={{
                border: `1px dashed ${fieldErrors.photoUrl ? T.red : entry.photoUrl ? T.accent : dragPhoto ? T.accent : T.borderLight}`,
                boxShadow: fieldErrors.photoUrl ? `0 0 0 1px ${T.red}55` : "none",
                borderRadius: T.radiusSm,
                padding: "10px 12px",
                textAlign: "center",
                background: dragPhoto ? `${T.accent}1A` : T.bg,
                cursor: uploadingPhoto ? "not-allowed" : "pointer",
                opacity: uploadingPhoto ? 0.65 : 1,
              }}
            >
              <input
                ref={photoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style={{ display: "none" }}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void onPhotoFile(file);
                  event.target.value = "";
                }}
              />
              <p style={{ color: T.text, fontSize: "12px", margin: 0 }}>
                {uploadingPhoto ? "Uploading…" : entry.photoUrl ? "Change photo" : "Drop image here or click to upload"}
              </p>
            </div>
          </Field>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <Field label="First Name" required error={fieldErrors.firstName}>
          <input style={fieldStyle(css.input, fieldErrors.firstName)} value={entry.firstName} onChange={e => onUpdate({ ...entry, firstName: e.target.value })} placeholder="First name" />
        </Field>
        <Field label="Last Name" required error={fieldErrors.lastName}>
          <input style={fieldStyle(css.input, fieldErrors.lastName)} value={entry.lastName} onChange={e => onUpdate({ ...entry, lastName: e.target.value })} placeholder="Last name" />
        </Field>
        <Field label="Age" required error={fieldErrors.age}>
          <input style={fieldStyle(css.input, fieldErrors.age)} type="number" min={8} max={18} value={entry.age} onChange={e => onUpdate({ ...entry, age: e.target.value })} placeholder="14" />
        </Field>
        <Field label="Shirt Size" required error={fieldErrors.shirtSizeCode}>
          <select style={fieldStyle(css.select, fieldErrors.shirtSizeCode)} value={entry.shirtSizeCode} onChange={e => onUpdate({ ...entry, shirtSizeCode: e.target.value })}>
            <option value="">Select size</option>
            {shirtSizes.map(s => <option key={s.code} value={s.code}>{s.label}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Allergies"><input style={css.input} value={entry.allergies} onChange={e => onUpdate({ ...entry, allergies: e.target.value })} placeholder="None" /></Field>
      <Field label="Medical Information"><textarea style={{ ...css.input, minHeight: "50px", resize: "vertical" }} value={entry.medicalNotes} onChange={e => onUpdate({ ...entry, medicalNotes: e.target.value })} placeholder="Medications, health conditions..." /></Field>
    </div>
  );
};

const emptyYoungMan = () => ({
  firstName: "",
  lastName: "",
  age: "",
  shirtSizeCode: "",
  photoUrl: "",
  allergies: "",
  medicalNotes: "",
  _key: Math.random().toString(36).slice(2),
});

const OnboardingOverlay = ({
  form,
  setForm,
  inviteType,
  isCamper,
  profileOptions,
  avatarUrl,
  onUploadAvatar,
  uploadingAvatar,
  onComplete,
  completing,
  parentUserId,
}) => {
  const effectiveType = inviteType || (isCamper ? "youth" : "default");
  const copy = ONBOARDING_COPY[effectiveType] || ONBOARDING_COPY.default;
  const isParent = effectiveType === "parent";
  const showWard = true;
  const showYoungMen = isParent;
  const showTerms = isParent;

  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const [youngMen, setYoungMen] = useState([emptyYoungMan()]);
  const [uploadingYoungManKey, setUploadingYoungManKey] = useState(null);
  const [termsRead, setTermsRead] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [attemptedComplete, setAttemptedComplete] = useState(false);

  const processUploadFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      window.alert("Please choose an image file.");
      return;
    }
    if (file.size > MAX_AVATAR_FILE_BYTES) {
      window.alert("Please upload an image smaller than 40MB.");
      return;
    }
    await onUploadAvatar(file, {
      displayName: form.displayName,
      avatarUrl: avatarUrl || "",
      phone: form.phone,
      wardId: form.wardId || null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addYoungMan = () => setYoungMen(prev => [...prev, emptyYoungMan()]);
  const removeYoungMan = (idx) => setYoungMen(prev => prev.filter((_, i) => i !== idx));
  const updateYoungMan = (idx, updated) => setYoungMen(prev => prev.map((ym, i) => i === idx ? updated : ym));

  const handleYoungManPhotoUpload = async (index, file) => {
    if (!parentUserId) {
      window.alert("Unable to identify your account. Please sign in again.");
      return;
    }
    if (!file?.type?.startsWith("image/")) {
      window.alert("Please select a valid image file.");
      return;
    }
    if (file.size > MAX_AVATAR_FILE_BYTES) {
      window.alert("Please upload an image smaller than 40MB.");
      return;
    }
    const entry = youngMen[index];
    if (!entry) return;

    setUploadingYoungManKey(entry._key);
    const previousPhotoUrl = entry.photoUrl || "";
    try {
      const compressedImage = await compressAvatarImage(file);
      const supabase = createSupabaseBrowserClient();
      const objectPath = `${parentUserId}/young-men/${entry._key}-${Date.now()}.webp`;
      const { error: uploadError } = await supabase.storage
        .from(PROFILE_AVATAR_BUCKET)
        .upload(objectPath, compressedImage, {
          contentType: "image/webp",
          cacheControl: "3600",
          upsert: false,
        });
      if (uploadError) {
        throw new Error(uploadError.message);
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from(PROFILE_AVATAR_BUCKET).getPublicUrl(objectPath);

      setYoungMen((prev) => {
        const cur = prev[index];
        if (!cur) return prev;
        return prev.map((ym, i) => (i === index ? { ...cur, photoUrl: publicUrl } : ym));
      });

      const previousPath = parseAvatarObjectPath(previousPhotoUrl);
      if (
        previousPath &&
        previousPath !== objectPath &&
        previousPath.startsWith(`${parentUserId}/young-men/`)
      ) {
        await supabase.storage.from(PROFILE_AVATAR_BUCKET).remove([previousPath]);
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to upload photo.");
    } finally {
      setUploadingYoungManKey(null);
    }
  };

  const youngMenValid = showYoungMen
    ? youngMen.length > 0 && youngMen.every((ym) => (
      ym.firstName.trim() && ym.lastName.trim() && ym.age && ym.photoUrl?.trim() && ym.shirtSizeCode
    ))
    : true;
  const termsValid = showTerms ? termsRead && signatureName.trim().length >= 2 : true;

  const hasRequiredFields =
    form.displayName.trim() &&
    form.password.length >= 8 &&
    !!avatarUrl &&
    form.wardId &&
    youngMenValid &&
    termsValid;

  const overlayFieldErrors = useMemo(() => {
    if (!attemptedComplete) {
      return {
        displayName: undefined,
        password: undefined,
        avatarUrl: undefined,
        wardId: undefined,
        youngMen: youngMen.map(() => ({})),
        termsRead: undefined,
        signatureName: undefined,
      };
    }
    const top = {};
    if (!form.displayName.trim()) top.displayName = "Name is required.";
    if (form.password.length < 8) top.password = "Password must be at least 8 characters.";
    if (!avatarUrl) top.avatarUrl = "Profile photo is required.";
    if (!form.wardId) top.wardId = "Select your ward.";
    const ymErrs = showYoungMen
      ? youngMen.map((ym) => {
          const r = {};
          if (!ym.photoUrl?.trim()) r.photoUrl = "Photo is required.";
          if (!ym.firstName.trim()) r.firstName = "First name is required.";
          if (!ym.lastName.trim()) r.lastName = "Last name is required.";
          if (!ym.age) r.age = "Age is required.";
          if (!ym.shirtSizeCode) r.shirtSizeCode = "Select a shirt size.";
          return r;
        })
      : youngMen.map(() => ({}));
    let termsReadErr;
    let signatureNameErr;
    if (showTerms) {
      if (!termsRead) termsReadErr = "You must agree to the terms.";
      if (signatureName.trim().length < 2) signatureNameErr = "Type your full name as your signature.";
    }
    return { ...top, youngMen: ymErrs, termsRead: termsReadErr, signatureName: signatureNameErr };
  }, [attemptedComplete, form.displayName, form.password, form.wardId, avatarUrl, showYoungMen, youngMen, showTerms, termsRead, signatureName]);

  const wrappedComplete = () => {
    setAttemptedComplete(true);
    if (!hasRequiredFields) return;
    onComplete({ youngMen: showYoungMen ? youngMen : [], signatureName: showTerms ? signatureName : "" });
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 140, background: "rgba(0,0,0,0.82)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "720px", maxHeight: "90vh", overflowY: "auto", ...css.card, border: `1px solid ${T.borderLight}` }}>
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ color: T.text, fontFamily: T.fontDisplay, fontSize: "30px", margin: 0 }}>{copy.title}</h2>
          <p style={{ color: T.textMuted, marginTop: "8px", fontSize: "14px", lineHeight: 1.6 }}>{copy.subtitle}</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
          <Avatar name={form.displayName || "You"} src={avatarUrl || null} size={64} fontSize={22} />
          <div style={{ flex: 1 }}>
            <Field label="Profile Photo" required error={overlayFieldErrors.avatarUrl}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => { if (!uploadingAvatar) fileInputRef.current?.click(); }}
                onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && !uploadingAvatar) { event.preventDefault(); fileInputRef.current?.click(); } }}
                onDragEnter={(event) => { event.preventDefault(); if (!uploadingAvatar) setDragActive(true); }}
                onDragOver={(event) => { event.preventDefault(); if (!uploadingAvatar) setDragActive(true); }}
                onDragLeave={(event) => { event.preventDefault(); if (event.currentTarget === event.target) setDragActive(false); }}
                onDrop={(event) => { event.preventDefault(); setDragActive(false); if (!uploadingAvatar) void processUploadFile(event.dataTransfer.files?.[0]); }}
                style={{
                  border: `1px dashed ${overlayFieldErrors.avatarUrl ? T.red : avatarUrl ? T.accent : dragActive ? T.accent : T.borderLight}`,
                  boxShadow: overlayFieldErrors.avatarUrl ? `0 0 0 1px ${T.red}55` : "none",
                  borderRadius: T.radiusSm, padding: "12px 14px", textAlign: "center",
                  background: dragActive ? `${T.accent}1A` : T.bgInput,
                  cursor: uploadingAvatar ? "not-allowed" : "pointer", opacity: uploadingAvatar ? 0.65 : 1,
                }}
              >
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={(event) => void processUploadFile(event.target.files?.[0])} />
                <p style={{ color: T.text, fontSize: "13px", margin: 0 }}>{uploadingAvatar ? "Uploading..." : avatarUrl ? "Change photo" : "Drop image here or click to upload"}</p>
              </div>
            </Field>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Field label="Name" required error={overlayFieldErrors.displayName}>
            <input style={fieldStyle(css.input, overlayFieldErrors.displayName)} value={form.displayName} onChange={(event) => setForm((previous) => ({ ...previous, displayName: event.target.value }))} placeholder={copy.namePlaceholder} />
          </Field>
          <Field label="Set Password" required error={overlayFieldErrors.password}>
            <input style={fieldStyle(css.input, overlayFieldErrors.password)} type="password" minLength={8} value={form.password} onChange={(event) => setForm((previous) => ({ ...previous, password: event.target.value }))} placeholder="At least 8 characters" />
          </Field>
          <Field label="Phone Number">
            <input style={css.input} value={form.phone} onChange={(event) => setForm((previous) => ({ ...previous, phone: event.target.value }))} placeholder="(801) 555-0000" />
          </Field>
          <Field label="Ward" required={showWard} error={overlayFieldErrors.wardId}>
            <select style={fieldStyle(css.select, overlayFieldErrors.wardId)} value={form.wardId} onChange={(event) => {
              setForm((previous) => ({ ...previous, wardId: event.target.value }));
            }}>
              <option value="">Select ward</option>
              {(profileOptions?.wards ?? []).map((ward) => (
                <option key={ward.id} value={ward.id}>{ward.name}</option>
              ))}
            </select>
          </Field>
        </div>

        {showYoungMen ? (
          <div style={{ marginTop: "20px", borderTop: `1px solid ${T.border}`, paddingTop: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontFamily: T.fontDisplay, fontSize: "18px", color: T.text, margin: 0 }}>Your Young Men</h3>
              <button onClick={addYoungMan} style={css.btn("ghost")}><Icon name="plus" size={14} color={T.accent} /> Add Another</button>
            </div>
            <p style={{ color: T.textMuted, fontSize: "13px", marginBottom: "14px", lineHeight: 1.5 }}>
              Add each young man you are registering for camp. Include a photo, name, age, shirt size, and any allergy or medical information.
            </p>
            {youngMen.map((ym, i) => (
              <YoungManFormEntry
                key={ym._key}
                entry={ym}
                index={i}
                onUpdate={(updated) => updateYoungMan(i, updated)}
                onRemove={() => youngMen.length > 1 && removeYoungMan(i)}
                shirtSizes={profileOptions?.shirtSizes ?? []}
                uploadingPhoto={uploadingYoungManKey === ym._key}
                onPhotoFile={(file) => handleYoungManPhotoUpload(i, file)}
                fieldErrors={overlayFieldErrors.youngMen[i] ?? {}}
              />
            ))}
          </div>
        ) : null}

        {showTerms ? (
          <div style={{ marginTop: "20px", borderTop: `1px solid ${T.border}`, paddingTop: "20px" }}>
            <h3 style={{ fontFamily: T.fontDisplay, fontSize: "18px", color: T.text, margin: "0 0 12px" }}>Terms & Conditions</h3>
            <div style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: "16px", maxHeight: "200px", overflowY: "auto", marginBottom: "14px" }}>
              <pre style={{ color: T.textMuted, fontSize: "12px", lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: T.font, margin: 0 }}>{TERMS_OF_SERVICE_TEXT}</pre>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: overlayFieldErrors.termsRead ? "6px" : "14px" }}>
              <input type="checkbox" id="terms-agree" checked={termsRead} onChange={e => setTermsRead(e.target.checked)} style={{ accentColor: T.accent }} />
              <label htmlFor="terms-agree" style={{ color: T.text, fontSize: "13px", cursor: "pointer" }}>I have read and agree to the terms above</label>
            </div>
            {overlayFieldErrors.termsRead ? (
              <p role="alert" style={{ color: T.red, fontSize: "12px", margin: "0 0 14px" }}>{overlayFieldErrors.termsRead}</p>
            ) : null}
            <Field label="Type your full name as your signature" required error={overlayFieldErrors.signatureName}>
              <input style={{ ...fieldStyle(css.input, overlayFieldErrors.signatureName), fontFamily: "'Playfair Display', serif", fontSize: "18px", fontStyle: "italic" }} value={signatureName} onChange={e => setSignatureName(e.target.value)} placeholder="Your Full Name" />
            </Field>
          </div>
        ) : null}

        <button type="button" onClick={wrappedComplete} disabled={!hasRequiredFields || completing || uploadingAvatar || uploadingYoungManKey !== null} style={{ ...css.btn(), width: "100%", justifyContent: "center", padding: "14px", marginTop: "16px", fontSize: "15px", opacity: !hasRequiredFields || completing || uploadingAvatar || uploadingYoungManKey !== null ? 0.55 : 1 }}>
          {completing ? "Completing Registration..." : isParent ? "Complete Registration" : "Complete Setup"}
        </button>
      </div>
    </div>
  );
};

const PhotosPage = ({ photos }) => (
  <div>
    <PageHeader icon="camera" title="Photo Gallery" subtitle="Camp memories" />
    {!photos.length ? (
      <EmptyState icon="camera" message="Photos will appear here during camp!" />
    ) : (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px" }}>
        {photos.map((photo) => (
          <div key={photo.id} style={{ ...css.card, padding: "0", overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.image_url} alt={photo.caption || "Camp photo"} style={{ width: "100%", height: "170px", objectFit: "cover" }} />
            <div style={{ padding: "14px" }}>
              <p style={{ fontSize: "12px", color: T.textDim, margin: 0 }}>{photo.captured_on || "Date not provided"}</p>
              <p style={{ fontSize: "13px", color: T.text, margin: "8px 0 0" }}>{photo.caption || "No caption provided."}</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const DocsPage = ({ docs }) => (
  <div>
    <PageHeader icon="book" title="Documentation" subtitle="Internal docs for leaders" />
    {!docs.length ? (
      <EmptyState icon="book" message="Documentation entries will appear here." />
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {docs.map((doc) => (
          <div key={doc.id} style={css.card}>
            <h4 style={{ color: T.text, margin: "0 0 10px", fontFamily: T.fontDisplay }}>{doc.title}</h4>
            <p style={{ color: T.textMuted, margin: "0 0 12px", fontSize: "12px" }}>Updated {new Date(doc.updated_at).toLocaleString()}</p>
            <p style={{ color: T.textMuted, lineHeight: 1.7, margin: 0, fontSize: "14px", whiteSpace: "pre-wrap" }}>{doc.content}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

export const CampSidebar = ({ page, onNavigate, open, setOpen, onSignOut, signingOut, profile, isLeader }) => (
  <>
    {open && <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40 }} />}
    <aside style={{ position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50, width: "260px", background: T.bgSidebar, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", transform: open ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.25s ease", overflowY: "auto" }} className="sidebar-always">
      <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${T.border}` }}><div style={{ display: "flex", alignItems: "center", gap: "10px" }}><div style={{ width: "36px", height: "36px", borderRadius: "8px", background: `linear-gradient(135deg, ${T.accent}, ${T.accentDim})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>⛺</div><div><div style={{ fontFamily: T.fontDisplay, fontSize: "16px", fontWeight: 700, color: T.text }}>LU3 Camp</div><div style={{ fontSize: "11px", color: T.textDim }}>Young Men&apos;s 2026</div></div></div></div>
      <nav style={{ padding: "12px 10px", flex: 1 }}>{NAV.filter(n => n.section ? isLeader : (!n.leaderOnly || isLeader)).map((n, i) => {
        if (n.section) return <div key={`section-${i}`} style={{ padding: "16px 12px 6px", fontSize: "10px", fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.08em", borderTop: `1px solid ${T.border}`, marginTop: "8px" }}>{n.section}</div>;
        const active = page === n.key;
        return (<button key={n.key} onClick={() => { onNavigate(n.key); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 12px", borderRadius: T.radiusSm, border: "none", cursor: "pointer", background: active ? T.accent + "18" : "transparent", color: active ? T.accent : T.textMuted, fontFamily: T.font, fontSize: "13px", fontWeight: active ? 600 : 400, textAlign: "left", transition: "all 0.15s ease", marginBottom: "2px" }}><Icon name={n.icon} size={18} color={active ? T.accent : T.textDim} />{n.label}</button>);
      })}</nav>
      <div style={{ padding: "10px", borderTop: `1px solid ${T.border}` }}>
        <button
          type="button"
          onClick={() => {
            onNavigate("profile");
            setOpen(false);
          }}
          style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "8px 10px", borderRadius: T.radiusSm, marginBottom: "8px", background: page === "profile" ? `${T.accent}18` : T.bgInput, border: page === "profile" ? `1px solid ${T.accent}55` : "1px solid transparent", cursor: "pointer", textAlign: "left", transition: "all 0.15s ease" }}
        >
          <Avatar
            name={profile?.displayName || profile?.email}
            src={profile?.avatarUrl}
            size={34}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ color: T.text, fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {profile?.displayName || "User"}
            </div>
            <div style={{ color: T.textDim, fontSize: "11px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {profile?.email || ""}
            </div>
          </div>
        </button>
        <button onClick={onSignOut} disabled={signingOut} style={{ ...css.btn("ghost"), width: "100%", justifyContent: "center", opacity: signingOut ? 0.7 : 1 }}>
          <Icon name="logOut" size={16} color={T.textMuted} />
          {signingOut ? "Signing Out..." : "Log Out"}
        </button>
      </div>
    </aside>
  </>
);

export default function CampDesignApp({ initialData, profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const [page, setPage] = useState(() => resolvePageFromPathname(pathname));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [completingOnboarding, setCompletingOnboarding] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [wards, setWards] = useState(() => initialData?.wards ?? EMPTY_ARRAY);
  const [activities, setActivities] = useState(() => initialData?.activities ?? EMPTY_ARRAY);
  const [competitions, setCompetitions] = useState(() => initialData?.competitions ?? EMPTY_ARRAY);
  const [pointLog, setPointLog] = useState(() => initialData?.pointLog ?? EMPTY_ARRAY);
  const [registrations, setRegistrations] = useState(() => initialData?.registrations ?? EMPTY_ARRAY);
  const [agenda, setAgenda] = useState(() => initialData?.agenda ?? EMPTY_OBJECT);
  const [meals, setMeals] = useState(() => initialData?.meals ?? EMPTY_ARRAY);
  const [contacts, setContacts] = useState(() => initialData?.contacts ?? EMPTY_ARRAY);
  const [leaders, setLeaders] = useState(() => initialData?.leaders ?? EMPTY_ARRAY);
  const [inspiration, setInspiration] = useState(() => initialData?.inspiration ?? EMPTY_ARRAY);
  const [rules, setRules] = useState(() => initialData?.rules ?? EMPTY_ARRAY);
  const [photos, setPhotos] = useState(() => initialData?.photos ?? EMPTY_ARRAY);
  const [docs, setDocs] = useState(() => initialData?.docs ?? EMPTY_ARRAY);
  const [userProfiles, setUserProfiles] = useState(() => initialData?.userProfiles ?? EMPTY_ARRAY);
  const [leaderCallingOptions, setLeaderCallingOptions] = useState(
    () => initialData?.leaderCallingOptions ?? EMPTY_ARRAY,
  );
  const [profileOptions, setProfileOptions] = useState(
    () => initialData?.profileOptions ?? EMPTY_PROFILE_OPTIONS,
  );
  const defaultProfile = {
    userId: "",
    email: "Unknown",
    displayName: "User",
    avatarUrl: null,
    onboardingCompletedAt: null,
    isCamper: false,
    inviteType: null,
    phone: "",
    wardId: "",
    roleLabels: [],
    isLeader: false,
    isStakeAdmin: false,
    canManageContent: false,
    canManageUnits: false,
    canManageRegistrations: false,
    canAwardCompetitionPoints: false,
  };
  const [profileData, setProfileData] = useState(() => profile ?? defaultProfile);
  const [onboardingForm, setOnboardingForm] = useState(() => ({
    displayName: profile?.displayName ?? defaultProfile.displayName,
    phone: profile?.phone ?? "",
    wardId: profile?.wardId ?? "",
    password: "",
  }));

  const applyData = (data) => {
    setWards(data.wards ?? []);
    setActivities(data.activities ?? []);
    setCompetitions(data.competitions ?? []);
    setPointLog(data.pointLog ?? []);
    setRegistrations(data.registrations ?? []);
    setAgenda(data.agenda ?? {});
    setMeals(data.meals ?? []);
    setContacts(data.contacts ?? []);
    setLeaders(data.leaders ?? []);
    setInspiration(data.inspiration ?? []);
    setRules(data.rules ?? []);
    setPhotos(data.photos ?? []);
    setDocs(data.docs ?? []);
    setUserProfiles(data.userProfiles ?? []);
    setLeaderCallingOptions(data.leaderCallingOptions ?? []);
    setProfileOptions(data.profileOptions ?? EMPTY_PROFILE_OPTIONS);
  };

  const applyResult = (result) => {
    if (!result.ok) {
      window.alert(result.error);
      return false;
    }

    if (result.data) {
      applyData(result.data);
    }
    if (result.profile) {
      setProfileData((previous) => ({
        ...previous,
        ...result.profile,
      }));
    }
    return true;
  };

  useEffect(() => {
    const routePage = resolvePageFromPathname(pathname);
    if (!profileData.isLeader && isLeaderOnlyPageKey(routePage)) {
      router.replace("/");
      if (page !== "dashboard") {
        setPage("dashboard");
      }
      return;
    }
    if (routePage !== page) {
      setPage(routePage);
    }
  }, [pathname, page, profileData.isLeader, router]);


  const goToPage = (nextPage) => {
    if (!profileData.isLeader && isLeaderOnlyPageKey(nextPage)) {
      return;
    }
    const targetPath = PAGE_TO_PATH[nextPage];
    if (targetPath) {
      if (targetPath !== pathname) {
        router.push(targetPath);
        return;
      }
      setPage(nextPage);
      return;
    }

    setPage(nextPage);
  };

  const mentionYoungMen = useMemo(() => {
    const list = [];
    for (const w of wards) {
      for (const c of w.campers ?? []) {
        const name = (c?.name ?? "").trim();
        if (!c?.id || !name) continue;
        list.push({ id: c.id, name, wardName: (w.name ?? "").trim() });
      }
    }
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [wards]);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    const result = await signOutCampAction();
    if (!result.ok) {
      window.alert(result.error || "Unable to sign out.");
      setSigningOut(false);
      return;
    }
    window.location.href = "/login";
  };

  const handleSaveProfile = async (input) => {
    if (savingProfile) return;
    setSavingProfile(true);
    try {
      const result = await updateMyProfileAction(input);
      applyResult(result);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCompleteOnboarding = async (extraData) => {
    if (completingOnboarding) return;

    const invType = profileData.inviteType || (profileData.isCamper ? "youth" : null);
    const isParent = invType === "parent";

    const password = onboardingForm.password.trim();
    const hasRequiredValues =
      onboardingForm.displayName.trim() &&
      password.length >= 8 &&
      !!profileData.avatarUrl &&
      onboardingForm.wardId;

    if (!hasRequiredValues) {
      window.alert("Please fill out all required fields, including a profile photo. Password must be at least 8 characters.");
      return;
    }

    setCompletingOnboarding(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: passwordError } = await supabase.auth.updateUser({ password });
      if (passwordError) {
        window.alert(passwordError.message || "Unable to set password.");
        return;
      }

      const completeProfileBody = {
        displayName: onboardingForm.displayName,
        avatarUrl: profileData.avatarUrl ?? "",
        phone: onboardingForm.phone,
        wardId: onboardingForm.wardId,
        signatureName:
          isParent && extraData?.signatureName
            ? extraData.signatureName
            : undefined,
      };

      if (isParent) {
        const shirtSizeByCode = new Map(
          (profileOptions?.shirtSizes ?? []).map((s) => [s.code, s.label]),
        );
        console.log("[parent onboarding] POST /api/onboarding/complete-profile body:", {
          ...completeProfileBody,
        });
        console.log(
          "[parent onboarding] shirt size dropdown options (verify codes match DB):",
          (profileOptions?.shirtSizes ?? []).map((s) => ({ code: s.code, label: s.label })),
        );
        if (extraData?.youngMen?.length) {
          console.log(
            "[parent onboarding] young men raw form rows (before POST /api/onboarding/parent-young-men):",
            extraData.youngMen.map((ym, i) => ({
              index: i,
              firstName: ym.firstName,
              lastName: ym.lastName,
              age: ym.age,
              shirtSizeCode: ym.shirtSizeCode,
              shirtSizeLabel: shirtSizeByCode.get(ym.shirtSizeCode) ?? "(no match in profileOptions — check code)",
              photoUrl: ym.photoUrl,
              allergies: ym.allergies,
              medicalNotes: ym.medicalNotes,
            })),
          );
        }
      }

      const profileRes = await fetch("/api/onboarding/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(completeProfileBody),
      });
      const profileJson = await profileRes.json().catch(() => ({}));
      if (!profileRes.ok || !profileJson.ok) {
        window.alert(
          profileJson.error ||
            (profileRes.status === 401
              ? "Your session expired. Please sign in again."
              : "Could not complete registration. Please try again."),
        );
        return;
      }

      if (isParent && extraData?.youngMen?.length) {
        const youngMenPayload = extraData.youngMen.map((ym) => ({
          firstName: ym.firstName,
          lastName: ym.lastName,
          age: ym.age,
          shirtSizeCode: ym.shirtSizeCode,
          photoUrl: ym.photoUrl,
          allergies: ym.allergies,
          medicalNotes: ym.medicalNotes,
        }));
        console.log(
          "[parent onboarding] POST /api/onboarding/parent-young-men JSON body:",
          JSON.stringify({ youngMen: youngMenPayload }, null, 2),
        );
        const ymRes = await fetch("/api/onboarding/parent-young-men", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ youngMen: youngMenPayload }),
        });
        const ymJson = await ymRes.json().catch(() => ({}));
        if (!ymRes.ok || !ymJson.ok) {
          window.alert(
            `${ymJson.error || "Could not save young men."}\n\nYour profile was saved. Refresh the page or contact support if this keeps happening.`,
          );
          return;
        }
      }

      window.location.href = "/";
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setCompletingOnboarding(false);
    }
  };

  const handleAvatarUpload = async (file, profileInput) => {
    if (!profileData.userId) {
      window.alert("Unable to identify your account. Please sign in again.");
      return null;
    }

    if (!file?.type?.startsWith("image/")) {
      window.alert("Please select a valid image file.");
      return null;
    }

    setUploadingAvatar(true);
    const previousAvatarUrl = profileData.avatarUrl;

    try {
      const compressedImage = await compressAvatarImage(file);
      const supabase = createSupabaseBrowserClient();
      const objectPath = `${profileData.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
      const { error: uploadError } = await supabase.storage
        .from(PROFILE_AVATAR_BUCKET)
        .upload(objectPath, compressedImage, {
          contentType: "image/webp",
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(PROFILE_AVATAR_BUCKET).getPublicUrl(objectPath);

      const result = await updateMyProfileAction({
        ...profileInput,
        avatarUrl: publicUrl,
      });

      if (!applyResult(result)) {
        await supabase.storage.from(PROFILE_AVATAR_BUCKET).remove([objectPath]);
        return null;
      }

      const previousPath = parseAvatarObjectPath(previousAvatarUrl);
      if (
        previousPath &&
        previousPath !== objectPath &&
        previousPath.startsWith(`${profileData.userId}/`)
      ) {
        await supabase.storage.from(PROFILE_AVATAR_BUCKET).remove([previousPath]);
      }

      return publicUrl;
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to upload avatar.");
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const isLeader = profileData.isLeader;

  const pages = {
    dashboard: <Dashboard goTo={goToPage} wards={wards} activities={activities} competitions={competitions} pointLog={pointLog} agenda={agenda} inspiration={inspiration} meals={meals} />,
    activities: <ActivitiesPage activities={activities} applyResult={applyResult} isLeader={isLeader} />,
    agenda: <AgendaPage agenda={agenda} applyResult={applyResult} isLeader={isLeader} />,
    wardRosters: <WardRostersPage wards={wards} leaders={leaders} />,
    wards: <WardsPage wards={wards} applyResult={applyResult} isLeader={isLeader} />,
    competitions: (
      <CompetitionsPage
        competitions={competitions}
        pointLog={pointLog}
        wards={wards}
        awardLeaderName={profileData.displayName ?? ""}
        mentionYoungMen={mentionYoungMen}
        applyResult={applyResult}
        isLeader={isLeader}
        canCompleteCompetition={
          profileData.canAwardCompetitionPoints || profileData.canManageContent
        }
      />
    ),
    registration: <RegistrationPage registrations={registrations} applyResult={applyResult} isLeader={isLeader} />,
    photos: <PhotosPage photos={photos} />,
    contacts: <ContactsPage contacts={contacts} applyResult={applyResult} isLeader={isLeader} />,
    rules: <RulesPage rules={rules} applyResult={applyResult} isLeader={isLeader} />,
    inspiration: <InspirationPage inspiration={inspiration} />,
    meals: <MealsPage meals={meals} wards={wards} applyResult={applyResult} canManageContent={profileData.canManageContent} />,
    leaders: <LeadersPage leaders={leaders} wards={profileOptions.wards} callingOptions={leaderCallingOptions} applyResult={applyResult} isLeader={isLeader} />,
    docs: <DocsPage docs={docs} />,
    profile: (
      <ProfilePage
        profile={profileData}
        profileOptions={profileOptions}
        userProfiles={userProfiles}
        onSaveProfile={handleSaveProfile}
        onUploadAvatar={handleAvatarUpload}
        uploadingAvatar={uploadingAvatar}
        savingProfile={savingProfile}
        onSignOut={handleSignOut}
        signingOut={signingOut}
      />
    ),
  };
  const needsOnboarding = !profileData.onboardingCompletedAt;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${T.bg}; font-family: ${T.font}; color: ${T.text}; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
        button:hover { opacity: 0.88; }
        @media (min-width: 900px) { .sidebar-always { transform: translateX(0) !important; } .main-area { margin-left: 260px !important; } .mobile-menu { display: none !important; } }
      `}</style>
      <CampSidebar
        page={page}
        onNavigate={goToPage}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        onSignOut={handleSignOut}
        signingOut={signingOut}
        profile={profileData}
        isLeader={isLeader}
      />
      <div className="mobile-menu" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 30, height: "56px", background: T.bgSidebar, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", padding: "0 16px", gap: "12px" }}>
        <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}><Icon name="menu" size={24} color={T.text} /></button>
        <span style={{ fontFamily: T.fontDisplay, fontSize: "16px", color: T.text }}>LU3 Camp</span>
      </div>
      <main className="main-area" style={{ marginLeft: 0, padding: "24px", minHeight: "100vh" }}>
        <div style={{ width: "100%", marginTop: "56px" }} className="main-inner">{pages[page]}</div>
        <style>{`@media (min-width: 900px) { .main-inner { margin-top: 0 !important; } }`}</style>
      </main>
      {needsOnboarding ? (
        <OnboardingOverlay
          form={onboardingForm}
          setForm={setOnboardingForm}
          inviteType={profileData.inviteType}
          isCamper={profileData.isCamper}
          profileOptions={profileOptions}
          avatarUrl={profileData.avatarUrl}
          onUploadAvatar={handleAvatarUpload}
          uploadingAvatar={uploadingAvatar}
          onComplete={handleCompleteOnboarding}
          completing={completingOnboarding}
          parentUserId={profileData.userId ?? ""}
        />
      ) : null}
    </>
  );
}
