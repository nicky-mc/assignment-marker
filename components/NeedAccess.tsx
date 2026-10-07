// "Need access?" line. Shown only when NEXT_PUBLIC_SUPPORT_CONTACT is set (an email address or a web address).
export default function NeedAccess() {
  const contact = process.env.NEXT_PUBLIC_SUPPORT_CONTACT?.trim();
  if (!contact) return null;
  const href = /^https?:\/\//i.test(contact) ? contact : /^[^\s@]+@[^\s@]+$/.test(contact) ? `mailto:${contact}` : null;
  return (
    <p className="text-sm text-ink-2">
      Need access? Contact{" "}
      {href ? (
        <a href={href} className="font-medium text-ink underline">
          {contact}
        </a>
      ) : (
        <span className="font-medium text-ink">{contact}</span>
      )}
      .
    </p>
  );
}
