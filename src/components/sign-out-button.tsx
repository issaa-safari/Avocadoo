import { signOut } from "@/app/(app)/actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button className="button button-secondary" type="submit">
        Sign out
      </button>
    </form>
  );
}
