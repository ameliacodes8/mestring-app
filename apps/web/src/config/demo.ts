/**
 * Demo Mode Configuration
 * Centralized configuration for demo/testing mode
 * 
 * To disable demo mode:
 * 1. Set DEMO_MODE = false
 * 2. Re-enable auth in apps/api/src/index.js (uncomment line 28)
 * 3. Remove UserSwitcher from AuthGate.tsx
 */

export const DEMO_MODE = true;

export const DEMO_USERS = [
  { id: "demo-parent", name: "Demo Parent", role: "parent" },
  { id: "child-1", name: "Child 1", role: "child" },
] as const;

export const DEMO_FAMILY_ID = "demo-family";

/**
 * Get the current demo user from localStorage
 * Returns null if not in demo mode or no user selected
 */
export function getCurrentDemoUser() {
  if (!DEMO_MODE) return null;
  
  const id = localStorage.getItem("demo-user-id");
  const role = localStorage.getItem("demo-user-role") as "parent" | "child" | null;
  
  if (!id || !role) return null;
  
  return { id, role };
}

/**
 * Set the current demo user in localStorage
 */
export function setDemoUser(userId: string, userRole: "parent" | "child") {
  if (!DEMO_MODE) return;
  
  localStorage.setItem("demo-user-id", userId);
  localStorage.setItem("demo-user-role", userRole);
}

/**
 * Clear demo user from localStorage
 */
export function clearDemoUser() {
  localStorage.removeItem("demo-user-id");
  localStorage.removeItem("demo-user-role");
}
