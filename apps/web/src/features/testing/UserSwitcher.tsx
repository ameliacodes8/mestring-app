/**
 * USER SWITCHER - FOR TESTING ONLY
 * 
 * Allows switching between demo users to test different roles
 * without enabling full authentication.
 * 
 * Remove or hide this component before production!
 */

import { useState, useEffect } from "react";
import { DEMO_USERS, getCurrentDemoUser, setDemoUser } from "../../config/demo";

type DemoUser = typeof DEMO_USERS[number];

export function UserSwitcher() {
  const [currentUser, setCurrentUser] = useState<DemoUser>(DEMO_USERS[1]); // Start as child

  useEffect(() => {
    // Initialize localStorage with default user if not set
    const storedUser = getCurrentDemoUser();
    if (!storedUser) {
      setDemoUser("child-1", "child");
    } else {
      // Update state to match stored user
      const user = DEMO_USERS.find(u => u.id === storedUser.id);
      if (user) {
        setCurrentUser(user);
      }
    }
  }, []);

  const handleSwitch = (user: DemoUser) => {
    setCurrentUser(user);
    
    // Store in localStorage so it persists across page refreshes
    setDemoUser(user.id, user.role);
    
    // Reload page to apply changes throughout the app
    window.location.reload();
  };

  // Get current user from localStorage if available
  const storedUserId = localStorage.getItem("demo-user-id");
  
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
