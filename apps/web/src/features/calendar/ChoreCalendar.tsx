// React and calendar library imports
import { useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
// TanStack Query for data fetching and mutations
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// Our custom hooks for API and authentication
import { useApi } from "../../api/client";
import { useSupabase } from "../../auth/SupabaseContext";
// Required CSS for the calendar component
import "react-big-calendar/lib/css/react-big-calendar.css";

// Configure locales for the calendar (US English)
const locales = {
  "en-US": enUS,
};

// The localizer tells react-big-calendar how to format dates
// It uses date-fns functions to handle date parsing and formatting
const localizer = dateFnsLocalizer({
  format,       // How to format dates for display
  parse,        // How to parse date strings
  startOfWeek,  // What day starts the week (Sunday in US)
  getDay,       // Get day of week (0-6)
  locales,      // Locale settings
});

export function ChoreCalendar() {
  // Get the axios API instance with authentication headers
  const api = useApi();
  // Query client lets us invalidate cache after mutations
  const qc = useQueryClient();
  // Get current user session from Supabase
  const { session } = useSupabase();
  // Extract user info with fallbacks for demo/testing
  const familyId = session?.user.user_metadata?.family_id || "demo-family";
  const userId = session?.user.id || "child-1";
  const userRole = session?.user.user_metadata?.role || "child";

  // Local state for calendar view type (month, week, day, agenda)
  const [view, setView] = useState<"month" | "week" | "day" | "agenda">("week");
  // Current date the calendar is focused on
  const [date, setDate] = useState(new Date());

  // Fetch all chore instances for this family
  // useQuery automatically handles loading states and caching
  const { data: instances = [] } = useQuery({
    queryKey: ["chore-instances", familyId], // Unique key for this query
    queryFn: async () =>
      (await api.get(`/chore-instances?familyId=${familyId}`)).data,
  });

  // Mutation to mark a chore as complete (called by children)
  // After success, refresh the chore instances list
  const completeInstance = useMutation({
    mutationFn: async (id: string) =>
      (await api.post(`/chore-instances/${id}/complete`)).data,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["chore-instances", familyId] }),
  });

  // Mutation to approve a completed chore (called by parents)
  // After success, refresh the chore instances list
  const approveInstance = useMutation({
    mutationFn: async (id: string) =>
      (await api.post(`/chore-instances/${id}/approve`, { parentId: userId }))
        .data,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["chore-instances", familyId] }),
  });

  // Transform chore instances into calendar event objects
  // The calendar library expects: id, title, start, end
  // We store the full instance data in 'resource' for later access
  const events = instances.map((instance: any) => ({
    id: instance.id,
    title: instance.template?.title || "Chore",
    start: new Date(instance.dueDate),
    end: new Date(instance.dueDate),
    resource: instance, // Store full chore data here
  }));

  // Calculate the start and end of the current week for statistics
  const weekStart = startOfWeek(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7); // Add 7 days

  // Filter instances that are due this week
  const weeklyInstances = instances.filter((i: any) => {
    const dueDate = new Date(i.dueDate);
    return dueDate >= weekStart && dueDate < weekEnd;
  });

  // Calculate total possible points for this week
  // Sum up points from all chores due this week
  const possiblePoints = weeklyInstances.reduce(
    (sum: number, i: any) => sum + (i.points || 0),
    0
  );

  // Calculate points already earned this week
  // Only count chores that have been approved
  const earnedPoints = weeklyInstances
    .filter((i: any) => i.status === "approved")
    .reduce((sum: number, i: any) => sum + (i.points || 0), 0);

  // Custom styling function for calendar events
  // Returns CSS styles based on chore status and assignee
  const eventStyleGetter = (event: any) => {
    const instance = event.resource;
    let backgroundColor = "#6b7280"; // Default: gray for pending chores

    // Change color based on status
    if (instance.status === "approved") {
      backgroundColor = "#10b981"; // Green for approved
    } else if (instance.status === "completed") {
      backgroundColor = "#f59e0b"; // Yellow/orange for awaiting approval
    }

    // Special highlighting for children viewing their own chores
    if (userRole === "child" && instance.assignedTo === userId) {
      backgroundColor = "#6366f1"; // Indigo for "my chores"
      // But keep status colors if completed/approved
      if (instance.status === "approved") backgroundColor = "#10b981";
      if (instance.status === "completed") backgroundColor = "#f59e0b";
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  };

  // Handle when user clicks on a calendar event
  // Children can complete their pending chores
  // Parents can approve completed chores
  const handleSelectEvent = (event: any) => {
    const instance = event.resource;
    
    // Check if this child can complete this chore
    const canComplete =
      userRole === "child" &&
      instance.assignedTo === userId &&
      instance.status === "pending";
    
    // Check if this parent can approve this chore
    const canApprove = userRole === "parent" && instance.status === "completed";

    // If child can complete, show confirmation dialog
    if (canComplete) {
      if (
        confirm(
          `Complete "${instance.template?.title}"? (${instance.points} points)`
        )
      ) {
        completeInstance.mutate(instance.id);
      }
    } 
    // If parent can approve, show confirmation dialog
    else if (canApprove) {
      if (
        confirm(
          `Approve "${instance.template?.title}" for ${instance.assignee?.name || "child"}?`
        )
      ) {
        approveInstance.mutate(instance.id);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* ===== WEEKLY POINTS SUMMARY CARD ===== */}
      {/* Shows how many points are possible this week and how many earned */}
      <div className="card bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <h2 className="text-xl font-bold mb-3">This Week</h2>
        
        {/* Two-column grid showing possible vs earned points */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm opacity-90">Possible Points</div>
            <div className="text-3xl font-bold">{possiblePoints}</div>
          </div>
          <div>
            <div className="text-sm opacity-90">Earned Points</div>
            <div className="text-3xl font-bold">{earnedPoints}</div>
          </div>
        </div>
        
        {/* Progress bar - only show if there are chores this week */}
        {possiblePoints > 0 && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <div className="text-sm opacity-90">Progress</div>
            {/* Outer progress bar container */}
            <div className="w-full bg-white/20 rounded-full h-2 mt-1">
              {/* Inner filled portion - width based on percentage complete */}
              <div
                className="bg-white h-2 rounded-full transition-all"
                style={{
                  width: `${(earnedPoints / possiblePoints) * 100}%`,
                }}
              />
            </div>
            {/* Percentage text below the bar */}
            <div className="text-xs opacity-75 mt-1">
              {Math.round((earnedPoints / possiblePoints) * 100)}% complete
            </div>
          </div>
        )}
      </div>

      {/* ===== COLOR LEGEND ===== */}
      {/* Shows what each color means on the calendar */}
      <div className="card">
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-500" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500" />
            <span>Awaiting Approval</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span>Approved</span>
          </div>
          {/* Only show "Your Chores" legend item for children */}
          {userRole === "child" && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-indigo-600" />
              <span>Your Chores</span>
            </div>
          )}
        </div>
      </div>

      {/* ===== MAIN CALENDAR ===== */}
      <div className="card">
        <div style={{ height: "600px" }}>
          <Calendar
            localizer={localizer}              // Date formatting/parsing library
            events={events}                    // Array of chore events to display
            startAccessor="start"              // Which property has start date
            endAccessor="end"                  // Which property has end date
            view={view}                        // Current view (month/week/day/agenda)
            onView={setView}                   // Update view when user changes it
            date={date}                        // Current date calendar is showing
            onNavigate={setDate}               // Update date when user navigates
            eventPropGetter={eventStyleGetter} // Function to style each event
            onSelectEvent={handleSelectEvent}  // Called when user clicks an event
            views={["month", "week", "day", "agenda"]} // Available view options
            popup                              // Show overflow events in popup
            tooltipAccessor={(event: any) => { // Tooltip text on hover
              const instance = event.resource;
              return `${instance.template?.title} - ${instance.status} (${instance.points} pts)`;
            }}
          />
        </div>
      </div>

      {/* ===== USER INSTRUCTIONS ===== */}
      {/* Different instructions for parents vs children */}
      <div className="card bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-800">
          {userRole === "child" ? (
            <>
              <strong>Click on your chores</strong> (indigo) to mark them
              complete!
            </>
          ) : (
            <>
              <strong>Click on completed chores</strong> (yellow) to approve
              them!
            </>
          )}
        </p>
      </div>
    </div>
  );
}
