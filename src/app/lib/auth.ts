/** Simulated identities only. Passwords are validated for UX, never saved or sent. */
import { changeDemoState, demoId, readDemoState, type DemoUser } from "./mockStore";
export type { DemoUser as User } from "./mockStore";

type Session = { user: DemoUser };
type AuthEvent = "SIGNED_IN" | "SIGNED_OUT" | "USER_UPDATED";
type Listener = (event: AuthEvent, session: Session | null) => void;
const listeners = new Set<Listener>();

function session(): Session | null {
  const state = readDemoState();
  const user = state.users.find((u) => u.id === state.sessionUserId);
  return user ? { user } : null;
}
function emit(event: AuthEvent) { listeners.forEach((listener) => listener(event, session())); }
function result(error: string | null = null) {
  const current = session();
  return { data: { session: current, user: current?.user ?? null }, error: error ? new Error(error) : null };
}
function validEmail(email: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

export const authService = {
  getSession() { return Promise.resolve({ data: { session: session() } }); },
  onAuthStateChange(listener: Listener) {
    listeners.add(listener);
    return { data: { subscription: { unsubscribe() { listeners.delete(listener); } } } };
  },
  signInWithPassword({ email, password }: { email: string; password: string }) {
    const normalized = email.trim().toLowerCase();
    if (!validEmail(normalized) || password.length < 6) return Promise.resolve(result("Use a valid demo email and any password of at least 6 characters."));
    changeDemoState((s) => {
      let user = s.users.find((u) => u.email === normalized);
      if (!user) { user = { id: demoId(), email: normalized, user_metadata: {}, created_at: new Date().toISOString(), email_confirmed_at: new Date().toISOString() }; s.users.push(user); }
      user.last_sign_in_at = new Date().toISOString();
      s.sessionUserId = user.id;
    });
    emit("SIGNED_IN");
    return Promise.resolve(result());
  },
  signUp({ email, password, options }: { email: string; password: string; options?: { data?: { full_name?: string } } }) {
    const normalized = email.trim().toLowerCase();
    if (!validEmail(normalized)) return Promise.resolve(result("Enter a valid email address."));
    if (password.length < 6) return Promise.resolve(result("Password should be at least 6 characters."));
    if (readDemoState().users.some((u) => u.email === normalized)) return Promise.resolve(result("User already registered in this demo."));
    changeDemoState((s) => { const user = { id: demoId(), email: normalized, user_metadata: options?.data ?? {}, created_at: new Date().toISOString() }; s.users.push(user); s.sessionUserId = user.id; });
    emit("SIGNED_IN"); return Promise.resolve(result());
  },
  signOut() { changeDemoState((s) => { s.sessionUserId = null; }); emit("SIGNED_OUT"); return Promise.resolve({ error: null }); },
  updateUser({ data, password }: { data?: { full_name?: string }; password?: string }) {
    if (!session()) return Promise.resolve(result("No demo session is active."));
    if (password !== undefined && password.length < 6) return Promise.resolve(result("Password should be at least 6 characters."));
    changeDemoState((s) => { const user = s.users.find((u) => u.id === s.sessionUserId)!; if (data) user.user_metadata = { ...user.user_metadata, ...data }; });
    emit("USER_UPDATED"); return Promise.resolve(result());
  },
  resend({ email }: { type: "signup"; email: string }) {
    changeDemoState((s) => { const user = s.users.find((u) => u.email === email); if (user) user.email_confirmed_at = new Date().toISOString(); });
    emit("USER_UPDATED"); return Promise.resolve({ error: null });
  },
  resetPasswordForEmail(email: string) { return Promise.resolve({ error: validEmail(email) ? null : new Error("Enter a valid email address.") }); },
};
