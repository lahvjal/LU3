"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CampSidebar } from "@/components/camp-design-app";
import { signOutCampAction } from "@/lib/app/camp-design-actions";
import {
  removeLeaderInviteAction,
  sendLeaderInviteAction,
  type StakeLeaderActionResult,
} from "./actions";

type LeadershipRole =
  | "stake_leader"
  | "stake_camp_director"
  | "ward_leader"
  | "camp_committee"
  | "young_men_captain";

type LeaderInviteStatus = "pending" | "active";

type WardOption = {
  id: string;
  name: string;
};

type LeaderInvitationRow = {
  invitationId: string;
  email: string;
  displayName: string;
  role: LeadershipRole;
  roleLabel: string;
  wardId: string | null;
  wardName: string;
  calling: string;
  status: LeaderInviteStatus;
  invitedAt: string | null;
  acceptedAt: string | null;
  onboardingCompleted: boolean;
};

type AlertState = {
  type: "success" | "error";
  message: string;
};

type InviteDraft = {
  email: string;
  role: LeadershipRole;
  wardId: string;
  calling: string;
  newCalling: string;
};

type RoleOption = {
  value: LeadershipRole;
  label: string;
  wardRequired: boolean;
};

type StakeLeadersDesignPageProps = {
  initialInvitations: LeaderInvitationRow[];
  initialWards: WardOption[];
  initialCallingOptions: string[];
  canManageLeaders: boolean;
  initialProfile: {
    displayName: string;
    email: string;
    avatarUrl: string | null;
  };
};

const PAGE_TO_PATH: Record<string, string> = {
  dashboard: "/",
  activities: "/activities",
  agenda: "/agenda",
  units: "/units",
  wards: "/wards",
  competitions: "/competitions",
  registration: "/register",
  photos: "/photos",
  contacts: "/contacts",
  rules: "/rules",
  inspiration: "/inspiration",
  leaders: "/stake-leaders",
  docs: "/documentation",
  profile: "/profile",
};

const ROLE_OPTIONS: RoleOption[] = [
  { value: "stake_leader", label: "Stake Leader", wardRequired: false },
  {
    value: "stake_camp_director",
    label: "Stake Camp Director",
    wardRequired: false,
  },
  { value: "camp_committee", label: "Camp Committee", wardRequired: false },
  { value: "ward_leader", label: "Ward Leader", wardRequired: true },
  { value: "young_men_captain", label: "Young Men Captain", wardRequired: true },
];

const T = {
  bg: "#1a1612",
  bgCard: "#231f1a",
  bgInput: "#2c2720",
  border: "#3a332b",
  text: "#e8e0d4",
  textMuted: "#9a8e7f",
  textDim: "#6b6054",
  accent: "#d4915e",
  green: "#6b9e6b",
  greenBg: "#2a3528",
  red: "#c46b5e",
  redBg: "#352220",
  yellow: "#c4a84e",
  yellowBg: "#35301e",
  purple: "#9a7eb8",
  purpleBg: "#2a2435",
  radius: "10px",
  radiusSm: "6px",
  shadow: "0 2px 12px rgba(0,0,0,0.3)",
  font: "'DM Sans', sans-serif",
  fontDisplay: "'Playfair Display', serif",
};

const css = {
  badge: (bg?: string, text?: string) => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 600,
    background: bg ?? `${T.border}66`,
    color: text ?? T.textMuted,
    letterSpacing: "0.02em",
    textTransform: "uppercase" as const,
  }),
  card: {
    background: T.bgCard,
    borderRadius: T.radius,
    padding: "20px",
    boxShadow: T.shadow,
    border: `1px solid ${T.border}`,
  },
  btn: (v: "primary" | "ghost" | "danger" = "primary") => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    borderRadius: T.radiusSm,
    border: "none",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: T.font,
    transition: "all 0.15s ease",
    ...(v === "primary"
      ? { background: T.accent, color: "#1a1612" }
      : v === "ghost"
        ? {
            background: "transparent",
            color: T.textMuted,
            border: `1px solid ${T.border}`,
          }
        : {
            background: T.redBg,
            color: T.red,
            border: `1px solid ${T.red}33`,
          }),
  }),
  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: T.radiusSm,
    border: `1px solid ${T.border}`,
    background: T.bgInput,
    color: T.text,
    fontSize: "14px",
    fontFamily: T.font,
    outline: "none",
  },
  select: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: T.radiusSm,
    border: `1px solid ${T.border}`,
    background: T.bgInput,
    color: T.text,
    fontSize: "14px",
    fontFamily: T.font,
    outline: "none",
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    color: T.textMuted,
    marginBottom: "6px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  },
};

