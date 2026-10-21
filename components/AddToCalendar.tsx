"use client";

// "Add to calendar" for the next Sunday service: Google Calendar link, or an
// .ics file for Apple Calendar / Outlook. Built on click, so it's always the
// coming Sunday.

import { useEffect, useRef, useState } from "react";
import { CHURCH, LINKS } from "@/lib/site";
import { icsStamp, nextService } from "@/lib/sunday";

const TITLE = "Sunday at Evergreen City Community";

function details() {
  return `Doors open ${CHURCH.arriveFrom}, worship starts ${CHURCH.serviceTime}, done by ${CHURCH.endsBy}. Come as you are.\n\nDirections: ${LINKS.maps}`;
}
function location() {
  return `${CHURCH.venue}, ${CHURCH.area}`;
}

function googleUrl() {
  const { start, end } = nextService();
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: TITLE,
    dates: `${icsStamp(start)}/${icsStamp(end)}`,
    details: details(),
    location: location(),
    ctz: "Asia/Kolkata",
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

function downloadIcs() {
  const { start, end } = nextService();
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Evergreen City Community//Plan a visit//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:ecc-${icsStamp(start)}@evergreencitycommunity.com`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${esc(TITLE)}`,
    `LOCATION:${esc(location())}`,
    `DESCRIPTION:${esc(details())}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Church this morning",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "evergreen-sunday.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function AddToCalendar({ variant = "solid" }: { variant?: "solid" | "ghost" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div className="cal" ref={ref}>
      <button type="button" className={`pill pill--${variant}`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <CalendarIcon />
        Add to calendar
      </button>
      {open && (
        <div className="cal__menu" role="menu">
          <a role="menuitem" href={googleUrl()} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
            Google Calendar
          </a>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              downloadIcs();
              setOpen(false);
            }}
          >
            Apple / Outlook (.ics)
          </button>
        </div>
      )}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}
