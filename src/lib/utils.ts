import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/) // split by one OR MORE whitespace characters
    .map((part) => part[0].toUpperCase())
    .join("");
}

export function timeAgo(date: Date, locale = "tr") {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // units in ms
  const SEC = 1000;
  const MIN = SEC * 60;
  const HR = MIN * 60;
  const DAY = HR * 24;

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  // just now
  if (diffMs < MIN) {
    const seconds = Math.floor(diffMs / SEC);
    return seconds < 5 ? "şimdi" : rtf.format(-seconds, "second");
  }

  // minutes
  if (diffMs < HR) {
    const minutes = Math.floor(diffMs / MIN);
    return rtf.format(-minutes, "minute");
  }

  // hours
  if (diffMs < DAY) {
    const hours = Math.floor(diffMs / HR);
    return rtf.format(-hours, "hour");
  }

  // days
  const days = Math.floor(diffMs / DAY);
  return rtf.format(-days, "day");
}
