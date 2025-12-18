/**
 * PARENT DASHBOARD
 * 
 * The main landing page for parents when they open the app.
 * Focuses on pending approvals and family overview.
 * 
 * Widgets:
 * 1. Pending Approvals Alert - Action required items
 * 2. Family Leaderboard - All children's weekly progress
 * 3. Today's Activity - What happened today
 * 4. Quick Actions - Generate chores, create templates
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "../../api/client";
import { useSupabase } from "../../auth/SupabaseContext";
import { useState } from "react";

export function ParentDashboard() {
  const api = useApi();
  const qc = useQueryClient();
  const { session } = useSupabase();
  const familyId = session?.user.user_metadata?.family_id || "demo-family";
  const userId = localStorage.getItem('demo-user-id') || session?.user.id || "demo-parent";
  
  // Rejection modal state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionMessage, setRejectionMessage] = useState("");

  // Fetch all chore instances for the family
  const { data: instances = [], isLoading } = useQuery({
    queryKey: ["chore-instances", familyId],
    queryFn: async () =>
      (await api.get(`/chore-instances?familyId=${familyId}`)).data,
  });

  // Fetch family leaderboard
  const { data: leaderboard = [] } = useQuery({
    queryKey: ["leaderboard", familyId],
    queryFn: async () =>
      (await api.get(`/points/leaderboard/${familyId}`)).data,
  });

  // Generate today's chores mutation
  const generateToday = useMutation({
    mutationFn: async () =>
      (await api.post("/chore-instances/generate-today", { familyId })).data,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["chore-instances", familyId] }),
  });

  // Approve chore mutation
  const approveInstance = useMutation({
    mutationFn: async (id: string) =>
      (await api.post(`/chore-instances/${id}/approve`, { parentId: userId }))
        .data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chore-instances", familyId] });
      qc.invalidateQueries({ queryKey: ["leaderboard", familyId] });
    },
  });

  // Reject chore mutation
  const rejectInstance = useMutation({
    mutationFn: async ({ id, message }: { id: string; message: string }) =>
      (await api.post(`/chore-instances/${id}/reject`, { parentId: userId, message }))
        .data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chore-instances", familyId] });
      qc.invalidateQueries({ queryKey: ["leaderboard", familyId] });
      setRejectingId(null);
      setRejectionMessage("");
    },
  });

  // Unapprove chore mutation
  const unapproveInstance = useMutation({
    mutationFn: async (id: string) =>
      (await api.post(`/chore-instances/${id}/unapprove`, { parentId: userId }))
        .data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chore-instances", familyId] });
      qc.invalidateQueries({ queryKey: ["leaderboard", familyId] });
    },
  });

  // Filter pending approvals (completed but not approved)
  const pendingApprovals = instances.filter(
    (i: any) => i.status === "completed"
  );

  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Today's activity (completed or approved today)
  const todayActivity = instances
    .filter((i: any) => {
      const activityDate = new Date(
        i.approvedAt || i.completedAt || i.createdAt
      );
      return activityDate >= today && activityDate < tomorrow;
    })
    .sort((a: any, b: any) => {
      const dateA = new Date(
        a.approvedAt || a.completedAt || a.createdAt
      ).getTime();
      const dateB = new Date(
        b.approvedAt || b.completedAt || b.createdAt
      ).getTime();
      return dateB - dateA;
    });

  // Count today's stats
  const todayCompleted = todayActivity.filter(
    (i: any) => i.status === "completed" || i.status === "approved"
  ).length;
  const todayApproved = todayActivity.filter(
    (i: any) => i.status === "approved"
  ).length;

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
        <h1 className="text-2xl font-bold">Parent Dashboard 👨‍👩‍👧‍👦</h1>
        <p className="text-white/90 mt-1">
          {pendingApprovals.length === 0
            ? "All caught up! No pending approvals"
            : `${pendingApprovals.length} ${
                pendingApprovals.length === 1 ? "chore" : "chores"
              } waiting for approval`}
        </p>
      </div>

      {/* ===== PENDING APPROVALS ALERT ===== */}
      {pendingApprovals.length > 0 && (
        <div className="card border-yellow-300 bg-yellow-50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold">
              {pendingApprovals.length}
            </div>
            <h2 className="text-lg font-semibold">
              Pending Approvals
            </h2>
          </div>

          <div className="space-y-3">
            {pendingApprovals.slice(0, 5).map((chore: any) => (
              <div
                key={chore.id}
                className="p-3 bg-white border border-yellow-200 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {chore.template?.title || "Chore"}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Completed by: Child • {chore.points} points
                    </p>
                    {chore.completedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(chore.completedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-3">
                    <button
                      className="btn btn-sm bg-green-600 hover:bg-green-700"
                      onClick={() => approveInstance.mutate(chore.id)}
                      disabled={approveInstance.isPending}
                    >
                      ✓ Approve
                    </button>
                    <button
                      className="btn btn-sm bg-red-600 hover:bg-red-700"
                      onClick={() => setRejectingId(chore.id)}
                      disabled={rejectInstance.isPending}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {pendingApprovals.length > 5 && (
              <p className="text-sm text-gray-600 text-center">
                + {pendingApprovals.length - 5} more pending
              </p>
            )}
          </div>
        </div>
      )}

      {/* ===== QUICK ACTIONS ===== */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3">
          <button
            className="btn w-full text-left flex items-center justify-between"
            onClick={() => generateToday.mutate()}
            disabled={generateToday.isPending}
          >
            <span>
              {generateToday.isPending
                ? "Generating..."
                : "Generate Today's Chores"}
            </span>
            <span className="text-xl">📅</span>
          </button>
          {generateToday.isSuccess && (
            <p className="text-sm text-green-600 -mt-2">
              ✓ Created {generateToday.data?.createdCount || 0} chore(s)
            </p>
          )}
        </div>
      </div>

      {/* ===== FAMILY LEADERBOARD ===== */}
      {leaderboard.length > 0 && (
        <div className="card bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <h2 className="text-lg font-semibold mb-3">
            Family Leaderboard 🏆
          </h2>
          <div className="space-y-3">
            {leaderboard.map((child: any, index: number) => (
              <div
                key={child.userId}
                className="flex items-center justify-between p-3 bg-white/10 rounded-lg backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold">
                      {child.name || "Child"}
                    </div>
                    <div className="text-xs text-white/80">This week</div>
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {child.totalPoints}
                  <span className="text-sm font-normal ml-1">pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== TODAY'S STATS ===== */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Today's Stats</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {todayActivity.length}
            </div>
            <div className="text-xs text-gray-600 mt-1">Total Activity</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {todayCompleted}
            </div>
            <div className="text-xs text-gray-600 mt-1">Completed</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {todayApproved}
            </div>
            <div className="text-xs text-gray-600 mt-1">Approved</div>
          </div>
        </div>
      </div>

      {/* ===== TODAY'S ACTIVITY TIMELINE ===== */}
      {todayActivity.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Today's Activity</h2>
          <div className="space-y-2">
            {todayActivity.slice(0, 5).map((chore: any) => (
              <div
                key={chore.id}
                className="flex items-start gap-3 py-2 border-b last:border-b-0"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 ${
                    chore.status === "approved"
                      ? "bg-green-500"
                      : "bg-yellow-500"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm">
                    <strong>{chore.template?.title}</strong>
                    {chore.status === "approved" ? " approved" : " completed"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(
                      chore.approvedAt || chore.completedAt
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-gray-700">
                    {chore.points} pts
                  </div>
                  {chore.status === "approved" && (
                    <button
                      className="text-xs text-red-600 hover:text-red-700 underline"
                      onClick={() => {
                        if (confirm("Undo this approval? Points will be deducted.")) {
                          unapproveInstance.mutate(chore.id);
                        }
                      }}
                      disabled={unapproveInstance.isPending}
                    >
                      undo
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== EMPTY STATE ===== */}
      {todayActivity.length === 0 && pendingApprovals.length === 0 && (
        <div className="card text-center py-8">
          <div className="text-5xl mb-3">☀️</div>
          <h3 className="font-semibold text-lg">Quiet Day</h3>
          <p className="text-gray-600 text-sm mt-1">
            No activity yet today. Check back later!
          </p>
        </div>
      )}

      {/* ===== REJECTION MODAL ===== */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-3">Reject Chore</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please explain to your child why this chore needs to be redone:
            </p>
            <textarea
              className="input w-full min-h-[100px]"
              placeholder="e.g., 'Please vacuum under the furniture too' or 'Some spots were missed'"
              value={rejectionMessage}
              onChange={(e) => setRejectionMessage(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                className="btn flex-1"
                onClick={() => {
                  setRejectingId(null);
                  setRejectionMessage("");
                }}
              >
                Cancel
              </button>
              <button
                className="btn bg-red-600 hover:bg-red-700 flex-1"
                onClick={() => {
                  if (rejectionMessage.trim()) {
                    rejectInstance.mutate({ id: rejectingId, message: rejectionMessage });
                  }
                }}
                disabled={!rejectionMessage.trim() || rejectInstance.isPending}
              >
                {rejectInstance.isPending ? "Rejecting..." : "Send & Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
