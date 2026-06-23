import { jsPDF } from "jspdf";

type WardRosterPdfWard = {
  id: string;
  name: string;
  campers: Array<{ name: string }>;
};

type WardRosterPdfLeader = {
  name: string;
  role_label?: string | null;
  ward_id?: string | null;
  status?: string;
};

const PAGE_MARGIN = 54;
const LINE_HEIGHT = 14;
const SECTION_GAP = 10;
const WARD_GAP = 18;

function groupLeadersByWard(leaders: WardRosterPdfLeader[]) {
  const map: Record<string, WardRosterPdfLeader[]> = {};
  leaders.forEach((leader) => {
    if (leader.ward_id && leader.status === "active") {
      if (!map[leader.ward_id]) map[leader.ward_id] = [];
      map[leader.ward_id].push(leader);
    }
  });
  return map;
}

function formatGeneratedDate() {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

export function downloadWardRostersPdf(input: {
  wards: WardRosterPdfWard[];
  leaders: WardRosterPdfLeader[];
  filename?: string;
}) {
  const { wards, leaders, filename = "ward-rosters.pdf" } = input;
  const leadersByWard = groupLeadersByWard(leaders);
  const totalYoungMen = wards.reduce((sum, ward) => sum + ward.campers.length, 0);
  const totalLeaders = Object.values(leadersByWard).reduce(
    (sum, wardLeaders) => sum + wardLeaders.length,
    0,
  );

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;
  let y = PAGE_MARGIN;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - PAGE_MARGIN) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
  };

  const writeLines = (lines: string[], indent = 0, fontSize = 11) => {
    doc.setFontSize(fontSize);
    lines.forEach((line) => {
      const wrapped = doc.splitTextToSize(line, contentWidth - indent);
      wrapped.forEach((wrappedLine: string) => {
        ensureSpace(LINE_HEIGHT);
        doc.text(wrappedLine, PAGE_MARGIN + indent, y);
        y += LINE_HEIGHT;
      });
    });
  };

  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Ward Rosters", PAGE_MARGIN, y);
  y += 28;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text("Lehi Utah 3rd Stake Young Men Camp · June 15–19, 2026", PAGE_MARGIN, y);
  y += LINE_HEIGHT;
  doc.text(
    `${wards.length} wards · ${totalLeaders} leaders · ${totalYoungMen} young men · Generated ${formatGeneratedDate()}`,
    PAGE_MARGIN,
    y,
  );
  y += WARD_GAP;

  wards.forEach((ward, wardIndex) => {
    const wardLeaders = leadersByWard[ward.id] || [];
    const memberCount = wardLeaders.length + ward.campers.length;

    ensureSpace(LINE_HEIGHT * 3);
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(ward.name, PAGE_MARGIN, y);
    y += LINE_HEIGHT + 2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`${memberCount} ${memberCount === 1 ? "member" : "members"}`, PAGE_MARGIN, y);
    y += LINE_HEIGHT + SECTION_GAP;

    if (wardLeaders.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`Leaders (${wardLeaders.length})`, PAGE_MARGIN, y);
      y += LINE_HEIGHT;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      wardLeaders.forEach((leader) => {
        const label = leader.role_label
          ? `${leader.name} — ${leader.role_label}`
          : leader.name;
        writeLines([label], 12);
      });
      y += SECTION_GAP;
    }

    if (ward.campers.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      ensureSpace(LINE_HEIGHT);
      doc.text(`Young Men (${ward.campers.length})`, PAGE_MARGIN, y);
      y += LINE_HEIGHT;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      ward.campers.forEach((camper) => {
        writeLines([camper.name], 12);
      });
    } else {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      ensureSpace(LINE_HEIGHT);
      doc.text("No young men registered yet.", PAGE_MARGIN + 12, y);
      y += LINE_HEIGHT;
    }

    if (wardIndex < wards.length - 1) {
      y += WARD_GAP;
      ensureSpace(LINE_HEIGHT);
      doc.setDrawColor(210, 210, 210);
      doc.line(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN, y);
      y += WARD_GAP;
    }
  });

  doc.save(filename);
}
