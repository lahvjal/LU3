"use client";

import {
  useState,
  type DragEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { CampSidebar } from "@/components/camp-design-app";
import { signOutCampAction } from "@/lib/app/camp-design-actions";
import {
  addRegistrationListEntryAction,
  sendRegistrationInviteAction,
  updateRegistrationListEntryAction,
  type RegisterActionResult,
} from "./actions";

type WardOption = {
  id: string;
  name: string;
};

type ShirtSizeOption = {
  code: string;
  label: string;
};

type RosterRow = {
  rosterId: string;
  participantId: string;
  wardId: string;
  wardName: string;
  status:
    | "not_invited_yet"
    | "invited"
    | "pending"
    | "confirmed"
    | "declined"
    | "waitlist"
    | "cancelled";
  fullName: string;
  age: number | null;
  shirtSize: string | null;
  youthEmail: string | null;
  preferredParentEmail: string | null;
  parentName: string | null;
  parentPhone: string | null;
  contactRoute: "parent_email" | "youth_email";
  latestInviteTarget: "youth" | "parent" | null;
  latestInviteEmail: string | null;
  latestInviteStatus: "sent" | "accepted" | "revoked" | null;
  latestInviteSentAt: string | null;
};

type RegisterDesignPageProps = {
  initialRoster: RosterRow[];
  initialWards: WardOption[];
  initialShirtSizes: ShirtSizeOption[];
  canManageRegistrations: boolean;
  canReorderColumns: boolean;
  initialProfile: {
    displayName: string;
    email: string;
    avatarUrl: string | null;
  };
};

type RegistrationColumnKey =
  | "camper"
  | "age"
  | "ward"
  | "details"
  | "invite"
  | "status"
  | "actions";

type ColumnWidthMap = Partial<Record<RegistrationColumnKey, number>>;

type InviteDraft = {
  recipientEmail: string;
  isParentEmail: boolean;
};

type EditDraft = {
  childName: string;
  age: string;
  wardId: string;
  shirtSizeCode: string;
  parentName: string;
  parentPhone: string;
  youthEmail: string;
  contactRoute: "parent_email" | "youth_email";
};

type AlertState = {
  type: "success" | "error";
  message: string;
};

const DEFAULT_SHIRT_SIZES: ShirtSizeOption[] = [
  { code: "YS", label: "Youth Small" },
  { code: "YM", label: "Youth Medium" },
  { code: "YL", label: "Youth Large" },
  { code: "S", label: "Small" },
  { code: "M", label: "Medium" },
  { code: "L", label: "Large" },
  { code: "XL", label: "XL" },
  { code: "2XL", label: "2XL" },
  { code: "3XL", label: "3XL" },
];

const REGISTRATION_COLUMNS: { key: RegistrationColumnKey; label: string }[] = [
  { key: "camper", label: "Camper" },
  { key: "age", label: "Age" },
  { key: "ward", label: "Ward" },
  { key: "details", label: "Details" },
  { key: "invite", label: "Invite" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" },
];

function defaultInviteDraftForRow(row: RosterRow): InviteDraft {
  return {
    recipientEmail:
      row.contactRoute === "parent_email"
        ? row.preferredParentEmail ?? ""
        : row.youthEmail ?? "",
    isParentEmail: row.contactRoute === "parent_email",
  };
}

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

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  not_invited_yet: { bg: "#2f2a22", text: "#b4a592" },
  invited: { bg: T.yellowBg, text: T.yellow },
  pending: { bg: T.purpleBg, text: T.purple },
  confirmed: { bg: T.greenBg, text: T.green },
  declined: { bg: T.redBg, text: T.red },
  waitlist: { bg: "#2f2a22", text: "#ceb682" },
  cancelled: { bg: "#2f2a22", text: "#ceb682" },
  sent: { bg: T.yellowBg, text: T.yellow },
  accepted: { bg: T.greenBg, text: T.green },
  revoked: { bg: T.redBg, text: T.red },
};

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
    clipboard: (
      <>
        <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" />
      </>
    ),
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
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 113 3L7 19l-4 1 1-4z" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" style={s} xmlns="http://www.w3.org/2000/svg">
      {P[name] || P.clipboard}
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
        <Icon name="clipboard" size={26} color={T.accent} />
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

function formatInviteDate(value: string | null) {
  if (!value) {
    return "No invite yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatStatusLabel(value: string) {
  return value.replaceAll("_", " ");
}

function normalizeActionMessage(result: RegisterActionResult) {
  return result.ok ? null : result.error;
}

export default function RegisterDesignPage({
  initialRoster,
  initialWards,
  initialShirtSizes,
  canManageRegistrations,
  canReorderColumns,
  initialProfile,
}: RegisterDesignPageProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalRow, setDetailsModalRow] = useState<RosterRow | null>(null);
  const [inviteModalRow, setInviteModalRow] = useState<RosterRow | null>(null);
  const [inviteDraft, setInviteDraft] = useState<InviteDraft>({
    recipientEmail: "",
    isParentEmail: true,
  });
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [invitingRowId, setInvitingRowId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [alertState, setAlertState] = useState<AlertState | null>(null);
  const [quickAdd, setQuickAdd] = useState({
    childName: "",
    age: "",
    wardId: initialWards[0]?.id ?? "",
  });
  const [editModalRow, setEditModalRow] = useState<RosterRow | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [columnOrder, setColumnOrder] = useState<RegistrationColumnKey[]>(
    REGISTRATION_COLUMNS.map((column) => column.key),
  );
  const [columnWidths, setColumnWidths] = useState<ColumnWidthMap>({});
  const [draggedColumn, setDraggedColumn] = useState<RegistrationColumnKey | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<RegistrationColumnKey | null>(null);
  const [resizingColumn, setResizingColumn] = useState<RegistrationColumnKey | null>(null);
  const shirtSizeOptions =
    initialShirtSizes.length > 0 ? initialShirtSizes : DEFAULT_SHIRT_SIZES;

  const moveColumn = (
    columns: RegistrationColumnKey[],
    source: RegistrationColumnKey,
    target: RegistrationColumnKey,
  ) => {
    const sourceIndex = columns.indexOf(source);
    const targetIndex = columns.indexOf(target);

    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
      return columns;
    }

    const nextColumns = [...columns];
    const [movedColumn] = nextColumns.splice(sourceIndex, 1);
    nextColumns.splice(targetIndex, 0, movedColumn);
    return nextColumns;
  };

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

  const handleAddToList = async () => {
    setSubmittingAdd(true);
    const result = await addRegistrationListEntryAction({
      childName: quickAdd.childName,
      age: Number(quickAdd.age),
      wardId: quickAdd.wardId,
    });
    setSubmittingAdd(false);

    const errorMessage = normalizeActionMessage(result);
    if (errorMessage) {
      setAlertState({ type: "error", message: errorMessage });
      return;
    }

    setAlertState({ type: "success", message: "Camper added to the registration list." });
    setQuickAdd({
      childName: "",
      age: "",
      wardId: initialWards[0]?.id ?? "",
    });
    setModalOpen(false);
    router.refresh();
  };

  const openInviteModal = (row: RosterRow) => {
    setInviteModalRow(row);
    setInviteDraft(defaultInviteDraftForRow(row));
  };

  const closeInviteModal = () => {
    if (inviteModalRow && invitingRowId === inviteModalRow.rosterId) {
      return;
    }

    setInviteModalRow(null);
  };

  const handleConfirmInvite = async () => {
    if (!inviteModalRow) {
      return;
    }

    setInvitingRowId(inviteModalRow.rosterId);
    const result = await sendRegistrationInviteAction({
      rosterId: inviteModalRow.rosterId,
      participantId: inviteModalRow.participantId,
      recipientEmail: inviteDraft.recipientEmail,
      isParentEmail: inviteDraft.isParentEmail,
    });
    setInvitingRowId(null);

    const errorMessage = normalizeActionMessage(result);
    if (errorMessage) {
      setAlertState({ type: "error", message: errorMessage });
      return;
    }

    setAlertState({ type: "success", message: "Invite sent." });
    setInviteModalRow(null);
    router.refresh();
  };

  const openEditRow = (row: RosterRow) => {
    setEditModalRow(row);
    setEditDraft({
      childName: row.fullName,
      age: row.age ? String(row.age) : "",
      wardId: row.wardId,
      shirtSizeCode: row.shirtSize ?? "",
      parentName: row.parentName ?? "",
      parentPhone: row.parentPhone ?? "",
      youthEmail: row.youthEmail ?? "",
      contactRoute: row.contactRoute,
    });
  };

  const closeEditModal = () => {
    if (savingEdit) {
      return;
    }

    setEditModalRow(null);
    setEditDraft(null);
  };

  const handleSaveEdit = async () => {
    if (!editDraft || !editModalRow) {
      return;
    }

    setSavingEdit(true);
    const result = await updateRegistrationListEntryAction({
      rosterId: editModalRow.rosterId,
      participantId: editModalRow.participantId,
      childName: editDraft.childName,
      age: Number(editDraft.age),
      wardId: editDraft.wardId,
      shirtSizeCode: editDraft.shirtSizeCode,
      parentName: editDraft.parentName,
      parentPhone: editDraft.parentPhone,
      youthEmail: editDraft.youthEmail,
      contactRoute: editDraft.contactRoute,
    });
    setSavingEdit(false);

    const errorMessage = normalizeActionMessage(result);
    if (errorMessage) {
      setAlertState({ type: "error", message: errorMessage });
      return;
    }

    setAlertState({ type: "success", message: "Registration row updated." });
    setEditModalRow(null);
    setEditDraft(null);
    router.refresh();
  };

  const inviteModalSending =
    inviteModalRow !== null && invitingRowId === inviteModalRow.rosterId;

  const handleColumnDragStart = (
    event: DragEvent<HTMLTableHeaderCellElement>,
    columnKey: RegistrationColumnKey,
  ) => {
    if (!canReorderColumns) {
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", columnKey);
    setDraggedColumn(columnKey);
    setDragOverColumn(null);
  };

  const handleColumnDragOver = (
    event: DragEvent<HTMLTableHeaderCellElement>,
    columnKey: RegistrationColumnKey,
  ) => {
    if (!canReorderColumns || !draggedColumn || draggedColumn === columnKey) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnKey);
  };

  const handleColumnDrop = (
    event: DragEvent<HTMLTableHeaderCellElement>,
    columnKey: RegistrationColumnKey,
  ) => {
    if (!canReorderColumns || !draggedColumn) {
      return;
    }

    event.preventDefault();
    setColumnOrder((previous) => moveColumn(previous, draggedColumn, columnKey));
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const clearColumnDragState = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleColumnResizeStart = (
    event: ReactMouseEvent<HTMLDivElement>,
    columnKey: RegistrationColumnKey,
  ) => {
    if (!canReorderColumns) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const headerCell = event.currentTarget.parentElement as HTMLTableHeaderCellElement | null;
    const startWidth = columnWidths[columnKey] ?? headerCell?.getBoundingClientRect().width ?? 120;
    const startX = event.clientX;
    setResizingColumn(columnKey);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const nextWidth = Math.max(72, Math.round(startWidth + delta));
      setColumnWidths((previous) => ({ ...previous, [columnKey]: nextWidth }));
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
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
        page="registration"
        onNavigate={goToPage}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        onSignOut={handleSignOut}
        signingOut={signingOut}
        profile={profile}
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
            title="Registration List"
            subtitle={`${initialRoster.length} campers in registration workflow`}
            action={
              canManageRegistrations ? (
                <button onClick={() => setModalOpen(true)} style={css.btn()}>
                  <Icon name="plus" size={16} color="#1a1612" /> Add Camper
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
          {canManageRegistrations && canReorderColumns ? (
            <p style={{ color: T.textDim, fontSize: "12px", marginBottom: "10px" }}>
              Drag column labels to rearrange this table.
            </p>
          ) : null}

          {!canManageRegistrations ? (
            <div style={css.card}>
              <p style={{ color: T.textMuted, lineHeight: 1.6 }}>
                Leader access is required to manage the registration list and send invites.
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
                }}
              >
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    {columnOrder.map((columnKey) => {
                      const heading =
                        REGISTRATION_COLUMNS.find((column) => column.key === columnKey)?.label ??
                        columnKey;
                      const isDragSource = draggedColumn === columnKey;
                      const isDropTarget = dragOverColumn === columnKey;
                      const explicitWidth = columnWidths[columnKey];

                      return (
                      <th
                        key={columnKey}
                        draggable={canReorderColumns}
                        onDragStart={(event) => handleColumnDragStart(event, columnKey)}
                        onDragOver={(event) => handleColumnDragOver(event, columnKey)}
                        onDrop={(event) => handleColumnDrop(event, columnKey)}
                        onDragEnd={clearColumnDragState}
                        onDragLeave={() => {
                          if (dragOverColumn === columnKey) {
                            setDragOverColumn(null);
                          }
                        }}
                        style={{
                          padding: "11px 14px",
                          textAlign: "left",
                          color: T.textMuted,
                          fontSize: "11px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          fontWeight: 600,
                          position: "relative",
                          cursor: canReorderColumns ? "grab" : "default",
                          opacity: isDragSource ? 0.5 : 1,
                          boxShadow: isDropTarget ? `inset 0 0 0 1px ${T.accent}` : "none",
                          width: explicitWidth ? `${explicitWidth}px` : undefined,
                          minWidth: explicitWidth ? `${explicitWidth}px` : "max-content",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {heading}
                        {canReorderColumns ? (
                          <span style={{ marginLeft: "6px", color: T.textDim }}>↕</span>
                        ) : null}
                        {canReorderColumns ? (
                          <div
                            onMouseDown={(event) => handleColumnResizeStart(event, columnKey)}
                            style={{
                              position: "absolute",
                              top: 0,
                              right: 0,
                              bottom: 0,
                              width: "8px",
                              cursor: "col-resize",
                              background:
                                resizingColumn === columnKey ? `${T.accent}55` : "transparent",
                            }}
                          />
                        ) : null}
                      </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {initialRoster.map((row, index) => (
                    <FragmentRow
                      key={row.rosterId}
                      row={row}
                      index={index}
                      columnWidths={columnWidths}
                      columnOrder={columnOrder}
                      onOpenDetailsModal={() => setDetailsModalRow(row)}
                      onOpenInviteModal={() => openInviteModal(row)}
                      inviting={invitingRowId === row.rosterId}
                      onEdit={() => openEditRow(row)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Camper to List">
        <Field label="Camper Name">
          <input
            style={css.input}
            value={quickAdd.childName}
            onChange={(event) =>
              setQuickAdd((previous) => ({ ...previous, childName: event.target.value }))
            }
            placeholder="Full name"
          />
        </Field>
        <Field label="Age">
          <input
            style={css.input}
            type="number"
            value={quickAdd.age}
            onChange={(event) =>
              setQuickAdd((previous) => ({ ...previous, age: event.target.value }))
            }
            placeholder="12"
          />
        </Field>
        <Field label="Ward">
          <select
            style={css.select}
            value={quickAdd.wardId}
            onChange={(event) =>
              setQuickAdd((previous) => ({ ...previous, wardId: event.target.value }))
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
        <button
          onClick={handleAddToList}
          style={{ ...css.btn(), width: "100%", justifyContent: "center", padding: "12px" }}
          disabled={submittingAdd}
        >
          {submittingAdd ? "Adding..." : "Add to Registration List"}
        </button>
      </Modal>

      <Modal
        open={Boolean(inviteModalRow)}
        onClose={closeInviteModal}
        title={
          inviteModalRow
            ? `Send Invite - ${inviteModalRow.fullName}`
            : "Send Invite"
        }
      >
        <Field label="Invite Email">
          <input
            style={css.input}
            value={inviteDraft.recipientEmail}
            onChange={(event) =>
              setInviteDraft((previous) => ({
                ...previous,
                recipientEmail: event.target.value,
              }))
            }
            placeholder="recipient@email.com"
          />
        </Field>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: T.textMuted,
            fontSize: "14px",
            marginBottom: "18px",
          }}
        >
          <input
            type="checkbox"
            checked={inviteDraft.isParentEmail}
            onChange={(event) =>
              setInviteDraft((previous) => ({
                ...previous,
                isParentEmail: event.target.checked,
              }))
            }
          />
          Parent email (uncheck for youth email)
        </label>
        <button
          onClick={handleConfirmInvite}
          style={{ ...css.btn(), width: "100%", justifyContent: "center", padding: "12px" }}
          disabled={inviteModalSending}
        >
          <Icon name="mail" size={16} color="#1a1612" />
          {inviteModalSending ? "Sending..." : "Confirm Invite Send"}
        </button>
      </Modal>

      <Modal
        open={Boolean(detailsModalRow)}
        onClose={() => setDetailsModalRow(null)}
        title={detailsModalRow ? `Details - ${detailsModalRow.fullName}` : "Details"}
      >
        {detailsModalRow ? (
          <div style={{ display: "grid", gap: "12px", color: T.textMuted, fontSize: "14px" }}>
            <div>Camper: {detailsModalRow.fullName}</div>
            <div>Age: {detailsModalRow.age ?? "Missing"}</div>
            <div>Ward: {detailsModalRow.wardName}</div>
            <div>Shirt size: {detailsModalRow.shirtSize || "Missing"}</div>
            <div>Youth email: {detailsModalRow.youthEmail || "Missing"}</div>
            <div>Parent email: {detailsModalRow.preferredParentEmail || "Missing"}</div>
            <div>Parent name: {detailsModalRow.parentName || "Missing"}</div>
            <div>Parent phone: {detailsModalRow.parentPhone || "Missing"}</div>
            <div>
              Contact route:{" "}
              {detailsModalRow.contactRoute === "parent_email"
                ? "Parent email"
                : "Youth email"}
            </div>
            <div>
              Latest invite: {detailsModalRow.latestInviteEmail || "No invite yet"} (
              {detailsModalRow.latestInviteStatus || "none"})
            </div>
            <div>Latest invite sent: {formatInviteDate(detailsModalRow.latestInviteSentAt)}</div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(editModalRow)}
        onClose={closeEditModal}
        title={editModalRow ? `Edit Details - ${editModalRow.fullName}` : "Edit Details"}
      >
        {editDraft ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <input
                style={css.input}
                value={editDraft.childName}
                onChange={(event) =>
                  setEditDraft((previous) =>
                    previous ? { ...previous, childName: event.target.value } : previous,
                  )
                }
                placeholder="Camper name"
              />
              <input
                style={css.input}
                type="number"
                value={editDraft.age}
                onChange={(event) =>
                  setEditDraft((previous) =>
                    previous ? { ...previous, age: event.target.value } : previous,
                  )
                }
                placeholder="Age"
              />
              <select
                style={css.select}
                value={editDraft.wardId}
                onChange={(event) =>
                  setEditDraft((previous) =>
                    previous ? { ...previous, wardId: event.target.value } : previous,
                  )
                }
              >
                {initialWards.map((ward) => (
                  <option key={ward.id} value={ward.id}>
                    {ward.name}
                  </option>
                ))}
              </select>
              <select
                style={css.select}
                value={editDraft.shirtSizeCode}
                onChange={(event) =>
                  setEditDraft((previous) =>
                    previous ? { ...previous, shirtSizeCode: event.target.value } : previous,
                  )
                }
              >
                <option value="">Shirt size</option>
                {shirtSizeOptions.map((size) => (
                  <option key={size.code} value={size.code}>
                    {size.code} - {size.label}
                  </option>
                ))}
              </select>
              <input
                style={css.input}
                value={editDraft.youthEmail}
                onChange={(event) =>
                  setEditDraft((previous) =>
                    previous ? { ...previous, youthEmail: event.target.value } : previous,
                  )
                }
                placeholder="Youth email"
              />
              <input
                style={css.input}
                value={editDraft.parentName}
                onChange={(event) =>
                  setEditDraft((previous) =>
                    previous ? { ...previous, parentName: event.target.value } : previous,
                  )
                }
                placeholder="Parent name"
              />
              <input
                style={css.input}
                value={editDraft.parentPhone}
                onChange={(event) =>
                  setEditDraft((previous) =>
                    previous ? { ...previous, parentPhone: event.target.value } : previous,
                  )
                }
                placeholder="Parent phone"
              />
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: T.textMuted,
                  fontSize: "12px",
                  padding: "8px",
                }}
              >
                <input
                  type="checkbox"
                  checked={editDraft.contactRoute === "parent_email"}
                  onChange={(event) =>
                    setEditDraft((previous) =>
                      previous
                        ? {
                            ...previous,
                            contactRoute: event.target.checked
                              ? "parent_email"
                              : "youth_email",
                          }
                        : previous,
                    )
                  }
                />
                Default contact is parent email
              </label>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "12px" }}>
              <button onClick={handleSaveEdit} style={css.btn()} disabled={savingEdit}>
                {savingEdit ? "Saving..." : "Save"}
              </button>
              <button onClick={closeEditModal} style={css.btn("ghost")} disabled={savingEdit}>
                Cancel
              </button>
            </div>
          </>
        ) : null}
      </Modal>
    </>
  );
}

function FragmentRow({
  row,
  index,
  columnWidths,
  columnOrder,
  onOpenDetailsModal,
  onOpenInviteModal,
  inviting,
  onEdit,
}: {
  row: RosterRow;
  index: number;
  columnWidths: ColumnWidthMap;
  columnOrder: RegistrationColumnKey[];
  onOpenDetailsModal: () => void;
  onOpenInviteModal: () => void;
  inviting: boolean;
  onEdit: () => void;
}) {
  const statusColor = STATUS_COLORS[row.status] ?? { bg: "#2f2a22", text: "#ceb682" };
  const latestInviteColor = row.latestInviteStatus
    ? STATUS_COLORS[row.latestInviteStatus]
    : undefined;
  const sentInviteAlready = Boolean(row.latestInviteSentAt);
  const resendInvite = sentInviteAlready && row.status === "pending";
  const inviteButtonLabel = inviting
    ? "Sending..."
    : resendInvite
      ? "Send Again"
      : "Send Invite";

  const cellStyle = (
    columnKey: RegistrationColumnKey,
    baseStyle: Record<string, string | number>,
  ) => {
    const explicitWidth = columnWidths[columnKey];
    if (!explicitWidth) {
      return {
        ...baseStyle,
        minWidth: "max-content",
        whiteSpace: "nowrap" as const,
      };
    }

    return {
      ...baseStyle,
      width: `${explicitWidth}px`,
      minWidth: `${explicitWidth}px`,
      maxWidth: `${explicitWidth}px`,
    };
  };

  const renderColumnCell = (columnKey: RegistrationColumnKey) => {
    switch (columnKey) {
      case "camper":
        return (
          <td
            key={columnKey}
            style={cellStyle(columnKey, {
              padding: "11px 14px",
              fontWeight: 600,
              color: T.text,
            })}
          >
            {row.fullName}
          </td>
        );
      case "age":
        return (
          <td
            key={columnKey}
            style={cellStyle(columnKey, { padding: "11px 14px", color: T.textMuted })}
          >
            {row.age ?? "—"}
          </td>
        );
      case "ward":
        return (
          <td
            key={columnKey}
            style={cellStyle(columnKey, { padding: "11px 14px", color: T.textMuted })}
          >
            {row.wardName}
          </td>
        );
      case "details":
        return (
          <td key={columnKey} style={cellStyle(columnKey, { padding: "11px 14px" })}>
            <button onClick={onOpenDetailsModal} style={css.btn("ghost")}>
              Details
            </button>
          </td>
        );
      case "invite":
        return (
          <td key={columnKey} style={cellStyle(columnKey, { padding: "11px 14px" })}>
            <button onClick={onOpenInviteModal} style={css.btn()} disabled={inviting}>
              <Icon name="mail" size={14} color="#1a1612" />
              {inviteButtonLabel}
            </button>
          </td>
        );
      case "status":
        return (
          <td
            key={columnKey}
            style={cellStyle(columnKey, { padding: "11px 14px", color: T.textMuted })}
          >
            <div style={{ marginBottom: "6px" }}>
              <Badge bg={statusColor.bg} text={statusColor.text}>
            {formatStatusLabel(row.status)}
              </Badge>
            </div>
            {row.latestInviteStatus ? (
              <div style={{ color: T.textDim, fontSize: "12px" }}>
                <>
                  Invite:{" "}
                  <Badge bg={latestInviteColor?.bg} text={latestInviteColor?.text}>
                {formatStatusLabel(row.latestInviteStatus)}
                  </Badge>
                </>
              </div>
            ) : null}
          </td>
        );
      case "actions":
        return (
          <td key={columnKey} style={cellStyle(columnKey, { padding: "11px 14px" })}>
            <button onClick={onEdit} style={css.btn("ghost")}>
              <Icon name="edit" size={14} />
              Edit
            </button>
          </td>
        );
      default:
        return null;
    }
  };

  return (
    <tr
      style={{
        borderBottom: `1px solid ${T.border}`,
        background: index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
      }}
    >
      {columnOrder.map((columnKey) => renderColumnCell(columnKey))}
    </tr>
  );
}
