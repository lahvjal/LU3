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
  createWardAction,
  deleteLeaderInvitationAction,
  deleteActivityAction,
  deleteAgendaItemAction,
  deleteCompetitionAction,
  deleteContactAction,
  deleteParentAction,
  deleteWardAction,
  updateWardAction,
  inviteLeaderAction,
  updateLeaderAction,
  refreshCampDesignDataAction,
  sendParentInviteAction,
  signOutCampAction,
  updateMyProfileAction,
} from "@/lib/app/camp-design-actions";
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
const CAT_COLORS = { Sport: { bg: "#2a3528", text: "#6b9e6b" }, Water: { bg: "#1e2a35", text: "#6b8eb0" }, Spiritual: { bg: "#35301e", text: "#c4a84e" }, Competition: { bg: "#352220", text: "#c46b5e" }, Adventure: { bg: "#2a2435", text: "#9a7eb8" }, Service: { bg: "#2a3030", text: "#6bb0a0" } };
const STATUS_COLORS = { approved: { bg: T.greenBg, text: T.green }, pending: { bg: T.yellowBg, text: T.yellow }, waitlisted: { bg: T.purpleBg, text: T.purple }, active: { bg: T.greenBg, text: T.green }, completed: { bg: T.blueBg, text: T.blue }, upcoming: { bg: T.yellowBg, text: T.yellow }, revoked: { bg: T.redBg, text: T.red } };

const css = {
  badge: (bg, text) => ({ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, background: bg, color: text, letterSpacing: "0.02em", textTransform: "uppercase" }),
  card: { background: T.bgCard, borderRadius: T.radius, padding: "20px", boxShadow: T.shadow, border: `1px solid ${T.border}` },
  btn: (v = "primary") => ({ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: T.radiusSm, border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: T.font, transition: "all 0.15s ease", ...(v === "primary" ? { background: T.accent, color: "#1a1612" } : v === "ghost" ? { background: "transparent", color: T.textMuted, border: `1px solid ${T.border}` } : { background: T.redBg, color: T.red, border: `1px solid ${T.red}33` }) }),
  input: { width: "100%", padding: "10px 14px", borderRadius: T.radiusSm, border: `1px solid ${T.border}`, background: T.bgInput, color: T.text, fontSize: "14px", fontFamily: T.font, outline: "none" },
  select: { width: "100%", padding: "10px 14px", borderRadius: T.radiusSm, border: `1px solid ${T.border}`, background: T.bgInput, color: T.text, fontSize: "14px", fontFamily: T.font, outline: "none" },
  label: { display: "block", fontSize: "12px", fontWeight: 600, color: T.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" },
};

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: "home" }, { key: "activities", label: "Activities", icon: "calendar" },
  { key: "agenda", label: "Daily Agenda", icon: "clock" }, { key: "wardRosters", label: "Ward Rosters", icon: "users" },
  { key: "wards", label: "Wards", icon: "flag", leaderOnly: true },
  { key: "competitions", label: "Competitions", icon: "trophy" }, { key: "registration", label: "Registration", icon: "clipboard", leaderOnly: true },
  { key: "photos", label: "Photo Gallery", icon: "camera" }, { key: "contacts", label: "Contacts", icon: "phone" },
  { key: "rules", label: "Camp Rules", icon: "shield" }, { key: "inspiration", label: "Daily Inspiration", icon: "sun", leaderOnly: true },
  { key: "leaders", label: "Leaders", icon: "star", leaderOnly: true }, { key: "docs", label: "Documentation", icon: "book" },
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
  docs: "/documentation",
  profile: "/profile",
};

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
const Field = ({ label, children }) => (<div style={{ marginBottom: "16px" }}><label style={css.label}>{label}</label>{children}</div>);

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

// ═══════════════════════════════════════════
// PAGES
// ═══════════════════════════════════════════

