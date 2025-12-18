/**
 * CHILD DASHBOARD
 * 
 * The main landing page for children when they open the app.
 * Focuses on TODAY's tasks and weekly progress to reduce overwhelm.
 * 
 * Widgets:
 * 1. Today's Chores - Only chores due today
 * 2. Weekly Points Summary - Progress this week
 * 3. Upcoming Preview - Tomorrow and rest of week
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "../../api/client";
import { useSupabase } from "../../auth/SupabaseContext";

export function ChildDashboard() {
  const api = useApi();
  const qc = useQueryClient();
  const { session } = useSupabase();
  const familyId = session?.user.user_metadata?.family_id || "demo-family";
  const userId = session?.user.id || "child-1";

  // Fetch all chore instances for this family
  const { data: instances = [], isLoading } = useQuery({
    queryKey: ["chore-instances", familyId],
    queryFn: async () =>
      (await api.get(`/chore-instances?familyId=${familyId}`)).data,
  });

  // Fetch points summary
  const { data: pointsData } = useQuery({
    queryKey: ["points-summary", userId],
    queryFn: async () => (await api.get(`/points/summary/${userId}`)).data,
  });

  // Complete chore mutation
  const completeInstance = useMutation({
    mutationFn: async (id: string) =>
      (await api.post(`/chore-instances/${id}/complete`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chore-instances", familyId] });
      qc.invalidateQueries({ queryKey: ["points-summary", userId] });
    },
  });

  // Filter chores for this child only
  const myInstances = instances.filter((i: any) => i.assignedTo === userId);

  // Get today's date range (midnight to 11:59pm)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Filter chores due TODAY
  const todayChores = myInstances.filter((i: any) => {
    if (!i.dueDate) return false;
    const dueDate = new Date(i.dueDate);
    return dueDate >= today && dueDate < tomorrow;
  });

  // Filter chores due TOMORROW
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
  const tomorrowChores = myInstances.filter((i: any) => {
    if (!i.dueDate) return false;
    const dueDate = new Date(i.dueDate);
    return dueDate >= tomorrow && dueDate < tomorrowEnd;
  });

  // Count rest of week chores (after tomorrow)
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const upcomingCount = myInstances.filter((i: any) => {
    if (!i.dueDate) return false;
    const dueDate = new Date(i.dueDate);
    return dueDate >= tomorrowEnd && dueDate < weekEnd;
  }).length;

  // Recent completed chores (last 3)
  const recentCompleted = myInstances
    .filter((i: any) => i.status === "approved" || i.status === "completed")
    .sort((a: any, b: any) => {
      const dateA = new Date(a.completedAt || a.createdAt).getTime();
      const dateB = new Date(b.completedAt || b.createdAt).getTime();
      return dateB - dateA;
    })
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="card h-32 animate-pulse bg-gray-200" />
        <div className="card h-48 animate-pulse bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ===== GREETING HEADER ===== */}
      <div className="card bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <h1 className="text-2xl font-bold">
          Hello! 👋
        </h1>
        <p className="text-white/90 mt-1">
          {todayChores.length === 0
            ? "No chores today! Enjoy your free time 🎉"
            : `You have ${todayChores.length} ${
                todayChores.length === 1 ? "chore" : "chores"
              } to do today`}
        </p>
      </div>

      {/* ===== WEEKLY POINTS SUMMARY ===== */}
      <div className="card bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <h2 className="text-lg font-semibold mb-2">This Week's Points</h2>
        <div className="flex items-baseline gap-2">
          <div className="text-4xl font-bold">
            {pointsData?.weeklyPoints || 0}
          </div>
          <div className="text-white/80">points earned</div>
        </div>
        <div className="mt-3 text-sm text-white/90">
          Total: {pointsData?.totalPoints || 0} points
        </div>
      </div>

      {/* ===== TODAY'S CHORES ===== */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-3">Today's Chores</h2>

        {todayChores.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-5xl mb-2">🎉</div>
            <p>No chores due today!</p>
            <p className="text-sm mt-1">Check back tomorrow</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayChores.map((chore: any) => (
              <div
                key={chore.id}
                className={`p-4 border-2 rounded-lg ${
                  chore.status === "approved"
                    ? "border-green-300 bg-green-50"
                    : chore.status === "completed"
                    ? "border-yellow-300 bg-yellow-50"
                    : "border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {chore.template?.title || "Chore"}
                    </h3>
                    {chore.template?.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {chore.template.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm font-medium text-indigo-600">
                        {chore.points} points
                      </span>
                      {chore.status === "approved" && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          ✓ Approved
                        </span>
                      )}
                      {chore.status === "completed" && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          ⏳ Awaiting Approval
                        </span>
                      )}
                    </div>
                  </div>
                  {chore.status === "pending" && (
                    <button
                      className="btn btn-sm ml-3"
                      onClick={() => completeInstance.mutate(chore.id)}
                      disabled={completeInstance.isPending}
                    >
                      {completeInstance.isPending ? "..." : "Complete"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== UPCOMING CHORES PREVIEW ===== */}
      {(tomorrowChores.length > 0 || upcomingCount > 0) && (
        <div className="card bg-blue-50 border-blue-200">
          <h2 className="text-lg font-semibold mb-2">Coming Up</h2>
          
          {tomorrowChores.length > 0 && (
            <div className="mb-2">
              <p className="text-sm text-gray-700">
                <strong>Tomorrow:</strong>{" "}
                {tomorrowChores.map((c: any) => c.template?.title).join(", ")}
              </p>
            </div>
          )}
          
          {upcomingCount > 0 && (
            <p className="text-sm text-gray-600">
              {upcomingCount} more {upcomingCount === 1 ? "chore" : "chores"}{" "}
              this week
            </p>
          )}
        </div>
      )}

      {/* ===== RECENT ACTIVITY ===== */}
      {recentCompleted.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
          <div className="space-y-2">
            {recentCompleted.map((chore: any) => (
              <div
                key={chore.id}
                className="flex items-center justify-between py-2 border-b last:border-b-0"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {chore.template?.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {chore.status === "approved" ? "Approved" : "Completed"} •{" "}
                    {new Date(
                      chore.approvedAt || chore.completedAt
                    ).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-green-600 font-semibold text-sm">
                  +{chore.points} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