const STATUS_COLORS: Record<LeaderInviteStatus, { bg: string; text: string }> = {
  pending: { bg: T.yellowBg, text: T.yellow },
  active: { bg: T.greenBg, text: T.green },
};

function createInitialInviteDraft(wards: WardOption[]): InviteDraft {
  return {
    email: "",
    role: "ward_leader",
    wardId: wards[0]?.id ?? "",
    calling: "",
    newCalling: "",
  };
}

function createInviteDraftFromRow(row: LeaderInvitationRow): InviteDraft {
  return {
    email: row.email,
    role: row.role,
    wardId: row.wardId ?? "",
    calling: row.calling,
    newCalling: "",
  };
}

function formatStatusLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatInviteDate(value: string | null) {
  if (!value) {
    return "Not sent yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function normalizeActionMessage(result: StakeLeaderActionResult) {
  return result.ok ? null : result.error;
}

function initialsFromName(value: string) {
  const tokens = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) {
    return "U";
  }

  if (tokens.length === 1) {
    return tokens[0].slice(0, 2).toUpperCase();
  }

  return `${tokens[0][0]}${tokens[tokens.length - 1][0]}`.toUpperCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const Icon = ({
  name,
  size = 20,
  color,
}: {
  name: string;
  size?: number;
  color?: string;
}) => {
  const s = {
    width: size,
    height: size,
    color: color || T.textMuted,
    strokeWidth: 1.8,
    fill: "none",
    stroke: "currentColor",
    flexShrink: 0,
  };
  const P: Record<string, ReactNode> = {
    plus: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </>
    ),
    x: (
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    ),
    menu: (
      <>
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </>
    ),
    trash: (
      <>
        <polyline points="3 6 5 6 21 6" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </>
    ),
    star: (
      <path d="M12 2l3.1 6.2L22 9.3l-5 4.8 1.2 6.9L12 17.9 5.8 21l1.2-6.9-5-4.8 6.9-1.1z" />
    ),
  };
  return (
    <svg viewBox="0 0 24 24" style={s} xmlns="http://www.w3.org/2000/svg">
      {P[name] || P.mail}
    </svg>
  );
};

const Badge = ({
  children,
  bg,
  text,
}: {
  children: ReactNode;
  bg?: string;
  text?: string;
}) => <span style={css.badge(bg, text)}>{children}</span>;

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div style={{ marginBottom: "16px" }}>
    <label style={css.label}>{label}</label>
    {children}
  </div>
);

const Avatar = ({ name }: { name: string }) => (
  <div
    style={{
      width: 32,
      height: 32,
      borderRadius: "50%",
      background: `${T.accent}33`,
      color: T.accent,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: "0.03em",
      flexShrink: 0,
    }}
  >
    {initialsFromName(name)}
  </div>
);

