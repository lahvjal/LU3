import { useState, useMemo } from "react";

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
  };
  return <svg viewBox="0 0 24 24" style={s} xmlns="http://www.w3.org/2000/svg">{P[name] || P.star}</svg>;
};

const CAMP_DAYS = ["Mon Jun 15", "Tue Jun 16", "Wed Jun 17", "Thu Jun 18", "Fri Jun 19"];
const CAT_COLORS = { Sport: { bg: "#2a3528", text: "#6b9e6b" }, Water: { bg: "#1e2a35", text: "#6b8eb0" }, Spiritual: { bg: "#35301e", text: "#c4a84e" }, Competition: { bg: "#352220", text: "#c46b5e" }, Adventure: { bg: "#2a2435", text: "#9a7eb8" }, Service: { bg: "#2a3030", text: "#6bb0a0" } };
const STATUS_COLORS = { approved: { bg: T.greenBg, text: T.green }, pending: { bg: T.yellowBg, text: T.yellow }, waitlisted: { bg: T.purpleBg, text: T.purple }, active: { bg: T.greenBg, text: T.green }, completed: { bg: T.blueBg, text: T.blue }, upcoming: { bg: T.yellowBg, text: T.yellow } };

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
  { key: "agenda", label: "Daily Agenda", icon: "clock" }, { key: "units", label: "Unit Rosters", icon: "users" },
  { key: "competitions", label: "Competitions", icon: "trophy" }, { key: "registration", label: "Registration", icon: "clipboard" },
  { key: "photos", label: "Photo Gallery", icon: "camera" }, { key: "contacts", label: "Contacts", icon: "phone" },
  { key: "rules", label: "Camp Rules", icon: "shield" }, { key: "inspiration", label: "Daily Inspiration", icon: "sun" },
  { key: "leaders", label: "Stake Leaders", icon: "star" }, { key: "docs", label: "Documentation", icon: "book" },
];

const Badge = ({ children, bg, text }) => <span style={css.badge(bg, text)}>{children}</span>;
const StatusBadge = ({ status }) => { const c = STATUS_COLORS[status] || {}; return <Badge bg={c.bg} text={c.text}>{status}</Badge>; };
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

