export type IconName = "bookmark" | "clock" | "walk" | "pin" | "ticket" | "info" | "sparkle" | "chevron";

export function Icon({ name }: { name: IconName }) {
  const paths = {
    bookmark: <path d="M6 3.75h12v16.5l-6-3.8-6 3.8V3.75Z" />,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
    walk: <><circle cx="13" cy="4.5" r="2" /><path d="m10.5 9 2.5-2 2.5 2.5 2.5 1M13 7l-1 5 3 3.5M12 12l-3 3-2 4M15 15.5l2.5 4" /></>,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.2" /></>,
    ticket: <path d="M4 7h16v4a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4V7Zm8 0v11" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></>,
    sparkle: <path d="m12 2 1.3 4.7L18 8l-4.7 1.3L12 14l-1.3-4.7L6 8l4.7-1.3L12 2Zm6 11 .7 2.3L21 16l-2.3.7L18 19l-.7-2.3L15 16l2.3-.7L18 13Z" />,
    chevron: <path d="m7 10 5 5 5-5" />,
  };
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
