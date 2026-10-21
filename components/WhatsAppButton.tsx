import { LINKS } from "@/lib/site";

/** Opens WhatsApp with a friendly message already typed. Disabled until a
 *  number is set in lib/site.ts. */
export default function WhatsAppButton({
  label,
  message,
  variant = "solid",
}: {
  label: string;
  message: string;
  variant?: "solid" | "ghost";
}) {
  const icon = (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.7-.3-1.4-.7-2-1.3-.6-.5-1-1.1-1.4-1.8-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3c-.3.3-1 1-1 2.3s1 2.7 1.2 2.9c.1.2 2 3.1 4.9 4.3 1.8.8 2.5.8 3.4.7.6-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  );
  if (!LINKS.whatsapp) {
    return (
      <span className={`pill pill--${variant} pill--disabled`} title="WhatsApp number not set yet">
        {icon}
        {label}
      </span>
    );
  }
  const sep = LINKS.whatsapp.includes("?") ? "&" : "?";
  return (
    <a className={`pill pill--${variant}`} href={`${LINKS.whatsapp}${sep}text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
      {icon}
      {label}
    </a>
  );
}
