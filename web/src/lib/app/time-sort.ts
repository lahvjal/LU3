/** Parse agenda-style time labels e.g. "7:00 AM", "12:30 PM" for sorting and timestamps. */

export type ParsedTimeLabel = { hour24: number; minutes: number };

/** Normalize pasted or typed time strings before parsing. */
export function normalizeTimeLabelInput(raw: string): string {
  return raw
    .trim()
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ");
}

function parse24HourTime(timeLabel: string): ParsedTimeLabel | null {
  const match = timeLabel.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return { hour24: hours, minutes };
}

function parse12HourTime(timeLabel: string): ParsedTimeLabel | null {
  const match = timeLabel.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridian = match[3].toUpperCase();

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 1 ||
    hours > 12 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  const hour24 = meridian === "PM" ? (hours % 12) + 12 : hours % 12;
  return { hour24, minutes };
}

/** Stable display form for agenda / meal times (12-hour clock). */
export function formatTimeLabel12h(parsed: ParsedTimeLabel): string {
  const { hour24, minutes } = parsed;
  const period = hour24 >= 12 ? "PM" : "AM";
  const h12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${h12}:${String(minutes).padStart(2, "0")} ${period}`;
}

export function parseTimeLabel(rawTimeLabel: string): ParsedTimeLabel | null {
  const timeLabel = normalizeTimeLabelInput(rawTimeLabel);
  if (!timeLabel) {
    return null;
  }

  const h12 = parse12HourTime(timeLabel);
  if (h12) {
    return h12;
  }

  return parse24HourTime(timeLabel);
}

/** Minutes from midnight for ascending sort; unparsed labels sort last. */
export function timeLabelSortKey(timeLabel: string): number {
  const parsed = parseTimeLabel(timeLabel);
  if (!parsed) {
    return 24 * 60 + 9999;
  }
  return parsed.hour24 * 60 + parsed.minutes;
}
