export default function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button type="submit" className="text-sm rounded-md border border-brand-primary/40 px-3 py-1 font-medium">
        Sign out
      </button>
    </form>
  );
}
