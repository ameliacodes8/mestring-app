import { useQuery } from "@tanstack/react-query";
import { useApi } from "../../api/client";
import { useSupabase } from "../../auth/SupabaseContext";

export function PointsSummary() {
  const api = useApi();
  const { session } = useSupabase();
  const userId = session?.user?.id;

  const { data: pointsData, isLoading } = useQuery({
    queryKey: ["points-summary", userId],
    queryFn: async () => (await api.get(`/points/summary/${userId}`)).data,
    enabled: !!userId,
  });

  if (!userId) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">Please sign in to view points</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">Loading points...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Your Points</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
          <div className="text-sm opacity-90">Total Points</div>
          <div className="text-3xl font-bold mt-1">
            {pointsData?.totalPoints || 0}
          </div>
        </div>
        
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
          <div className="text-sm opacity-90">This Week</div>
          <div className="text-3xl font-bold mt-1">
            {pointsData?.weeklyPoints || 0}
          </div>
        </div>
      </div>

      {pointsData?.transactions && pointsData.transactions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
          <div className="space-y-2">
            {pointsData.transactions.map((transaction: any) => (
              <div
                key={transaction.id}
                className="bg-white/10 rounded p-3 backdrop-blur-sm flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">
                    {transaction.source === "chore_approval"
                      ? "Chore Completed"
                      : transaction.source}
                  </div>
                  <div className="text-xs opacity-75">
                    {new Date(transaction.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-xl font-bold">+{transaction.points}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