const Dashboard = ({ goTo, wards, activities, competitions, pointLog, agenda, inspiration }) => {
  const today = inspiration[0] || { verse: "", ref: "" };
  const todayAgenda = agenda[0] || [];
  const totalCampers = wards.reduce((s, w) => s + w.campers.length, 0);
  const totals = {}; wards.forEach(w => { totals[w.id] = 0; }); pointLog.forEach(p => { totals[p.wardId] = (totals[p.wardId] || 0) + p.points; });
  const top = Object.entries(totals).sort((a, b) => b[1] - a[1]).map(([wid]) => wards.find(w => w.id === wid)).filter(Boolean);
  return (
    <div>
      <PageHeader icon="home" title="Camp Dashboard" subtitle="Lehi Utah 3rd Stake — June 15–19, 2026" />
      <div style={{ ...css.card, marginBottom: "24px", background: `linear-gradient(135deg, ${T.bgCard} 0%, #2e2518 100%)`, borderLeft: `4px solid ${T.accent}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: "-20px", top: "-20px", opacity: 0.06, fontSize: "140px" }}>⛺</div>
        <p style={{ color: T.accentLight, fontFamily: T.fontDisplay, fontSize: "18px", fontStyle: "italic", margin: "0 0 8px", lineHeight: 1.5 }}>&quot;{today.verse}&quot;</p>
        <p style={{ color: T.textMuted, fontSize: "13px", margin: 0 }}>— {today.ref}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "14px", marginBottom: "28px" }}>
        {[{ label: "Wards", value: wards.length, icon: "flag", color: T.green, go: "wardRosters" }, { label: "Young Men", value: totalCampers, icon: "users", color: T.blue, go: "wardRosters" }, { label: "Activities", value: activities.length, icon: "calendar", color: T.accent, go: "activities" }, { label: "Competitions", value: competitions.length, icon: "trophy", color: T.yellow, go: "competitions" }].map(s => (
          <div key={s.label} style={{ ...css.card, textAlign: "center", padding: "18px", cursor: "pointer" }} onClick={() => goTo(s.go)}>
            <Icon name={s.icon} size={22} color={s.color} />
            <div style={{ fontSize: "28px", fontWeight: 700, color: T.text, margin: "8px 0 2px", fontFamily: T.fontDisplay }}>{s.value}</div>
            <div style={{ fontSize: "12px", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div style={css.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}><h3 style={{ fontFamily: T.fontDisplay, fontSize: "17px", color: T.text, margin: 0 }}>Today&apos;s Agenda</h3><span style={{ fontSize: "12px", color: T.textMuted }}>{CAMP_DAYS[0]}</span></div>
          {todayAgenda.slice(0, 6).map((a, i) => (<div key={i} style={{ display: "flex", gap: "14px", padding: "8px 0", borderBottom: i < 5 ? `1px solid ${T.border}` : "none" }}><span style={{ fontSize: "12px", color: T.accent, fontWeight: 600, minWidth: "70px", fontFamily: "monospace" }}>{a.time}</span><span style={{ fontSize: "13px", color: T.text }}>{a.item}</span></div>))}
          <button onClick={() => goTo("agenda")} style={{ ...css.btn("ghost"), width: "100%", justifyContent: "center", marginTop: "12px" }}>Full Agenda →</button>
        </div>
        <div style={css.card}>
          <h3 style={{ fontFamily: T.fontDisplay, fontSize: "17px", color: T.text, margin: "0 0 18px" }}>🏆 Leaderboard</h3>
          {top.slice(0, 4).map((u, i) => (<div key={u.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 0", borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}><span style={{ fontSize: "18px", fontWeight: 800, color: i === 0 ? T.yellow : T.textDim, fontFamily: T.fontDisplay, minWidth: "28px" }}>#{i + 1}</span><div style={{ width: "10px", height: "10px", borderRadius: "50%", background: u.color }} /><span style={{ flex: 1, fontWeight: 600, color: T.text, fontSize: "14px" }}>{u.name}</span><span style={{ fontFamily: "monospace", color: T.accent, fontWeight: 700 }}>{totals[u.id]} pts</span></div>))}
          <button onClick={() => goTo("competitions")} style={{ ...css.btn("ghost"), width: "100%", justifyContent: "center", marginTop: "12px" }}>Competitions →</button>
        </div>
      </div>
    </div>
  );
};

const ActivitiesPage = ({ activities, applyResult, isLeader }) => {
  const [view, setView] = useState("timeline");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: "", category: "Sport", day: 0, time: "", location: "", desc: "" });
  const add = async () => {
    if (!form.title || !form.time) return;
    const result = await createActivityAction({
      ...form,
      day: Number(form.day),
    });
    if (applyResult(result)) {
      setForm({ title: "", category: "Sport", day: 0, time: "", location: "", desc: "" });
      setModal(false);
    }
  };
  const del = async (id) => {
    const result = await deleteActivityAction(id);
    applyResult(result);
  };
  const byDay = CAMP_DAYS.map((day, i) => ({ day, acts: activities.filter(a => a.day === i) }));
  return (
    <div>
      <PageHeader icon="calendar" title="Activities" subtitle={`${activities.length} activities scheduled`}
        action={<div style={{ display: "flex", gap: "8px" }}>{["timeline", "grid"].map(v => <button key={v} onClick={() => setView(v)} style={{ ...css.btn(view === v ? "primary" : "ghost"), padding: "6px 14px", fontSize: "12px", textTransform: "capitalize" }}>{v}</button>)}{isLeader && <button onClick={() => setModal(true)} style={css.btn()}><Icon name="plus" size={16} color="#1a1612" /> Add</button>}</div>} />
      <Modal open={modal} onClose={() => setModal(false)} title="New Activity">
        <Field label="Title"><input style={css.input} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Activity name" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Field label="Category"><select style={css.select} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>{Object.keys(CAT_COLORS).map(c => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Day"><select style={css.select} value={form.day} onChange={e => setForm(p => ({ ...p, day: e.target.value }))}>{CAMP_DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}</select></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Field label="Time"><input style={css.input} value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} placeholder="9:00 AM" /></Field>
          <Field label="Location"><input style={css.input} value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Field B" /></Field>
        </div>
        <Field label="Description"><textarea style={{ ...css.input, minHeight: "70px", resize: "vertical" }} value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} /></Field>
        <button onClick={add} style={{ ...css.btn(), width: "100%", justifyContent: "center", padding: "12px" }}>Create Activity</button>
      </Modal>
      {view === "timeline" ? byDay.map(({ day, acts }) => (
        <div key={day} style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}><div style={{ width: "8px", height: "8px", borderRadius: "50%", background: T.accent }} /><h3 style={{ fontFamily: T.fontDisplay, fontSize: "16px", color: T.accentLight, margin: 0 }}>{day}</h3><div style={{ flex: 1, height: "1px", background: T.border }} /></div>
          {!acts.length ? <p style={{ color: T.textDim, fontSize: "13px", paddingLeft: "20px" }}>No activities</p> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px", paddingLeft: "20px" }}>{acts.map(a => { const cc = CAT_COLORS[a.category] || {}; return (<div key={a.id} style={{ ...css.card, padding: "16px", position: "relative" }}>{isLeader && <button onClick={() => del(a.id)} style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", cursor: "pointer", opacity: 0.4 }}><Icon name="trash" size={14} color={T.red} /></button>}<div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", paddingRight: isLeader ? "20px" : "0" }}><span style={{ fontWeight: 600, color: T.text }}>{a.title}</span><Badge bg={cc.bg} text={cc.text}>{a.category}</Badge></div><p style={{ fontSize: "13px", color: T.textMuted, margin: "0 0 10px" }}>{a.desc}</p><div style={{ display: "flex", gap: "16px", fontSize: "12px", color: T.textDim }}><span>🕐 {a.time}</span><span>📍 {a.location}</span></div></div>); })}</div>}
        </div>
      )) : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px" }}>{activities.map(a => { const cc = CAT_COLORS[a.category] || {}; return (<div key={a.id} style={{ ...css.card, padding: "16px" }}><Badge bg={cc.bg} text={cc.text}>{a.category}</Badge><h4 style={{ color: T.text, margin: "10px 0 6px" }}>{a.title}</h4><p style={{ fontSize: "13px", color: T.textMuted, margin: "0 0 10px" }}>{a.desc}</p><div style={{ fontSize: "12px", color: T.textDim }}>{CAMP_DAYS[a.day]} · {a.time} · {a.location}</div></div>); })}</div>}
    </div>
  );
};

const AgendaPage = ({ agenda, applyResult, isLeader }) => {
  const [day, setDay] = useState(0);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ time: "", item: "", location: "" });
  const items = agenda[day] || [];
  const add = async () => {
    if (!form.time || !form.item) return;
    const result = await createAgendaItemAction({
      day,
      time: form.time,
      item: form.item,
      location: form.location,
    });
    if (applyResult(result)) {
      setForm({ time: "", item: "", location: "" });
      setModal(false);
    }
  };
  const del = async (id) => {
    const result = await deleteAgendaItemAction(id);
    applyResult(result);
  };
  return (
    <div>
      <PageHeader icon="clock" title="Daily Agenda" subtitle="Day-by-day schedule" action={isLeader ? <button onClick={() => setModal(true)} style={css.btn()}><Icon name="plus" size={16} color="#1a1612" /> Add Item</button> : null} />
      <Modal open={modal} onClose={() => setModal(false)} title="New Agenda Item">
        <Field label="Time"><input style={css.input} value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} placeholder="10:00 AM" /></Field>
        <Field label="Activity"><input style={css.input} value={form.item} onChange={e => setForm(p => ({ ...p, item: e.target.value }))} placeholder="Activity name" /></Field>
        <Field label="Location"><input style={css.input} value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Pavilion" /></Field>
        <button onClick={add} style={{ ...css.btn(), width: "100%", justifyContent: "center", padding: "12px" }}>Add to {CAMP_DAYS[day]}</button>
      </Modal>
      <div style={{ display: "flex", gap: "6px", marginBottom: "24px", flexWrap: "wrap" }}>{CAMP_DAYS.map((d, i) => <button key={i} onClick={() => setDay(i)} style={{ ...css.btn(day === i ? "primary" : "ghost"), padding: "8px 18px" }}>{d}</button>)}</div>
      {items.length ? <div style={{ ...css.card, padding: 0, overflow: "hidden" }}>{items.map((a, i) => (
        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "20px", padding: "14px 20px", borderBottom: i < items.length - 1 ? `1px solid ${T.border}` : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
          <div style={{ minWidth: "80px", fontFamily: "monospace", fontSize: "13px", fontWeight: 700, color: T.accent }}>{a.time}</div>
          <div style={{ width: "3px", height: "28px", borderRadius: "2px", background: T.accent, opacity: 0.3 }} />
          <div style={{ flex: 1 }}><div style={{ fontWeight: 600, color: T.text, fontSize: "14px" }}>{a.item}</div><div style={{ fontSize: "12px", color: T.textDim, marginTop: "2px" }}>📍 {a.location}</div></div>
          {isLeader && <button onClick={() => del(a.id)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.4 }}><Icon name="trash" size={14} color={T.red} /></button>}
        </div>
      ))}</div> : <EmptyState icon="clock" message="No agenda items for this day." />}
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
  const emptyForm = { name: "", leader: "", leader_email: "", color: "" };
  const [wardForm, setWardForm] = useState(emptyForm);

  const openCreateModal = () => {
    setEditWard(null);
    setWardForm(emptyForm);
    setModal(true);
  };

  const openEditModal = (ward) => {
    setEditWard(ward);
    setWardForm({ name: ward.name, leader: ward.leader, leader_email: ward.leader_email, color: ward.color || "" });
    setModal(true);
  };

  const saveWard = async () => {
    if (!wardForm.name.trim()) return;
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
  };

  const deleteWard = async (wardId) => {
    const result = await deleteWardAction(wardId);
    applyResult(result);
  };

  const closeModal = () => {
    setModal(false);
    setEditWard(null);
    setWardForm(emptyForm);
  };

  return (
    <div>
      <PageHeader icon="flag" title="Wards" subtitle={`${wards.length} wards in the stake`} action={isLeader ? <button onClick={openCreateModal} style={css.btn()}><Icon name="plus" size={16} color="#1a1612" /> Add Ward</button> : null} />
      <Modal open={modal} onClose={closeModal} title={editWard ? "Edit Ward" : "Create Ward"} width={560}>
        <Field label="Ward Name"><input style={css.input} value={wardForm.name} onChange={e => setWardForm(p => ({ ...p, name: e.target.value }))} placeholder="Lehi 3rd Ward" /></Field>
        <Field label="Ward Leader"><input style={css.input} value={wardForm.leader} onChange={e => setWardForm(p => ({ ...p, leader: e.target.value }))} placeholder="Bro. Smith" /></Field>
        <Field label="Leader Email"><input style={css.input} value={wardForm.leader_email} onChange={e => setWardForm(p => ({ ...p, leader_email: e.target.value }))} placeholder="smith@email.com" /></Field>
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
        <button onClick={saveWard} style={{ ...css.btn(), width: "100%", justifyContent: "center", padding: "12px" }}>{editWard ? "Save Changes" : "Create Ward"}</button>
      </Modal>
      {!wards.length ? (
        <EmptyState icon="flag" message="No wards yet. Create your first ward to get started." />
      ) : (
        <div style={{ ...css.card, padding: 0, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "640px" }}>
            <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>{["_color", "Ward", "Leader", "Leader Email", "Young Men", ...(isLeader ? ["_actions"] : [])].map(h => <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: T.textMuted, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{h.startsWith("_") ? "" : h}</th>)}</tr></thead>
            <tbody>{wards.map((ward, index) => (
              <tr key={ward.id} style={{ borderBottom: `1px solid ${T.border}`, background: index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                <td style={{ padding: "11px 14px", width: "36px" }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", background: ward.color || T.textDim, border: `1px solid ${T.border}` }} />
                </td>
                <td style={{ padding: "11px 14px", fontWeight: 700, color: T.text }}>{ward.name}</td>
                <td style={{ padding: "11px 14px", color: T.textMuted }}>{ward.leader || "—"}</td>
                <td style={{ padding: "11px 14px", color: T.textMuted }}>{ward.leader_email || "—"}</td>
                <td style={{ padding: "11px 14px", color: T.textMuted }}>{ward.campers.length}</td>
                {isLeader && <td style={{ padding: "11px 14px", width: "100px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => openEditModal(ward)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.45 }}><Icon name="edit" size={14} color={T.accent} /></button>
                    <button onClick={() => deleteWard(ward.id)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.45 }}><Icon name="trash" size={14} color={T.red} /></button>
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

const CompetitionsPage = ({ competitions, pointLog, wards, leaderNames, applyResult, isLeader }) => {
  const [expanded, setExpanded] = useState(null);
  const [modal, setModal] = useState(null);
  const [awardComp, setAwardComp] = useState(null);
  const [compForm, setCompForm] = useState({ name: "", rules: "", status: "upcoming" });
  const [pointForm, setPointForm] = useState({ wardId: "", points: "", note: "", leader: "" });

  const totals = useMemo(() => { const t = {}; wards.forEach(w => { t[w.id] = 0; }); pointLog.forEach(p => { t[p.wardId] = (t[p.wardId] || 0) + p.points; }); return t; }, [pointLog, wards]);
  const leaderboard = useMemo(() => Object.entries(totals).map(([wid, pts]) => ({ ward: wards.find(w => w.id === wid), pts })).filter(e => e.ward).sort((a, b) => b.pts - a.pts), [totals, wards]);

  const addComp = async () => {
    if (!compForm.name) return;
    const result = await createCompetitionAction(compForm);
    if (applyResult(result)) {
      setCompForm({ name: "", rules: "", status: "upcoming" });
      setModal(null);
    }
  };
  const delComp = async (id) => {
    const result = await deleteCompetitionAction(id);
    applyResult(result);
  };
  const openAward = (c) => { setAwardComp(c); setPointForm({ wardId: wards[0]?.id || "", points: "", note: "", leader: "" }); setModal("points"); };
  const award = async () => {
    const pts = parseInt(pointForm.points, 10);
    if (!pts || !pointForm.wardId || !pointForm.leader || !pointForm.note || !awardComp?.id) return;
    if (Math.abs(pts) > 100) return;
    const result = await awardPointsAction({
      competitionId: awardComp.id,
      wardId: pointForm.wardId,
      points: pts,
      note: pointForm.note,
      leader: pointForm.leader,
    });
    if (applyResult(result)) {
      setPointForm({ wardId: wards[0]?.id || "", points: "", note: "", leader: "" });
      setModal(null);
    }
  };

  return (
    <div>
      <PageHeader icon="trophy" title="Competitions" subtitle="Track scores, award points, view history" action={isLeader ? <button onClick={() => setModal("comp")} style={css.btn()}><Icon name="plus" size={16} color="#1a1612" /> New Competition</button> : null} />
      <Modal open={modal === "comp"} onClose={() => setModal(null)} title="Create Competition">
        <Field label="Name"><input style={css.input} value={compForm.name} onChange={e => setCompForm(p => ({ ...p, name: e.target.value }))} placeholder="Competition name" /></Field>
        <Field label="Rules"><textarea style={{ ...css.input, minHeight: "70px", resize: "vertical" }} value={compForm.rules} onChange={e => setCompForm(p => ({ ...p, rules: e.target.value }))} /></Field>
        <Field label="Status"><select style={css.select} value={compForm.status} onChange={e => setCompForm(p => ({ ...p, status: e.target.value }))}><option value="upcoming">Upcoming</option><option value="active">Active</option><option value="completed">Completed</option></select></Field>
        <button onClick={addComp} style={{ ...css.btn(), width: "100%", justifyContent: "center", padding: "12px" }}>Create Competition</button>
      </Modal>
      <Modal open={modal === "points"} onClose={() => setModal(null)} title={`Award Points — ${awardComp?.name || ""}`}>
        <Field label="Your Name (Leader)"><select style={css.select} value={pointForm.leader} onChange={e => setPointForm(p => ({ ...p, leader: e.target.value }))}><option value="">Select your name...</option>{leaderNames.map(n => <option key={n} value={n}>{n}</option>)}</select></Field>
        <Field label="Ward"><select style={css.select} value={pointForm.wardId} onChange={e => setPointForm(p => ({ ...p, wardId: e.target.value }))}>{wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field>
        <Field label="Points (negative for deductions, max ±100)"><input style={css.input} type="number" min="-100" max="100" value={pointForm.points} onChange={e => setPointForm(p => ({ ...p, points: e.target.value }))} placeholder="25 or -5" /></Field>
        <Field label="Note (required)"><textarea style={{ ...css.input, minHeight: "60px", resize: "vertical" }} value={pointForm.note} onChange={e => setPointForm(p => ({ ...p, note: e.target.value }))} placeholder="Won round 2, Best presentation..." /></Field>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setModal(null)} style={{ ...css.btn("ghost"), flex: 1, justifyContent: "center" }}>Cancel</button>
          <button onClick={award} style={{ ...css.btn(), flex: 1, justifyContent: "center", padding: "12px", opacity: (!pointForm.points || !pointForm.leader || !pointForm.note) ? 0.5 : 1 }}>Award Points</button>
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
          const logs = pointLog.filter(p => p.compId === c.id);
          const ct = {}; wards.forEach(w => { ct[w.id] = 0; }); logs.forEach(l => { ct[l.wardId] = (ct[l.wardId] || 0) + l.points; });
          return (
            <div key={c.id} style={{ ...css.card, padding: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 20px", cursor: "pointer" }} onClick={() => setExpanded(isExp ? null : c.id)}>
                <div style={{ transform: isExp ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><Icon name="chevRight" size={18} color={T.textDim} /></div>
                <h4 style={{ color: T.text, margin: 0, flex: 1, fontSize: "16px" }}>{c.name}</h4>
                <StatusBadge status={c.status} />
                {isLeader && <button onClick={e => { e.stopPropagation(); openAward(c); }} style={{ ...css.btn(), padding: "6px 12px", fontSize: "12px" }}><Icon name="plus" size={14} color="#1a1612" /> Award</button>}
                {isLeader && <button onClick={e => { e.stopPropagation(); delComp(c.id); }} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.4 }}><Icon name="trash" size={14} color={T.red} /></button>}
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
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}><span style={{ fontWeight: 600, color: T.text, fontSize: "13px" }}>{unit?.name || "?"}</span>{isNeg && <Badge bg={T.redBg} text={T.red}>deduction</Badge>}</div>
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
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${wardColor}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: wardColor }}>{initialsFromName(l.name)}</div>
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
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: `${wardColor}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: wardColor }}>
                          {initialsFromName(camper.name)}
                        </div>
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

const RegistrationPage = ({ registrations, applyResult }) => {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ parentName: "", parentEmail: "" });
  const [expanded, setExpanded] = useState({});
  const [sending, setSending] = useState({});

  const addParent = async () => {
    if (!form.parentName.trim() || !form.parentEmail.trim()) return;
    const result = await addParentAction({
      parentName: form.parentName,
      parentEmail: form.parentEmail,
    });
    if (applyResult(result)) {
      setForm({ parentName: "", parentEmail: "" });
      setModal(false);
    }
  };

  const sendInvite = async (parentId) => {
    setSending(p => ({ ...p, [parentId]: true }));
    const result = await sendParentInviteAction(parentId);
    applyResult(result);
    setSending(p => ({ ...p, [parentId]: false }));
  };

  const del = async (parentId) => {
    const result = await deleteParentAction(parentId);
    applyResult(result);
  };

  const toggleExpand = (id) => {
    setExpanded(p => ({ ...p, [id]: !p[id] }));
  };

  const totalYoungMen = registrations.reduce((s, r) => s + r.youngMen.length, 0);

  return (
    <div>
      <PageHeader icon="clipboard" title="Registration" subtitle={`${registrations.length} parents · ${totalYoungMen} young men`} action={<button onClick={() => setModal(true)} style={css.btn()}><Icon name="plus" size={16} color="#1a1612" /> Invite Parent</button>} />
      <Modal open={modal} onClose={() => setModal(false)} title="Invite a Parent" width={480}>
        <Field label="Parent's Full Name"><input style={css.input} value={form.parentName} onChange={e => setForm(p => ({ ...p, parentName: e.target.value }))} placeholder="John Smith" /></Field>
        <Field label="Parent's Email"><input style={css.input} value={form.parentEmail} onChange={e => setForm(p => ({ ...p, parentEmail: e.target.value }))} placeholder="parent@email.com" /></Field>
        <button onClick={addParent} style={{ ...css.btn(), width: "100%", justifyContent: "center", padding: "12px" }}>Add Parent</button>
      </Modal>
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
                    {canSend && (
                      <button
                        onClick={(e) => { e.stopPropagation(); sendInvite(reg.id); }}
                        disabled={sending[reg.id]}
                        style={{ ...css.btn(), fontSize: "11px", padding: "5px 12px", opacity: sending[reg.id] ? 0.5 : 1 }}
                      >
                        {sending[reg.id] ? "Sending..." : reg.inviteStatus === "sent" ? "Resend" : "Send Invite"}
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); del(reg.id); }} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.4, padding: "4px" }}><Icon name="trash" size={14} color={T.red} /></button>
                    {reg.youngMen.length > 0 && <Icon name="chevRight" size={16} color={T.textDim} />}
                  </div>
                </div>
                {isExpanded && reg.youngMen.length > 0 && (
                  <div style={{ borderTop: `1px solid ${T.border}`, padding: "4px 0" }}>
                    {reg.youngMen.map((ym, yi) => (
                      <div key={ym.id} style={{ padding: "10px 18px 10px 36px", borderBottom: yi < reg.youngMen.length - 1 ? `1px solid ${T.border}22` : "none", display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: `${T.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: T.accent }}>
                          {initialsFromName(ym.name)}
                        </div>
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
  const add = async () => {
    if (!form.name || !form.phone) return;
    const result = await addContactAction(form);
    if (applyResult(result)) {
      setForm({ name: "", role: "", phone: "", email: "", emergency: false });
      setModal(false);
    }
  };
  const del = async (id) => {
    const result = await deleteContactAction(id);
    applyResult(result);
  };
  const staff = contacts.filter(c => !c.emergency); const emergency = contacts.filter(c => c.emergency);
  return (
    <div>
      <PageHeader icon="phone" title="Contacts" subtitle="Camp staff & emergency" action={isLeader ? <button onClick={() => setModal(true)} style={css.btn()}><Icon name="plus" size={16} color="#1a1612" /> Add</button> : null} />
      <Modal open={modal} onClose={() => setModal(false)} title="Add Contact">
        <Field label="Name"><input style={css.input} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></Field>
        <Field label="Role"><input style={css.input} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Field label="Phone"><input style={css.input} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></Field>
          <Field label="Email"><input style={css.input} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></Field>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "8px 0" }}><input type="checkbox" checked={form.emergency} onChange={e => setForm(p => ({ ...p, emergency: e.target.checked }))} style={{ width: "18px", height: "18px", accentColor: T.accent }} /><span style={{ fontSize: "14px", color: T.text }}>Emergency contact</span></label>
        <button onClick={add} style={{ ...css.btn(), width: "100%", justifyContent: "center", padding: "12px", marginTop: "8px" }}>Add Contact</button>
      </Modal>
      <h3 style={{ fontFamily: T.fontDisplay, fontSize: "17px", color: T.text, margin: "0 0 14px" }}>Camp Staff</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px", marginBottom: "32px" }}>{staff.map(c => (<div key={c.id} style={{ ...css.card, position: "relative" }}>{isLeader && <button onClick={() => del(c.id)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer", opacity: 0.3 }}><Icon name="trash" size={14} color={T.red} /></button>}<div style={{ fontWeight: 600, color: T.text, fontSize: "15px", marginBottom: "4px" }}>{c.name}</div><div style={{ color: T.textMuted, fontSize: "13px", marginBottom: "10px" }}>{c.role}</div><div style={{ fontSize: "13px", color: T.accent }}>{c.phone}</div>{c.email && <div style={{ fontSize: "12px", color: T.textDim }}>{c.email}</div>}</div>))}</div>
      <h3 style={{ fontFamily: T.fontDisplay, fontSize: "17px", color: T.text, margin: "0 0 14px", display: "flex", alignItems: "center", gap: "8px" }}><span style={{ color: T.red }}>⚠</span> Emergency Contacts</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>{emergency.map(c => (<div key={c.id} style={{ ...css.card, borderLeft: `3px solid ${T.red}`, position: "relative" }}>{isLeader && <button onClick={() => del(c.id)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer", opacity: 0.3 }}><Icon name="trash" size={14} color={T.red} /></button>}<div style={{ fontWeight: 600, color: T.text, fontSize: "15px", marginBottom: "4px" }}>{c.name}</div><div style={{ color: T.textMuted, fontSize: "13px", marginBottom: "8px" }}>{c.role}</div><div style={{ fontSize: "15px", color: T.red, fontWeight: 700, fontFamily: "monospace" }}>{c.phone}</div></div>))}</div>
    </div>
  );
};

const RulesPage = ({ rules }) => {
  const items = rules;
  return (<div><PageHeader icon="shield" title="Camp Rules" subtitle="Official camp guidelines" /><div style={css.card}>{items.map((r, i) => (<div key={i} style={{ display: "flex", gap: "16px", padding: "14px 0", borderBottom: i < items.length - 1 ? `1px solid ${T.border}` : "none", alignItems: "flex-start" }}><span style={{ minWidth: "28px", height: "28px", borderRadius: "50%", background: i === items.length - 1 ? T.accentDim + "33" : T.bgInput, color: i === items.length - 1 ? T.accent : T.textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>{i + 1}</span><span style={{ color: T.text, fontSize: "14px", lineHeight: 1.6, fontWeight: i === items.length - 1 ? 600 : 400, fontStyle: i === items.length - 1 ? "italic" : "normal" }}>{r}</span></div>))}</div></div>);
};

const InspirationPage = ({ inspiration }) => {
  const messages = inspiration;
  return (<div><PageHeader icon="sun" title="Daily Inspiration" subtitle="A message for each day" /><div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>{messages.map((m, i) => (<div key={i} style={{ ...css.card, borderLeft: `4px solid ${T.accent}`, background: `linear-gradient(135deg, ${T.bgCard} 0%, #2e2518 100%)` }}><div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}><Badge bg={T.accentDim + "33"} text={T.accent}>Day {i + 1}</Badge><span style={{ fontSize: "12px", color: T.textDim }}>{CAMP_DAYS[i] ?? `Day ${i + 1}`}</span></div><h3 style={{ fontFamily: T.fontDisplay, fontSize: "22px", color: T.accentLight, margin: "0 0 12px" }}>{m.title}</h3><p style={{ color: T.text, fontSize: "15px", lineHeight: 1.7, fontStyle: "italic", margin: 0 }}>&quot;{m.verse}&quot;</p><p style={{ color: T.textMuted, fontSize: "13px", marginTop: "8px" }}>— {m.ref}</p></div>))}</div></div>);
};

const LeadersPage = ({ leaders, wards, callingOptions, applyResult }) => {
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editLeader, setEditLeader] = useState(null);
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

  const roleOptions = [
    { value: "stake_leader", label: "Stake Leader", wardRequired: false },
    { value: "stake_camp_director", label: "Stake Camp Director", wardRequired: false },
    { value: "camp_committee", label: "Camp Committee", wardRequired: false },
    { value: "ward_leader", label: "Ward Leader", wardRequired: true },
    { value: "young_men_captain", label: "Young Men Captain", wardRequired: true },
  ];
  const selectedRoleOption =
    roleOptions.find((option) => option.value === form.role) ?? roleOptions[0];

  const submitInvite = async () => {
    const callingValue = addingCalling ? form.newCalling : form.calling;
    if (!form.email.trim() || !callingValue.trim()) {
      return;
    }
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
  };

  const removeInvite = async (invitationId) => {
    const result = await deleteLeaderInvitationAction(invitationId);
    applyResult(result);
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
    setEditModal(true);
  };

  const submitEdit = async () => {
    if (!editLeader) return;
    const callingValue = editAddingCalling ? editForm.newCalling : editForm.calling;
    const editRoleOption = roleOptions.find((o) => o.value === editForm.role) ?? roleOptions[0];
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
  };

  const editRoleOption = editModal ? (roleOptions.find((o) => o.value === editForm.role) ?? roleOptions[0]) : null;

  const sendOrResendInvite = async (leader) => {
    if (!leader?.email || !leader?.calling || leader.status === "active") {
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
      <PageHeader icon="star" title="Leaders" subtitle="Manage stake and ward leadership invitations, statuses, and roles" action={<button onClick={() => setModal(true)} style={css.btn()}><Icon name="plus" size={16} color="#1a1612" /> Invite Leader</button>} />
      <Modal open={modal} onClose={() => setModal(false)} title="Invite Leader" width={560}>
        <Field label="Full Name"><input style={css.input} value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} placeholder="John Doe" /></Field>
        <Field label="Email"><input style={css.input} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="leader@email.com" /></Field>
        <Field label="Leadership Role"><select style={css.select} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>{roleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
        <Field label="Ward">
          <select style={css.select} value={form.wardId} onChange={e => setForm(p => ({ ...p, wardId: e.target.value }))}>
            <option value="">Stake-wide (no ward)</option>
            {wards.map((ward) => (
              <option key={ward.id} value={ward.id}>{ward.name}</option>
            ))}
          </select>
        </Field>
        {!addingCalling ? (
          <Field label="Calling">
            <div style={{ display: "flex", gap: "8px" }}>
              <select style={{ ...css.select, flex: 1 }} value={form.calling} onChange={e => setForm(p => ({ ...p, calling: e.target.value }))}>
                <option value="">Select a calling</option>
                {callingOptions.map((calling) => (
                  <option key={calling} value={calling}>{calling}</option>
                ))}
              </select>
              <button type="button" onClick={() => setAddingCalling(true)} style={css.btn("ghost")}>New</button>
            </div>
          </Field>
        ) : (
          <Field label="New Calling">
            <div style={{ display: "flex", gap: "8px" }}>
              <input style={{ ...css.input, flex: 1 }} value={form.newCalling} onChange={e => setForm(p => ({ ...p, newCalling: e.target.value }))} placeholder="Assistant Camp Director" />
              <button type="button" onClick={() => setAddingCalling(false)} style={css.btn("ghost")}>Use List</button>
            </div>
          </Field>
        )}
        <button onClick={submitInvite} style={{ ...css.btn(), width: "100%", justifyContent: "center", padding: "12px" }}>Send Invitation</button>
      </Modal>

      <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Leader" width={560}>
        <Field label="Full Name"><input style={css.input} value={editForm.displayName} onChange={e => setEditForm(p => ({ ...p, displayName: e.target.value }))} placeholder="Full name" /></Field>
        <Field label="Leadership Role"><select style={css.select} value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}>{roleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
        <Field label="Ward">
          <select style={css.select} value={editForm.wardId} onChange={e => setEditForm(p => ({ ...p, wardId: e.target.value }))}>
            <option value="">{editRoleOption?.wardRequired ? "Select ward" : "Stake-wide (no ward)"}</option>
            {wards.map((ward) => (
              <option key={ward.id} value={ward.id}>{ward.name}</option>
            ))}
          </select>
        </Field>
        {!editAddingCalling ? (
          <Field label="Calling">
            <div style={{ display: "flex", gap: "8px" }}>
              <select style={{ ...css.select, flex: 1 }} value={editForm.calling} onChange={e => setEditForm(p => ({ ...p, calling: e.target.value }))}>
                <option value="">Select a calling</option>
                {callingOptions.map((calling) => (
                  <option key={calling} value={calling}>{calling}</option>
                ))}
              </select>
              <button type="button" onClick={() => setEditAddingCalling(true)} style={css.btn("ghost")}>New</button>
            </div>
          </Field>
        ) : (
          <Field label="New Calling">
            <div style={{ display: "flex", gap: "8px" }}>
              <input style={{ ...css.input, flex: 1 }} value={editForm.newCalling} onChange={e => setEditForm(p => ({ ...p, newCalling: e.target.value }))} placeholder="Assistant Camp Director" />
              <button type="button" onClick={() => setEditAddingCalling(false)} style={css.btn("ghost")}>Use List</button>
            </div>
          </Field>
        )}
        <button onClick={submitEdit} style={{ ...css.btn(), width: "100%", justifyContent: "center", padding: "12px" }}>Save Changes</button>
      </Modal>

      {!leaders.length ? (
        <EmptyState icon="star" message="No leadership invitations yet." />
      ) : (
        <div style={{ ...css.card, padding: 0, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "1120px" }}>
            <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>{["Leader", "Role", "Ward", "Calling", "Invite", "Status", "Actions"].map(h => <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: T.textMuted, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{h}</th>)}</tr></thead>
            <tbody>{leaders.map((leader, index) => (
              <tr key={leader.id} style={{ borderBottom: `1px solid ${T.border}`, background: index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                <td style={{ padding: "11px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Avatar name={leader.name || leader.email} src={null} size={30} />
                    <div>
                      <div style={{ color: T.text, fontWeight: 600 }}>{leader.name || "Pending User"}</div>
                      <div style={{ color: T.textDim, fontSize: "11px" }}>{leader.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "11px 14px", color: T.textMuted }}>{leader.role_label || leader.role}</td>
                <td style={{ padding: "11px 14px", color: T.textMuted }}>{leader.ward_name || "Stake-wide"}</td>
                <td style={{ padding: "11px 14px", color: T.accent }}>{leader.calling}</td>
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
                      onClick={() => sendOrResendInvite(leader)}
                      style={{ ...css.btn("ghost"), padding: "6px 10px", fontSize: "12px" }}
                      disabled={
                        resendingLeaderId === leader.id ||
                        leader.status === "active" ||
                        !leader.email ||
                        !leader.calling
                      }
                    >
                      {resendingLeaderId === leader.id
                        ? "Sending..."
                        : leader.status === "active"
                          ? "Active"
                          : leader.invitation_id
                            ? "Send Again"
                            : "Send Invite"}
                    </button>
                  </div>
                </td>
                <td style={{ padding: "11px 14px" }}>
                  <StatusBadge status={leader.status} />
                </td>
                <td style={{ padding: "11px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button onClick={() => openEdit(leader)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.55 }}><Icon name="edit" size={14} color={T.accent} /></button>
                    {leader.invitation_id ? (
                      <button onClick={() => removeInvite(leader.invitation_id)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.45 }}><Icon name="trash" size={14} color={T.red} /></button>
                    ) : null}
                  </div>
                </td>
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
  
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

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
          <Field label="Name">
            <input
              style={css.input}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
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
            onClick={() => {
              onSaveProfile(buildProfileInput());
            }}
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
          <Field label="Camper photo *">
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
                border: `1px dashed ${entry.photoUrl ? T.accent : dragPhoto ? T.accent : T.borderLight}`,
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
        <Field label="First Name"><input style={css.input} value={entry.firstName} onChange={e => onUpdate({ ...entry, firstName: e.target.value })} placeholder="First name" /></Field>
        <Field label="Last Name"><input style={css.input} value={entry.lastName} onChange={e => onUpdate({ ...entry, lastName: e.target.value })} placeholder="Last name" /></Field>
        <Field label="Age"><input style={css.input} type="number" min={8} max={18} value={entry.age} onChange={e => onUpdate({ ...entry, age: e.target.value })} placeholder="14" /></Field>
        <Field label="Shirt Size">
          <select style={css.select} value={entry.shirtSizeCode} onChange={e => onUpdate({ ...entry, shirtSizeCode: e.target.value })}>
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
      ym.firstName.trim() && ym.lastName.trim() && ym.age && ym.photoUrl?.trim()
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

  const wrappedComplete = () => {
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
            <Field label="Profile Photo *">
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
                  border: `1px dashed ${avatarUrl ? T.accent : dragActive ? T.accent : T.borderLight}`,
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
          <Field label="Name">
            <input style={css.input} value={form.displayName} onChange={(event) => setForm((previous) => ({ ...previous, displayName: event.target.value }))} placeholder={copy.namePlaceholder} />
          </Field>
          <Field label="Set Password">
            <input style={css.input} type="password" minLength={8} value={form.password} onChange={(event) => setForm((previous) => ({ ...previous, password: event.target.value }))} placeholder="At least 8 characters" />
          </Field>
          <Field label="Phone Number">
            <input style={css.input} value={form.phone} onChange={(event) => setForm((previous) => ({ ...previous, phone: event.target.value }))} placeholder="(801) 555-0000" />
          </Field>
          <Field label="Ward">
            <select style={css.select} value={form.wardId} onChange={(event) => {
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <input type="checkbox" id="terms-agree" checked={termsRead} onChange={e => setTermsRead(e.target.checked)} style={{ accentColor: T.accent }} />
              <label htmlFor="terms-agree" style={{ color: T.text, fontSize: "13px", cursor: "pointer" }}>I have read and agree to the terms above</label>
            </div>
            <Field label="Type your full name as your signature">
              <input style={{ ...css.input, fontFamily: "'Playfair Display', serif", fontSize: "18px", fontStyle: "italic" }} value={signatureName} onChange={e => setSignatureName(e.target.value)} placeholder="Your Full Name" />
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
      <nav style={{ padding: "12px 10px", flex: 1 }}>{NAV.filter(n => !n.leaderOnly || isLeader).map(n => { const active = page === n.key; return (<button key={n.key} onClick={() => { onNavigate(n.key); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 12px", borderRadius: T.radiusSm, border: "none", cursor: "pointer", background: active ? T.accent + "18" : "transparent", color: active ? T.accent : T.textMuted, fontFamily: T.font, fontSize: "13px", fontWeight: active ? 600 : 400, textAlign: "left", transition: "all 0.15s ease", marginBottom: "2px" }}><Icon name={n.icon} size={18} color={active ? T.accent : T.textDim} />{n.label}</button>); })}</nav>
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
    if (routePage !== page) {
      setPage(routePage);
    }
  }, [pathname, page]);


  const goToPage = (nextPage) => {
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

  const leaderNames = Array.from(
    new Set(
      [
        ...leaders
          .filter((leader) => leader.status === "active")
          .map((leader) => leader.name),
      ]
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );

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
    dashboard: <Dashboard goTo={goToPage} wards={wards} activities={activities} competitions={competitions} pointLog={pointLog} agenda={agenda} inspiration={inspiration} />,
    activities: <ActivitiesPage activities={activities} applyResult={applyResult} isLeader={isLeader} />,
    agenda: <AgendaPage agenda={agenda} applyResult={applyResult} isLeader={isLeader} />,
    wardRosters: <WardRostersPage wards={wards} leaders={leaders} />,
    wards: <WardsPage wards={wards} applyResult={applyResult} isLeader={isLeader} />,
    competitions: <CompetitionsPage competitions={competitions} pointLog={pointLog} wards={wards} leaderNames={leaderNames} applyResult={applyResult} isLeader={isLeader} />,
    registration: <RegistrationPage registrations={registrations} applyResult={applyResult} />,
    photos: <PhotosPage photos={photos} />,
    contacts: <ContactsPage contacts={contacts} applyResult={applyResult} isLeader={isLeader} />,
    rules: <RulesPage rules={rules} />,
    inspiration: <InspirationPage inspiration={inspiration} />,
    leaders: <LeadersPage leaders={leaders} wards={profileOptions.wards} callingOptions={leaderCallingOptions} applyResult={applyResult} />,
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
