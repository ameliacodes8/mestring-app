/**
 * USER SWITCHER - FOR TESTING ONLY
 * 
 * Allows switching between demo users to test different roles
 * without enabling full authentication.
 * 
 * Remove or hide this component before production!
 */

import { useState } from "react";

const DEMO_USERS = [
  { id: "demo-parent", name: "Demo Parent", role: "parent" },
  { id: "child-1", name: "Demo Child", role: "child" },
];

export function UserSwitcher() {
  // Initialize localStorage with default user if not set
  if (!localStorage.getItem("demo-user-id")) {
    localStorage.setItem("demo-user-id", "child-1");
    localStorage.setItem("demo-user-role", "child");
  }
  
  const [currentUser, setCurrentUser] = useState(DEMO_USERS[1]); // Start as child

  const handleSwitch = (user: typeof DEMO_USERS[0]) => {
    setCurrentUser(user);
    
    // Store in localStorage so it persists across page refreshes
    localStorage.setItem("demo-user-id", user.id);
    localStorage.setItem("demo-user-role", user.role);
    
    // Reload page to apply changes throughout the app
    window.location.reload();
  };

  // Get current user from localStorage if available
  const storedUserId = localStorage.getItem("demo-user-id");
  const storedRole = localStorage.getItem("demo-user-role");
  
  const activeUser = storedUserId 
    ? DEMO_USERS.find(u => u.id === storedUserId) || currentUser
    : currentUser;

  return (
    <div className="relative">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600">Testing as:</span>
        <select
          value={activeUser.id}
          onChange={(e) => {
            const user = DEMO_USERS.find((u) => u.id === e.target.value);
            if (user) handleSwitch(user);
          }}
          className="input text-sm py-1 px-2 min-h-0"
        >
          {DEMO_USERS.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.role})
            </option>
          ))}
        </select>
      </div>
      <div className="absolute top-full right-0 mt-1 text-xs text-gray-500 whitespace-nowrap">
        For testing only
      </div>
    </div>
  );
}