// ─── INITIAL STATE ───
const initUnits = () => [
  { id: 1, name: "Timberline", color: "#6b9e6b", leader: "Bro. Jensen", leader_email: "jensen@email.com", campers: ["Ethan M.", "Noah R.", "Liam S.", "Jack W.", "Sam T."] },
  { id: 2, name: "Summit", color: "#6b8eb0", leader: "Bro. Carter", leader_email: "carter@email.com", campers: ["Aiden P.", "Owen K.", "Caleb H.", "Ben D."] },
  { id: 3, name: "Trailblazers", color: "#d4915e", leader: "Bro. Thompson", leader_email: "thompson@email.com", campers: ["Mason L.", "Logan B.", "James F.", "Luke R.", "Eli G.", "Ryan C."] },
  { id: 4, name: "Ridgeline", color: "#9a7eb8", leader: "Bro. Williams", leader_email: "williams@email.com", campers: ["Dylan A.", "Wyatt N.", "Carter J.", "Gabe M."] },
];
const initActivities = () => [
  { id: 1, title: "Archery", category: "Sport", day: 0, time: "9:00 AM", location: "Range A", desc: "Basic & intermediate archery instruction" },
  { id: 2, title: "Kayaking", category: "Water", day: 0, time: "2:00 PM", location: "Lake", desc: "Guided kayak tour around the lake" },
  { id: 3, title: "Campfire Program", category: "Spiritual", day: 0, time: "8:00 PM", location: "Fire Pit", desc: "Opening night devotional & skits" },
  { id: 4, title: "Mountain Biking", category: "Sport", day: 1, time: "9:00 AM", location: "Trail Head", desc: "6-mile loop on intermediate trails" },
  { id: 5, title: "Cooking Challenge", category: "Competition", day: 1, time: "4:00 PM", location: "Pavilion", desc: "Unit dutch oven cook-off" },
  { id: 6, title: "Fishing", category: "Water", day: 2, time: "6:00 AM", location: "Lake Dock", desc: "Early morning catch-and-release" },
  { id: 7, title: "Rappelling", category: "Adventure", day: 2, time: "10:00 AM", location: "Cliff Face", desc: "50ft rappel with certified instructors" },
  { id: 8, title: "Ultimate Frisbee", category: "Competition", day: 3, time: "3:00 PM", location: "Field B", desc: "Unit vs unit tournament" },
  { id: 9, title: "Service Project", category: "Service", day: 3, time: "9:00 AM", location: "Trailhead", desc: "Trail maintenance & cleanup" },
  { id: 10, title: "Closing Ceremony", category: "Spiritual", day: 4, time: "10:00 AM", location: "Amphitheater", desc: "Awards, testimonies, & farewell" },
];
const initCompetitions = () => [
  { id: 1, name: "Cooking Challenge", rules: "Best dutch oven dish wins. Judged on taste, presentation, creativity.", status: "completed" },
  { id: 2, name: "Ultimate Frisbee", rules: "Round-robin tournament. 15 points to win.", status: "active" },
  { id: 3, name: "Camp Clean-Up", rules: "Daily inspection. Points for cleanliness & organization.", status: "active" },
  { id: 4, name: "Archery Tournament", rules: "3 rounds, 5 arrows each. Top 3 per unit score.", status: "upcoming" },
];
const initPointLog = () => [
  { id: 1, compId: 1, unitId: 1, points: 50, note: "1st place — incredible dutch oven peach cobbler", leader: "Bro. Harris", timestamp: "Jun 16, 4:55 PM" },
  { id: 2, compId: 1, unitId: 2, points: 35, note: "3rd place — solid chili recipe", leader: "Bro. Harris", timestamp: "Jun 16, 4:56 PM" },
  { id: 3, compId: 1, unitId: 3, points: 45, note: "2nd place — creative foil dinners", leader: "Bro. Harris", timestamp: "Jun 16, 4:57 PM" },
  { id: 4, compId: 1, unitId: 4, points: 40, note: "Good effort, great teamwork", leader: "Bro. Harris", timestamp: "Jun 16, 4:58 PM" },
  { id: 5, compId: 2, unitId: 1, points: 30, note: "Won vs Ridgeline 15-12", leader: "Pres. Anderson", timestamp: "Jun 17, 3:45 PM" },
  { id: 6, compId: 2, unitId: 2, points: 45, note: "Won both round-robin games", leader: "Pres. Anderson", timestamp: "Jun 17, 4:30 PM" },
  { id: 7, compId: 2, unitId: 3, points: 25, note: "Lost both but great sportsmanship", leader: "Pres. Anderson", timestamp: "Jun 17, 4:31 PM" },
  { id: 8, compId: 2, unitId: 4, points: 35, note: "Split games 1-1", leader: "Pres. Anderson", timestamp: "Jun 17, 4:32 PM" },
  { id: 9, compId: 3, unitId: 1, points: 40, note: "Morning inspection — very clean", leader: "Bro. Palmer", timestamp: "Jun 16, 8:30 AM" },
  { id: 10, compId: 3, unitId: 2, points: 30, note: "Some gear left out", leader: "Bro. Palmer", timestamp: "Jun 16, 8:32 AM" },
  { id: 11, compId: 3, unitId: 3, points: 50, note: "Cleanest campsite all week!", leader: "Bro. Palmer", timestamp: "Jun 16, 8:34 AM" },
  { id: 12, compId: 3, unitId: 4, points: 35, note: "Good but trash not fully collected", leader: "Bro. Palmer", timestamp: "Jun 16, 8:36 AM" },
  { id: 13, compId: 3, unitId: 3, points: -5, note: "Deduction — left campfire unattended", leader: "Bro. Harris", timestamp: "Jun 16, 9:15 PM" },
];
const initRegistrations = () => [
  { id: 1, child: "Ethan M.", age: 14, parent: "Sarah M.", phone: "(801) 555-1234", tshirt: "M", unit: "Timberline", medical: "None", status: "approved" },
  { id: 2, child: "Owen K.", age: 13, parent: "Mark K.", phone: "(801) 555-2345", tshirt: "S", unit: "Summit", medical: "Peanut allergy", status: "approved" },
  { id: 3, child: "Tyler B.", age: 12, parent: "Lisa B.", phone: "(801) 555-3456", tshirt: "M", unit: "", medical: "None", status: "pending" },
  { id: 4, child: "Josh P.", age: 15, parent: "Dan P.", phone: "(801) 555-4567", tshirt: "L", unit: "", medical: "Asthma — carries inhaler", status: "waitlisted" },
];
const initAgenda = () => ({
  0: [{ id: 1, time: "7:00 AM", item: "Wake Up & Personal Study", location: "Campsites" }, { id: 2, time: "7:30 AM", item: "Breakfast", location: "Pavilion" }, { id: 3, time: "8:30 AM", item: "Flag Ceremony", location: "Flagpole" }, { id: 4, time: "9:00 AM", item: "Archery", location: "Range A" }, { id: 5, time: "12:00 PM", item: "Lunch", location: "Pavilion" }, { id: 6, time: "2:00 PM", item: "Kayaking", location: "Lake" }, { id: 7, time: "5:30 PM", item: "Dinner", location: "Pavilion" }, { id: 8, time: "8:00 PM", item: "Campfire Program", location: "Fire Pit" }],
  1: [{ id: 9, time: "7:00 AM", item: "Wake Up", location: "Campsites" }, { id: 10, time: "7:30 AM", item: "Breakfast", location: "Pavilion" }, { id: 11, time: "9:00 AM", item: "Mountain Biking", location: "Trail Head" }, { id: 12, time: "12:00 PM", item: "Lunch", location: "Pavilion" }, { id: 13, time: "4:00 PM", item: "Cooking Challenge", location: "Pavilion" }, { id: 14, time: "8:00 PM", item: "Night Games", location: "Field A" }],
});
const INSPIRATION = [
  { day: 0, title: "Courage", verse: "Be strong and of a good courage; be not afraid, neither be thou dismayed: for the Lord thy God is with thee whithersoever thou goest.", ref: "Joshua 1:9" },
  { day: 1, title: "Service", verse: "When ye are in the service of your fellow beings ye are only in the service of your God.", ref: "Mosiah 2:17" },
  { day: 2, title: "Faith", verse: "If ye have faith as a grain of mustard seed... nothing shall be impossible unto you.", ref: "Matthew 17:20" },
  { day: 3, title: "Brotherhood", verse: "A friend loveth at all times, and a brother is born for adversity.", ref: "Proverbs 17:17" },
  { day: 4, title: "Perseverance", verse: "Let us run with patience the race that is set before us.", ref: "Hebrews 12:1" },
];
const initContacts = () => [
  { id: 1, name: "Pres. Anderson", role: "Stake YM President", phone: "(801) 555-0101", email: "anderson@email.com", emergency: false },
  { id: 2, name: "Bro. Harris", role: "Camp Director", phone: "(801) 555-0102", email: "harris@email.com", emergency: false },
  { id: 3, name: "Bishop Clark", role: "Medical Lead", phone: "(801) 555-0103", email: "clark@email.com", emergency: false },
  { id: 4, name: "Emergency Services", role: "911", phone: "911", email: "", emergency: true },
  { id: 5, name: "Poison Control", role: "National", phone: "(800) 222-1222", email: "", emergency: true },
  { id: 6, name: "Nearest Hospital", role: "Mountain View Hospital", phone: "(801) 555-0200", email: "", emergency: true },
];
const initLeaders = () => [
  { id: 1, name: "Pres. Anderson", calling: "Stake YM President", email: "anderson@email.com" },
  { id: 2, name: "Bro. Harris", calling: "Camp Director", email: "harris@email.com" },
  { id: 3, name: "Bro. Palmer", calling: "1st Counselor", email: "palmer@email.com" },
  { id: 4, name: "Bro. Mitchell", calling: "2nd Counselor", email: "mitchell@email.com" },
  { id: 5, name: "Bro. Stevens", calling: "Secretary", email: "stevens@email.com" },
];
const RULES = ["Follow all safety instructions from leaders at all times.", "No electronics or phones during activities (phones allowed in cabins only).", "Buddy system — never go anywhere alone.", "Lights out at 10:30 PM. Quiet hours until 6:30 AM.", "Respect nature. Leave no trace. Pack it in, pack it out.", "Be kind. No bullying, hazing, or exclusion of any kind.", "Wear closed-toe shoes during all outdoor activities.", "Stay within camp boundaries unless accompanied by an adult leader.", "Report any injury, illness, or concern to a leader immediately.", "Have the best week of your summer!"];
const UNIT_COLORS = ["#6b9e6b", "#6b8eb0", "#d4915e", "#9a7eb8", "#c4a84e", "#6bb0a0", "#c46b5e"];
let _id = 100; const nid = () => ++_id;
const now = () => { const d = new Date(); const h = d.getHours(); const m = d.getMinutes(); const ap = h >= 12 ? "PM" : "AM"; return `Jun ${15 + Math.floor(Math.random() * 5)}, ${((h % 12) || 12)}:${m < 10 ? '0' : ''}${m} ${ap}`; };