const PageHeader = ({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "20px",
      flexWrap: "wrap",
      gap: "12px",
    }}
  >
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
        <Icon name="star" size={26} color={T.accent} />
        <h1
          style={{
            fontFamily: T.fontDisplay,
            fontSize: "28px",
            fontWeight: 700,
            color: T.text,
            margin: 0,
          }}
        >
          {title}
        </h1>
      </div>
      {subtitle ? (
        <p style={{ color: T.textMuted, fontSize: "14px", margin: "4px 0 0 38px" }}>
          {subtitle}
        </p>
      ) : null}
    </div>
    {action}
  </div>
);

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(4px)",
        }}
      />
      <div
        style={{
          position: "relative",
          background: T.bgCard,
          border: `1px solid ${T.border}`,
          borderRadius: T.radius,
          boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
          width: "100%",
          maxWidth: 560,
          maxHeight: "85vh",
          overflow: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px 22px",
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <h3 style={{ fontFamily: T.fontDisplay, fontSize: "18px", color: T.text, margin: 0 }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
          >
            <Icon name="x" size={20} color={T.textMuted} />
          </button>
        </div>
        <div style={{ padding: "22px" }}>{children}</div>
      </div>
    </div>
  );
}

export default function StakeLeadersDesignPage({
  initialInvitations,
  initialWards,
  initialCallingOptions,
  canManageLeaders,
  initialProfile,
}: StakeLeadersDesignPageProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [alertState, setAlertState] = useState<AlertState | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<LeaderInvitationRow | null>(null);
  const [inviteDraft, setInviteDraft] = useState<InviteDraft>(() =>
    createInitialInviteDraft(initialWards),
  );
  const [addingCalling, setAddingCalling] = useState(false);
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [removingInviteId, setRemovingInviteId] = useState<string | null>(null);
  const selectedRole =
    ROLE_OPTIONS.find((option) => option.value === inviteDraft.role) ?? ROLE_OPTIONS[0];

  const goToPage = (nextPage: string) => {
    const targetPath = PAGE_TO_PATH[nextPage];
    if (!targetPath) {
      return;
    }

    if (targetPath !== pathname) {
      router.push(targetPath);
    }
  };

  const handleSignOut = async () => {
    if (signingOut) {
      return;
    }

    setSigningOut(true);
    const result = await signOutCampAction();
    if (!result.ok) {
      setSigningOut(false);
      setAlertState({
        type: "error",
        message: result.error || "Unable to sign out.",
      });
      return;
    }

    setProfile({ displayName: "Guest", email: "", avatarUrl: null });
    router.push("/login");
  };

  const openNewInviteModal = () => {
    setInviteTarget(null);
    setAddingCalling(false);
    setInviteDraft(createInitialInviteDraft(initialWards));
    setInviteModalOpen(true);
  };

  const openResendInviteModal = (row: LeaderInvitationRow) => {
    setInviteTarget(row);
    setAddingCalling(false);
    setInviteDraft(createInviteDraftFromRow(row));
    setInviteModalOpen(true);
  };

  const closeInviteModal = () => {
    if (submittingInvite) {
      return;
    }

    setInviteModalOpen(false);
    setInviteTarget(null);
  };

  const submitInvite = async () => {
    if (inviteTarget?.onboardingCompleted || inviteTarget?.status === "active") {
      setAlertState({
        type: "error",
        message: "This leader has already completed onboarding.",
      });
      setInviteModalOpen(false);
      setInviteTarget(null);
      return;
    }

    const email = inviteDraft.email.trim().toLowerCase();
    if (!isValidEmail(email)) {
      setAlertState({
        type: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }

    const calling = (addingCalling ? inviteDraft.newCalling : inviteDraft.calling).trim();
    if (!calling) {
      setAlertState({
        type: "error",
        message: "Please select or enter a calling.",
      });
      return;
    }

    if (selectedRole.wardRequired && !inviteDraft.wardId) {
      setAlertState({
        type: "error",
        message: "Please choose a ward for ward-level callings.",
      });
      return;
    }

    setSubmittingInvite(true);
    const result = await sendLeaderInviteAction({
      email,
      role: inviteDraft.role,
      wardId: selectedRole.wardRequired ? inviteDraft.wardId : null,
      calling,
    });
    setSubmittingInvite(false);

    const errorMessage = normalizeActionMessage(result);
    if (errorMessage) {
      setAlertState({ type: "error", message: errorMessage });
      return;
    }

    setAlertState({
      type: "success",
      message: inviteTarget ? "Leader invite sent again." : "Leader invite sent.",
    });
    setInviteModalOpen(false);
    setInviteTarget(null);
    router.refresh();
  };

  const removeInvite = async (invitationId: string) => {
    const confirmed = window.confirm(
      "Delete this leader invitation and remove any assigned role?",
    );
    if (!confirmed) {
      return;
    }

    setRemovingInviteId(invitationId);
    const result = await removeLeaderInviteAction(invitationId);
    setRemovingInviteId(null);

    const errorMessage = normalizeActionMessage(result);
    if (errorMessage) {
      setAlertState({ type: "error", message: errorMessage });
      return;
    }

    setAlertState({ type: "success", message: "Leader invitation removed." });
    router.refresh();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${T.bg}; font-family: ${T.font}; color: ${T.text}; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
        button:hover { opacity: 0.88; }
        @media (min-width: 900px) {
          .sidebar-always { transform: translateX(0) !important; }
          .main-area { margin-left: 260px !important; }
          .mobile-menu { display: none !important; }
          .main-inner { margin-top: 0 !important; }
        }
      `}</style>
      <CampSidebar
        page="leaders"
        onNavigate={goToPage}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        onSignOut={handleSignOut}
        signingOut={signingOut}
        profile={profile}
        isLeader
      />
      <div
        className="mobile-menu"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          height: "56px",
          background: "#15120f",
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: "12px",
        }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
        >
          <Icon name="menu" size={24} color={T.text} />
        </button>
        <span style={{ fontFamily: T.fontDisplay, fontSize: "16px", color: T.text }}>
          LU3 Camp
        </span>
      </div>
      <main className="main-area" style={{ marginLeft: 0, padding: "24px", minHeight: "100vh" }}>
        <div style={{ maxWidth: "1200px", marginTop: "56px" }} className="main-inner">
          <PageHeader
            title="Leader Invitations"
            subtitle={`${initialInvitations.length} leaders in invitation workflow`}
            action={
              canManageLeaders ? (
                <button onClick={openNewInviteModal} style={css.btn()}>
                  <Icon name="plus" size={16} color="#1a1612" /> Invite Leader
                </button>
              ) : undefined
            }
          />

          {alertState ? (
            <div
              style={{
                ...css.card,
                marginBottom: "16px",
                background: alertState.type === "error" ? T.redBg : T.greenBg,
                borderColor: alertState.type === "error" ? T.red : T.green,
                color: alertState.type === "error" ? "#f2c0b8" : "#bde3bd",
              }}
            >
              {alertState.message}
            </div>
          ) : null}

          {!canManageLeaders ? (
            <div style={css.card}>
              <p style={{ color: T.textMuted, lineHeight: 1.6 }}>
                Stake admin access is required to manage leader invitations.
              </p>
            </div>
          ) : !initialInvitations.length ? (
            <div style={css.card}>
              <p style={{ color: T.textMuted, lineHeight: 1.6 }}>
                No leader invitations yet. Use Invite Leader to start.
              </p>
            </div>
          ) : (
            <div style={{ ...css.card, padding: 0, overflow: "auto" }}>
              <table
                style={{
                  width: "100%",
                  tableLayout: "auto",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                  minWidth: "1020px",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    {["Leader", "Role", "Ward", "Calling", "Invite", "Status", "Actions"].map(
                      (heading) => (
                        <th
                          key={heading}
                          style={{
                            padding: "11px 14px",
                            textAlign: "left",
                            color: T.textMuted,
                            fontSize: "11px",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {initialInvitations.map((row, index) => {
                    const rowBusy = removingInviteId === row.invitationId;
                    const resendDisabled =
                      rowBusy || row.onboardingCompleted || row.status === "active";
                    const statusColor = STATUS_COLORS[row.status];
                    return (
                      <tr
                        key={row.invitationId}
                        style={{
                          borderBottom: `1px solid ${T.border}`,
                          background: index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                        }}
                      >
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <Avatar name={row.displayName || row.email} />
                            <div>
                              <div style={{ color: T.text, fontWeight: 600 }}>
                                {row.displayName || "Pending User"}
                              </div>
                              <div style={{ color: T.textDim, fontSize: "11px" }}>
                                {row.email || "No email"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "11px 14px", color: T.textMuted }}>
                          {row.roleLabel}
                        </td>
                        <td style={{ padding: "11px 14px", color: T.textMuted }}>
                          {row.wardName || "Stake-wide"}
                        </td>
                        <td style={{ padding: "11px 14px", color: T.accent }}>{row.calling}</td>
                        <td style={{ padding: "11px 14px", color: T.textDim, lineHeight: 1.5 }}>
                          <div>Sent {formatInviteDate(row.invitedAt)}</div>
                          <div>
                            {row.acceptedAt
                              ? `Accepted ${formatInviteDate(row.acceptedAt)}`
                              : "Awaiting acceptance"}
                          </div>
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <Badge bg={statusColor.bg} text={statusColor.text}>
                            {formatStatusLabel(row.status)}
                          </Badge>
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <button
                              onClick={() => openResendInviteModal(row)}
                              style={css.btn("ghost")}
                              disabled={resendDisabled}
                            >
                              <Icon name="mail" size={14} />
                              {row.onboardingCompleted || row.status === "active"
                                ? "Active"
                                : "Send Again"}
                            </button>
                            <button
                              onClick={() => {
                                void removeInvite(row.invitationId);
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                opacity: 0.45,
                              }}
                              disabled={rowBusy}
                              aria-label="Delete invitation"
                              title="Delete invitation"
                            >
                              <Icon name="trash" size={14} color={T.red} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Modal
        open={inviteModalOpen}
        onClose={closeInviteModal}
        title={inviteTarget ? "Send Leader Invite Again" : "Invite Leader"}
      >
        <Field label="Email">
          <input
            style={css.input}
            value={inviteDraft.email}
            onChange={(event) =>
              setInviteDraft((previous) => ({ ...previous, email: event.target.value }))
            }
            placeholder="leader@email.com"
          />
        </Field>
        <Field label="Leadership Role">
          <select
            style={css.select}
            value={inviteDraft.role}
            onChange={(event) => {
              const nextRole = event.target.value as LeadershipRole;
              setInviteDraft((previous) => ({
                ...previous,
                role: nextRole,
                wardId:
                  ROLE_OPTIONS.find((option) => option.value === nextRole)?.wardRequired
                    ? previous.wardId || initialWards[0]?.id || ""
                    : "",
              }));
            }}
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        {selectedRole.wardRequired ? (
          <Field label="Ward">
            <select
              style={css.select}
              value={inviteDraft.wardId}
              onChange={(event) =>
                setInviteDraft((previous) => ({ ...previous, wardId: event.target.value }))
              }
            >
              <option value="">Select ward</option>
              {initialWards.map((ward) => (
                <option key={ward.id} value={ward.id}>
                  {ward.name}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
        {!addingCalling ? (
          <Field label="Calling">
            <div style={{ display: "flex", gap: "8px" }}>
              <select
                style={{ ...css.select, flex: 1 }}
                value={inviteDraft.calling}
                onChange={(event) =>
                  setInviteDraft((previous) => ({ ...previous, calling: event.target.value }))
                }
              >
                <option value="">Select a calling</option>
                {initialCallingOptions.map((calling) => (
                  <option key={calling} value={calling}>
                    {calling}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setAddingCalling(true)}
                style={css.btn("ghost")}
              >
                New
              </button>
            </div>
          </Field>
        ) : (
          <Field label="New Calling">
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                style={{ ...css.input, flex: 1 }}
                value={inviteDraft.newCalling}
                onChange={(event) =>
                  setInviteDraft((previous) => ({ ...previous, newCalling: event.target.value }))
                }
                placeholder="Assistant Camp Director"
              />
              <button
                type="button"
                onClick={() => setAddingCalling(false)}
                style={css.btn("ghost")}
              >
                Use List
              </button>
            </div>
          </Field>
        )}
        <button
          onClick={submitInvite}
          style={{ ...css.btn(), width: "100%", justifyContent: "center", padding: "12px" }}
          disabled={submittingInvite}
        >
          <Icon name="mail" size={16} color="#1a1612" />
          {submittingInvite
            ? "Sending..."
            : inviteTarget
              ? "Confirm Invite Send Again"
              : "Confirm Invite Send"}
        </button>
      </Modal>
    </>
  );
}