// ═══════════════════════════════════════════
// PAGES
// ═══════════════════════════════════════════

const Dashboard = ({ goTo, units, activities, competitions, pointLog, agenda }) => {
  const today = INSPIRATION[0];
  const todayAgenda = agenda[0] || [];
  const totalCampers = units.reduce((s, u) => s + u.campers.length, 0);
  const totals = {}; units.forEach(u => { totals[u.id] = 0; }); pointLog.forEach(p => { totals[p.unitId] = (totals[p.unitId] || 0) + p.points; });
  const top = Object.entries(totals).sort((a, b) => b[1] - a[1]).map(([uid]) => units.find(u => u.id === +uid)).filter(Boolean);
  return (
    <div>
      <PageHeader icon="home" title="Camp Dashboard" subtitle="Lehi Utah 3rd Stake — June 15–19, 2026" />
      <div style={{ ...css.card, marginBottom: "24px", background: `linear-gradient(135deg, ${T.bgCard} 0%, #2e2518 100%)`, borderLeft: `4px solid ${T.accent}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: "-20px", top: "-20px", opacity: 0.06, fontSize: "140px" }}>⛺</div>
        <p style={{ color: T.accentLight, fontFamily: T.fontDisplay, fontSize: "18px", fontStyle: "italic", margin: "0 0 8px", lineHeight: 1.5 }}>"{today.verse}"</p>
        <p style={{ color: T.textMuted, fontSize: "13px", margin: 0 }}>— {today.ref}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "14px", marginBottom: "28px" }}>
        {[{ label: "Units", value: units.length, icon: "flag", color: T.green, go: "units" }, { label: "Campers", value: totalCampers, icon: "users", color: T.blue, go: "units" }, { label: "Activities", value: activities.length, icon: "calendar", color: T.accent, go: "activities" }, { label: "Competitions", value: competitions.length, icon: "trophy", color: T.yellow, go: "competitions" }].map(s => (
          <div key={s.label} style={{ ...css.card, textAlign: "center", padding: "18px", cursor: "pointer" }} onClick={() => goTo(s.go)}>
            <Icon name={s.icon} size={22} color={s.color} />
            <div style={{ fontSize: "28px", fontWeight: 700, color: T.text, margin: "8px 0 2px", fontFamily: T.fontDisplay }}>{s.value}</div>
            <div style={{ fontSize: "12px", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div style={css.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}><h3 style={{ fontFamily: T.fontDisplay, fontSize: "17px", color: T.text, margin: 0 }}>Today's Agenda</h3><span style={{ fontSize: "12px", color: T.textMuted }}>{CAMP_DAYS[0]}</span></div>
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

const ActivitiesPage = ({ activities, setActivities }) => {
  const [view, setView] = useState("timeline");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: "", category: "Sport", day: 0, time: "", location: "", desc: "" });
  const add = () => { if (!form.title || !form.time) return; setActivities(p => [...p, { ...form, id: nid(), day: +form.day }]); setForm({ title: "", category: "Sport", day: 0, time: "", location: "", desc: "" }); setModal(false); };
  const del = (id) => setActivities(p => p.filter(a => a.id !== id));
  const byDay = CAMP_DAYS.map((day, i) => ({ day, acts: activities.filter(a => a.day === i) }));
  return (
    <div>
      <PageHeader icon="calendar" title="Activities" subtitle={`${activities.length} activities scheduled`}
        action={<div style={{ display: "flex", gap: "8px" }}>{["timeline", "grid"].map(v => <button key={v} onClick={() => setView(v)} style={{ ...css.btn(view === v ? "primary" : "ghost"), padding: "6px 14px", fontSize: "12px", textTransform: "capitalize" }}>{v}</button>)}<button onClick={() => setModal(true)} style={css.btn()}><Icon name="plus" size={16} color="#1a1612" /> Add</button></div>} />
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
          {!acts.length ? <p style={{ color: T.textDim, fontSize: "13px", paddingLeft: "20px" }}>No activities</p> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px", paddingLeft: "20px" }}>{acts.map(a => { const cc = CAT_COLORS[a.category] || {}; return (<div key={a.id} style={{ ...css.card, padding: "16px", position: "relative" }}><button onClick={() => del(a.id)} style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", cursor: "pointer", opacity: 0.4 }}><Icon name="trash" size={14} color={T.red} /></button><div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", paddingRight: "20px" }}><span style={{ fontWeight: 600, color: T.text }}>{a.title}</span><Badge bg={cc.bg} text={cc.text}>{a.category}</Badge></div><p style={{ fontSize: "13px", color: T.textMuted, margin: "0 0 10px" }}>{a.desc}</p><div style={{ display: "flex", gap: "16px", fontSize: "12px", color: T.textDim }}><span>🕐 {a.time}</span><span>📍 {a.location}</span></div></div>); })}</div>}
        </div>
      )) : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px" }}>{activities.map(a => { const cc = CAT_COLORS[a.category] || {}; return (<div key={a.id} style={{ ...css.card, padding: "16px" }}><Badge bg={cc.bg} text={cc.text}>{a.category}</Badge><h4 style={{ color: T.text, margin: "10px 0 6px" }}>{a.title}</h4><p style={{ fontSize: "13px", color: T.textMuted, margin: "0 0 10px" }}>{a.desc}</p><div style={{ fontSize: "12px", color: T.textDim }}>{CAMP_DAYS[a.day]} · {a.time} · {a.location}</div></div>); })}</div>}
    </div>
  );
};

const AgendaPage = ({ agenda, setAgenda }) => {
  const [day, setDay] = useState(0);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ time: "", item: "", location: "" });
  const items = agenda[day] || [];
  const add = () => { if (!form.time || !form.item) return; setAgenda(p => ({ ...p, [day]: [...(p[day] || []), { ...form, id: nid() }] })); setForm({ time: "", item: "", location: "" }); setModal(false); };
  const del = (id) => setAgenda(p => ({ ...p, [day]: (p[day] || []).filter(i => i.id !== id) }));
  return (
    <div>
      <PageHeader icon="clock" title="Daily Agenda" subtitle="Day-by-day schedule" action={<button onClick={() => setModal(true)} style={css.btn()}><Icon name="plus" size={16} color="#1a1612" /> Add Item</button>} />
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
          <button onClick={() => del(a.id)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.4 }}><Icon name="trash" size={14} color={T.red} /></button>
        </div>
      ))}</div> : <EmptyState icon="clock" message="No agenda items for this day." />}
    </div>
  );
};

const UnitsPage = ({ units, setUnits }) => {
  const [modal, setModal] = useState(null);
  const [unitForm, setUnitForm] = useState({ name: "", leader: "", leader_email: "" });
  const [camperName, setCamperName] = useState("");
  const [addingTo, setAddingTo] = useState(null);
  const addUnit = () => { if (!unitForm.name) return; setUnits(p => [...p, { id: nid(), ...unitForm, color: UNIT_COLORS[p.length % UNIT_COLORS.length], campers: [] }]); setUnitForm({ name: "", leader: "", leader_email: "" }); setModal(null); };
  const addCamper = (uid) => { if (!camperName.trim()) return; setUnits(p => p.map(u => u.id === uid ? { ...u, campers: [...u.campers, camperName.trim()] } : u)); setCamperName(""); };
  const removeCamper = (uid, idx) => setUnits(p => p.map(u => u.id === uid ? { ...u, campers: u.campers.filter((_, i) => i !== idx) } : u));
  const delUnit = (id) => setUnits(p => p.filter(u => u.id !== id));
  return (
    <div>
      <PageHeader icon="users" title="Unit Rosters" subtitle={`${units.length} units · ${units.reduce((s, u) => s + u.campers.length, 0)} campers`} action={<button onClick={() => setModal("unit")} style={css.btn()}><Icon name="plus" size={16} color="#1a1612" /> New Unit</button>} />
      <Modal open={modal === "unit"} onClose={() => setModal(null)} title="Create New Unit">
        <Field label="Unit Name"><input style={css.input} value={unitForm.name} onChange={e => setUnitForm(p => ({ ...p, name: e.target.value }))} placeholder="Trailblazers" /></Field>
        <Field label="Leader Name"><input style={css.input} value={unitForm.leader} onChange={e => setUnitForm(p => ({ ...p, leader: e.target.value }))} placeholder="Bro. Smith" /></Field>
        <Field label="Leader Email"><input style={css.input} value={unitForm.leader_email} onChange={e => setUnitForm(p => ({ ...p, leader_email: e.target.value }))} placeholder="smith@email.com" /></Field>
        <button onClick={addUnit} style={{ ...css.btn(), width: "100%", justifyContent: "center", padding: "12px" }}>Create Unit</button>
      </Modal>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
        {units.map(u => (
          <div key={u.id} style={{ ...css.card, borderTop: `3px solid ${u.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontFamily: T.fontDisplay, fontSize: "18px", color: T.text, margin: 0 }}>{u.name}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Badge bg={u.color + "22"} text={u.color}>{u.campers.length}</Badge><button onClick={() => delUnit(u.id)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.4 }}><Icon name="trash" size={14} color={T.red} /></button></div>
            </div>
            <div style={{ fontSize: "13px", color: T.textMuted, marginBottom: "14px" }}><Icon name="star" size={14} color={u.color} /> <strong style={{ color: T.text }}>{u.leader}</strong> — {u.leader_email}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
              {u.campers.map((c, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 12px", borderRadius: T.radiusSm, background: T.bg }}><div style={{ width: "26px", height: "26px", borderRadius: "50%", background: u.color + "33", color: u.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700 }}>{c[0]}</div><span style={{ fontSize: "13px", color: T.text, flex: 1 }}>{c}</span><button onClick={() => removeCamper(u.id, i)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.3 }}><Icon name="x" size={12} color={T.red} /></button></div>))}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input style={{ ...css.input, flex: 1, padding: "8px 12px", fontSize: "13px" }} placeholder="Add camper..." value={addingTo === u.id ? camperName : ""} onFocus={() => { setAddingTo(u.id); setCamperName(""); }} onChange={e => setCamperName(e.target.value)} onKeyDown={e => e.key === "Enter" && addCamper(u.id)} />
              <button onClick={() => addCamper(u.id)} style={{ ...css.btn(), padding: "8px 12px" }}><Icon name="plus" size={14} color="#1a1612" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CompetitionsPage = ({ competitions, setCompetitions, pointLog, setPointLog, units }) => {
  const [expanded, setExpanded] = useState(null);
  const [modal, setModal] = useState(null);
  const [awardComp, setAwardComp] = useState(null);
  const [compForm, setCompForm] = useState({ name: "", rules: "", status: "upcoming" });
  const [pointForm, setPointForm] = useState({ unitId: "", points: "", note: "", leader: "" });
  const leaders = ["Pres. Anderson", "Bro. Harris", "Bro. Palmer", "Bro. Mitchell", "Bro. Stevens", "Bro. Jensen", "Bro. Carter", "Bro. Thompson", "Bro. Williams"];

  const totals = useMemo(() => { const t = {}; units.forEach(u => { t[u.id] = 0; }); pointLog.forEach(p => { t[p.unitId] = (t[p.unitId] || 0) + p.points; }); return t; }, [pointLog, units]);
  const leaderboard = useMemo(() => Object.entries(totals).map(([uid, pts]) => ({ unit: units.find(u => u.id === +uid), pts })).filter(e => e.unit).sort((a, b) => b.pts - a.pts), [totals, units]);

  const addComp = () => { if (!compForm.name) return; setCompetitions(p => [...p, { id: nid(), ...compForm }]); setCompForm({ name: "", rules: "", status: "upcoming" }); setModal(null); };
  const delComp = (id) => { setCompetitions(p => p.filter(c => c.id !== id)); setPointLog(p => p.filter(l => l.compId !== id)); };
  const openAward = (c) => { setAwardComp(c); setPointForm({ unitId: units[0]?.id || "", points: "", note: "", leader: "" }); setModal("points"); };
  const award = () => {
    const pts = parseInt(pointForm.points);
    if (!pts || !pointForm.unitId || !pointForm.leader || !pointForm.note) return;
    if (Math.abs(pts) > 100) return;
    setPointLog(p => [...p, { id: nid(), compId: awardComp.id, unitId: +pointForm.unitId, points: pts, note: pointForm.note, leader: pointForm.leader, timestamp: now() }]);
    setPointForm({ unitId: units[0]?.id || "", points: "", note: "", leader: "" }); setModal(null);
  };

  return (
    <div>
      <PageHeader icon="trophy" title="Competitions" subtitle="Track scores, award points, view history" action={<button onClick={() => setModal("comp")} style={css.btn()}><Icon name="plus" size={16} color="#1a1612" /> New Competition</button>} />
      <Modal open={modal === "comp"} onClose={() => setModal(null)} title="Create Competition">
        <Field label="Name"><input style={css.input} value={compForm.name} onChange={e => setCompForm(p => ({ ...p, name: e.target.value }))} placeholder="Competition name" /></Field>
        <Field label="Rules"><textarea style={{ ...css.input, minHeight: "70px", resize: "vertical" }} value={compForm.rules} onChange={e => setCompForm(p => ({ ...p, rules: e.target.value }))} /></Field>
        <Field label="Status"><select style={css.select} value={compForm.status} onChange={e => setCompForm(p => ({ ...p, status: e.target.value }))}><option value="upcoming">Upcoming</option><option value="active">Active</option><option value="completed">Completed</option></select></Field>
        <button onClick={addComp} style={{ ...css.btn(), width: "100%", justifyContent: "center", padding: "12px" }}>Create Competition</button>
      </Modal>
      <Modal open={modal === "points"} onClose={() => setModal(null)} title={`Award Points — ${awardComp?.name || ""}`}>
        <Field label="Your Name (Leader)"><select style={css.select} value={pointForm.leader} onChange={e => setPointForm(p => ({ ...p, leader: e.target.value }))}><option value="">Select your name...</option>{leaders.map(n => <option key={n} value={n}>{n}</option>)}</select></Field>
        <Field label="Unit"><select style={css.select} value={pointForm.unitId} onChange={e => setPointForm(p => ({ ...p, unitId: e.target.value }))}>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
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
        {leaderboard.map((entry, i) => { const maxPts = Math.max(leaderboard[0]?.pts || 1, 1); return (
          <div key={entry.unit.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "10px 14px", borderRadius: T.radiusSm, background: i === 0 ? T.yellowBg : T.bg, marginBottom: "6px" }}>
            <span style={{ fontSize: "20px", fontWeight: 800, color: i === 0 ? T.yellow : T.textDim, fontFamily: T.fontDisplay, minWidth: "30px" }}>#{i + 1}</span>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: entry.unit.color }} />
            <span style={{ fontWeight: 600, color: T.text, minWidth: "100px" }}>{entry.unit.name}</span>
            <div style={{ flex: 1, height: "8px", borderRadius: "4px", background: T.border, overflow: "hidden" }}><div style={{ height: "100%", borderRadius: "4px", background: entry.unit.color, width: `${Math.max(0, (entry.pts / maxPts) * 100)}%`, transition: "width 0.5s ease" }} /></div>
            <span style={{ fontWeight: 700, color: T.accent, minWidth: "55px", textAlign: "right", fontFamily: "monospace" }}>{entry.pts} pts</span>
          </div>
        ); })}
      </div>

      {/* Competitions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {competitions.map(c => {
          const isExp = expanded === c.id;
          const logs = pointLog.filter(p => p.compId === c.id);
          const ct = {}; units.forEach(u => { ct[u.id] = 0; }); logs.forEach(l => { ct[l.unitId] = (ct[l.unitId] || 0) + l.points; });
          return (
            <div key={c.id} style={{ ...css.card, padding: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 20px", cursor: "pointer" }} onClick={() => setExpanded(isExp ? null : c.id)}>
                <div style={{ transform: isExp ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><Icon name="chevRight" size={18} color={T.textDim} /></div>
                <h4 style={{ color: T.text, margin: 0, flex: 1, fontSize: "16px" }}>{c.name}</h4>
                <StatusBadge status={c.status} />
                <button onClick={e => { e.stopPropagation(); openAward(c); }} style={{ ...css.btn(), padding: "6px 12px", fontSize: "12px" }}><Icon name="plus" size={14} color="#1a1612" /> Award</button>
                <button onClick={e => { e.stopPropagation(); delComp(c.id); }} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.4 }}><Icon name="trash" size={14} color={T.red} /></button>
              </div>
              {isExp && <div style={{ borderTop: `1px solid ${T.border}` }}>
                <div style={{ padding: "16px 20px", background: "rgba(255,255,255,0.01)" }}><p style={{ fontSize: "13px", color: T.textMuted, margin: 0 }}><strong style={{ color: T.text }}>Rules:</strong> {c.rules}</p></div>
                <div style={{ padding: "12px 20px", borderTop: `1px solid ${T.border}`, display: "flex", gap: "10px", flexWrap: "wrap" }}>{units.map(u => <div key={u.id} style={{ ...css.badge(u.color + "22", u.color), fontSize: "12px", padding: "5px 12px" }}>{u.name}: {ct[u.id] || 0} pts</div>)}</div>
                <div style={{ borderTop: `1px solid ${T.border}` }}>
                  <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: "8px" }}><Icon name="clock" size={14} color={T.textDim} /><span style={{ fontSize: "12px", fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Point History ({logs.length})</span></div>
                  {!logs.length ? <div style={{ padding: "20px", textAlign: "center", color: T.textDim, fontSize: "13px" }}>No points awarded yet.</div> : (
                    <div style={{ maxHeight: "300px", overflowY: "auto" }}>{[...logs].reverse().map(l => {
                      const unit = units.find(u => u.id === l.unitId); const isNeg = l.points < 0;
                      return (<div key={l.id} style={{ display: "flex", gap: "14px", padding: "10px 20px", borderTop: `1px solid ${T.border}`, alignItems: "flex-start" }}>
                        <div style={{ minWidth: "50px", textAlign: "right" }}><span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "15px", color: isNeg ? T.red : T.green }}>{isNeg ? "" : "+"}{l.points}</span></div>
                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: unit?.color || T.textDim, marginTop: "5px", flexShrink: 0 }} />
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

const RegistrationPage = ({ registrations, setRegistrations, units }) => {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ child: "", age: "", parent: "", phone: "", tshirt: "M", unit: "", medical: "" });
  const add = () => { if (!form.child || !form.parent) return; setRegistrations(p => [...p, { ...form, id: nid(), age: +form.age || 0, status: "pending" }]); setForm({ child: "", age: "", parent: "", phone: "", tshirt: "M", unit: "", medical: "" }); setModal(false); };
  const setStatus = (id, s) => setRegistrations(p => p.map(r => r.id === id ? { ...r, status: s } : r));
  const del = (id) => setRegistrations(p => p.filter(r => r.id !== id));
  return (
    <div>
      <PageHeader icon="clipboard" title="Registration" subtitle={`${registrations.length} registrations`} action={<button onClick={() => setModal(true)} style={css.btn()}><Icon name="plus" size={16} color="#1a1612" /> Register</button>} />
      <Modal open={modal} onClose={() => setModal(false)} title="Register a Camper" width={560}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Field label="Child's Name"><input style={css.input} value={form.child} onChange={e => setForm(p => ({ ...p, child: e.target.value }))} placeholder="Full name" /></Field>
          <Field label="Age"><input style={css.input} type="number" value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))} placeholder="12" /></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Field label="Parent's Name"><input style={css.input} value={form.parent} onChange={e => setForm(p => ({ ...p, parent: e.target.value }))} placeholder="Parent name" /></Field>
          <Field label="Parent Phone"><input style={css.input} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="(801) 555-0000" /></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Field label="T-Shirt Size"><select style={css.select} value={form.tshirt} onChange={e => setForm(p => ({ ...p, tshirt: e.target.value }))}>{["YS", "YM", "YL", "S", "M", "L", "XL"].map(s => <option key={s}>{s}</option>)}</select></Field>
          <Field label="Unit (optional)"><select style={css.select} value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}><option value="">Unassigned</option>{units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select></Field>
        </div>
        <Field label="Medical Notes"><textarea style={{ ...css.input, minHeight: "60px", resize: "vertical" }} value={form.medical} onChange={e => setForm(p => ({ ...p, medical: e.target.value }))} placeholder="Allergies, medications..." /></Field>
        <button onClick={add} style={{ ...css.btn(), width: "100%", justifyContent: "center", padding: "12px" }}>Submit Registration</button>
      </Modal>
      <div style={{ ...css.card, padding: 0, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "750px" }}>
          <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>{["Camper", "Age", "Parent", "Phone", "Shirt", "Unit", "Medical", "Status", ""].map(h => <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: T.textMuted, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{h}</th>)}</tr></thead>
          <tbody>{registrations.map((r, i) => (
            <tr key={r.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
              <td style={{ padding: "11px 14px", fontWeight: 600, color: T.text }}>{r.child}</td>
              <td style={{ padding: "11px 14px", color: T.textMuted }}>{r.age}</td>
              <td style={{ padding: "11px 14px", color: T.textMuted }}>{r.parent}</td>
              <td style={{ padding: "11px 14px", color: T.textMuted, fontFamily: "monospace", fontSize: "12px" }}>{r.phone}</td>
              <td style={{ padding: "11px 14px", color: T.textMuted }}>{r.tshirt}</td>
              <td style={{ padding: "11px 14px", color: T.textMuted }}>{r.unit || "—"}</td>
              <td style={{ padding: "11px 14px", color: r.medical && r.medical !== "None" ? T.yellow : T.textDim, fontSize: "12px", maxWidth: "140px" }}>{r.medical || "None"}</td>
              <td style={{ padding: "11px 14px" }}>
                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}><StatusBadge status={r.status} />
                  <div style={{ display: "flex", gap: "2px", marginLeft: "6px" }}>
                    {r.status !== "approved" && <button onClick={() => setStatus(r.id, "approved")} title="Approve" style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="check" size={14} color={T.green} /></button>}
                    {r.status !== "waitlisted" && <button onClick={() => setStatus(r.id, "waitlisted")} title="Waitlist" style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="clock" size={14} color={T.purple} /></button>}
                  </div>
                </div>
              </td>
              <td style={{ padding: "11px 14px" }}><button onClick={() => del(r.id)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.4 }}><Icon name="trash" size={14} color={T.red} /></button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
};

const ContactsPage = ({ contacts, setContacts }) => {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", phone: "", email: "", emergency: false });
  const add = () => { if (!form.name || !form.phone) return; setContacts(p => [...p, { ...form, id: nid() }]); setForm({ name: "", role: "", phone: "", email: "", emergency: false }); setModal(false); };
  const del = (id) => setContacts(p => p.filter(c => c.id !== id));
  const staff = contacts.filter(c => !c.emergency); const emergency = contacts.filter(c => c.emergency);
  return (
    <div>
      <PageHeader icon="phone" title="Contacts" subtitle="Camp staff & emergency" action={<button onClick={() => setModal(true)} style={css.btn()}><Icon name="plus" size={16} color="#1a1612" /> Add</button>} />
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px", marginBottom: "32px" }}>{staff.map(c => (<div key={c.id} style={{ ...css.card, position: "relative" }}><button onClick={() => del(c.id)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer", opacity: 0.3 }}><Icon name="trash" size={14} color={T.red} /></button><div style={{ fontWeight: 600, color: T.text, fontSize: "15px", marginBottom: "4px" }}>{c.name}</div><div style={{ color: T.textMuted, fontSize: "13px", marginBottom: "10px" }}>{c.role}</div><div style={{ fontSize: "13px", color: T.accent }}>{c.phone}</div>{c.email && <div style={{ fontSize: "12px", color: T.textDim }}>{c.email}</div>}</div>))}</div>
      <h3 style={{ fontFamily: T.fontDisplay, fontSize: "17px", color: T.text, margin: "0 0 14px", display: "flex", alignItems: "center", gap: "8px" }}><span style={{ color: T.red }}>⚠</span> Emergency Contacts</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>{emergency.map(c => (<div key={c.id} style={{ ...css.card, borderLeft: `3px solid ${T.red}`, position: "relative" }}><button onClick={() => del(c.id)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer", opacity: 0.3 }}><Icon name="trash" size={14} color={T.red} /></button><div style={{ fontWeight: 600, color: T.text, fontSize: "15px", marginBottom: "4px" }}>{c.name}</div><div style={{ color: T.textMuted, fontSize: "13px", marginBottom: "8px" }}>{c.role}</div><div style={{ fontSize: "15px", color: T.red, fontWeight: 700, fontFamily: "monospace" }}>{c.phone}</div></div>))}</div>
    </div>
  );
};

const RulesPage = () => (<div><PageHeader icon="shield" title="Camp Rules" subtitle="Official camp guidelines" /><div style={css.card}>{RULES.map((r, i) => (<div key={i} style={{ display: "flex", gap: "16px", padding: "14px 0", borderBottom: i < RULES.length - 1 ? `1px solid ${T.border}` : "none", alignItems: "flex-start" }}><span style={{ minWidth: "28px", height: "28px", borderRadius: "50%", background: i === RULES.length - 1 ? T.accentDim + "33" : T.bgInput, color: i === RULES.length - 1 ? T.accent : T.textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>{i + 1}</span><span style={{ color: T.text, fontSize: "14px", lineHeight: 1.6, fontWeight: i === RULES.length - 1 ? 600 : 400, fontStyle: i === RULES.length - 1 ? "italic" : "normal" }}>{r}</span></div>))}</div></div>);

const InspirationPage = () => (<div><PageHeader icon="sun" title="Daily Inspiration" subtitle="A message for each day" /><div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>{INSPIRATION.map((m, i) => (<div key={i} style={{ ...css.card, borderLeft: `4px solid ${T.accent}`, background: `linear-gradient(135deg, ${T.bgCard} 0%, #2e2518 100%)` }}><div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}><Badge bg={T.accentDim + "33"} text={T.accent}>Day {i + 1}</Badge><span style={{ fontSize: "12px", color: T.textDim }}>{CAMP_DAYS[i]}</span></div><h3 style={{ fontFamily: T.fontDisplay, fontSize: "22px", color: T.accentLight, margin: "0 0 12px" }}>{m.title}</h3><p style={{ color: T.text, fontSize: "15px", lineHeight: 1.7, fontStyle: "italic", margin: 0 }}>"{m.verse}"</p><p style={{ color: T.textMuted, fontSize: "13px", marginTop: "8px" }}>— {m.ref}</p></div>))}</div></div>);

const LeadersPage = ({ leaders, setLeaders }) => {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", calling: "", email: "" });
  const add = () => { if (!form.name) return; setLeaders(p => [...p, { ...form, id: nid() }]); setForm({ name: "", calling: "", email: "" }); setModal(false); };
  const del = (id) => setLeaders(p => p.filter(l => l.id !== id));
  return (
    <div>
      <PageHeader icon="star" title="Stake Leaders" subtitle="Stake YM presidency & camp leadership" action={<button onClick={() => setModal(true)} style={css.btn()}><Icon name="plus" size={16} color="#1a1612" /> Add</button>} />
      <Modal open={modal} onClose={() => setModal(false)} title="Add Leader">
        <Field label="Name"><input style={css.input} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Pres. Smith" /></Field>
        <Field label="Calling"><input style={css.input} value={form.calling} onChange={e => setForm(p => ({ ...p, calling: e.target.value }))} placeholder="Stake YM President" /></Field>
        <Field label="Email"><input style={css.input} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></Field>
        <button onClick={add} style={{ ...css.btn(), width: "100%", justifyContent: "center", padding: "12px" }}>Add Leader</button>
      </Modal>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px" }}>{leaders.map(l => (
        <div key={l.id} style={{ ...css.card, textAlign: "center", padding: "28px 20px", position: "relative" }}>
          <button onClick={() => del(l.id)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer", opacity: 0.3 }}><Icon name="trash" size={14} color={T.red} /></button>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: `linear-gradient(135deg, ${T.accent}44, ${T.accent}22)`, color: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 700, margin: "0 auto 14px", fontFamily: T.fontDisplay }}>{l.name.split(" ").pop()?.[0] || l.name[0]}</div>
          <div style={{ fontWeight: 700, color: T.text, fontSize: "15px" }}>{l.name}</div>
          <div style={{ color: T.accent, fontSize: "13px", margin: "4px 0 8px" }}>{l.calling}</div>
          <div style={{ fontSize: "12px", color: T.textDim }}>{l.email}</div>
        </div>
      ))}</div>
    </div>
  );
};

const PhotosPage = () => (<div><PageHeader icon="camera" title="Photo Gallery" subtitle="Camp memories" /><EmptyState icon="camera" message="Photos will appear here during camp!" /></div>);

const DocsPage = () => (<div><PageHeader icon="book" title="Documentation" subtitle="Internal docs for leaders" /><div style={css.card}>
  <h4 style={{ color: T.text, margin: "0 0 14px", fontFamily: T.fontDisplay }}>Permissions System</h4>
  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>{[
    { role: "Stake Leader", desc: "Full edit — create units, delete anything, manage all data", color: T.accent },
    { role: "Unit Leader", desc: "Can add campers to their unit, edit within scope", color: T.blue },
    { role: "Staff", desc: "Can award competition points", color: T.green },
    { role: "Camper", desc: "View only — no create/edit/delete", color: T.purple },
  ].map(p => (<div key={p.role} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "12px", borderRadius: T.radiusSm, background: T.bg }}><Badge bg={p.color + "22"} text={p.color}>{p.role}</Badge><span style={{ fontSize: "13px", color: T.textMuted }}>{p.desc}</span></div>))}</div>
  <h4 style={{ color: T.text, margin: "0 0 12px", fontFamily: T.fontDisplay }}>Point System</h4>
  <p style={{ color: T.textMuted, lineHeight: 1.7, margin: 0, fontSize: "14px" }}>Any leader can award or deduct points (±100 max per entry). Each award tracks who, when, and why. Deductions are flagged for transparency. View full history by expanding any competition.</p>
</div></div>);

const Sidebar = ({ page, setPage, open, setOpen }) => (
  <>
    {open && <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40 }} />}
    <aside style={{ position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50, width: "260px", background: T.bgSidebar, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", transform: open ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.25s ease", overflowY: "auto" }} className="sidebar-always">
      <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${T.border}` }}><div style={{ display: "flex", alignItems: "center", gap: "10px" }}><div style={{ width: "36px", height: "36px", borderRadius: "8px", background: `linear-gradient(135deg, ${T.accent}, ${T.accentDim})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>⛺</div><div><div style={{ fontFamily: T.fontDisplay, fontSize: "16px", fontWeight: 700, color: T.text }}>LU3 Camp</div><div style={{ fontSize: "11px", color: T.textDim }}>Young Men's 2026</div></div></div></div>
      <nav style={{ padding: "12px 10px", flex: 1 }}>{NAV.map(n => { const active = page === n.key; return (<button key={n.key} onClick={() => { setPage(n.key); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 12px", borderRadius: T.radiusSm, border: "none", cursor: "pointer", background: active ? T.accent + "18" : "transparent", color: active ? T.accent : T.textMuted, fontFamily: T.font, fontSize: "13px", fontWeight: active ? 600 : 400, textAlign: "left", transition: "all 0.15s ease", marginBottom: "2px" }}><Icon name={n.icon} size={18} color={active ? T.accent : T.textDim} />{n.label}</button>); })}</nav>
    </aside>
  </>
);

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [units, setUnits] = useState(initUnits);
  const [activities, setActivities] = useState(initActivities);
  const [competitions, setCompetitions] = useState(initCompetitions);
  const [pointLog, setPointLog] = useState(initPointLog);
  const [registrations, setRegistrations] = useState(initRegistrations);
  const [agenda, setAgenda] = useState(initAgenda);
  const [contacts, setContacts] = useState(initContacts);
  const [leaders, setLeaders] = useState(initLeaders);

  const pages = {
    dashboard: <Dashboard goTo={setPage} units={units} activities={activities} competitions={competitions} pointLog={pointLog} agenda={agenda} />,
    activities: <ActivitiesPage activities={activities} setActivities={setActivities} />,
    agenda: <AgendaPage agenda={agenda} setAgenda={setAgenda} />,
    units: <UnitsPage units={units} setUnits={setUnits} />,
    competitions: <CompetitionsPage competitions={competitions} setCompetitions={setCompetitions} pointLog={pointLog} setPointLog={setPointLog} units={units} />,
    registration: <RegistrationPage registrations={registrations} setRegistrations={setRegistrations} units={units} />,
    photos: <PhotosPage />,
    contacts: <ContactsPage contacts={contacts} setContacts={setContacts} />,
    rules: <RulesPage />,
    inspiration: <InspirationPage />,
    leaders: <LeadersPage leaders={leaders} setLeaders={setLeaders} />,
    docs: <DocsPage />,
  };

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
      <Sidebar page={page} setPage={setPage} open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="mobile-menu" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 30, height: "56px", background: T.bgSidebar, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", padding: "0 16px", gap: "12px" }}>
        <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}><Icon name="menu" size={24} color={T.text} /></button>
        <span style={{ fontFamily: T.fontDisplay, fontSize: "16px", color: T.text }}>LU3 Camp</span>
      </div>
      <main className="main-area" style={{ marginLeft: 0, padding: "24px", minHeight: "100vh" }}>
        <div style={{ maxWidth: "1100px", marginTop: "56px" }} className="main-inner">{pages[page]}</div>
        <style>{`@media (min-width: 900px) { .main-inner { margin-top: 0 !important; } }`}</style>
      </main>
    </>
  );
}