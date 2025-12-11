import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../api/client';
import { useSupabase } from '../../auth/SupabaseContext';

export function ChoreInstances() {
  const api = useApi();
  const qc = useQueryClient();
  const { session } = useSupabase();
  const familyId = session?.user.user_metadata?.family_id || 'demo-family';
  const userId = session?.user.id || 'child-1';
  const userRole = session?.user.user_metadata?.role || 'child';

  const instances = useQuery({
    queryKey: ['chore-instances', familyId],
    queryFn: async () => (await api.get(`/chore-instances?familyId=${familyId}`)).data
  });

  const generateToday = useMutation({
    mutationFn: async () => (await api.post('/chore-instances/generate-today', { familyId })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chore-instances', familyId] })
  });

  const completeInstance = useMutation({
    mutationFn: async (id: string) => (await api.post(`/chore-instances/${id}/complete`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chore-instances', familyId] })
  });

  const approveInstance = useMutation({
    mutationFn: async (id: string) => (await api.post(`/chore-instances/${id}/approve`, { parentId: userId })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chore-instances', familyId] })
  });

  const myInstances = (instances.data || []).filter((i: any) => i.assignedTo === userId);
  const pendingApprovals = (instances.data || []).filter((i: any) => i.status === 'completed');

  return (
    <div className="space-y-4">
      {/* Generate Today Button (Parents only) */}
      {userRole === 'parent' && (
        <div className="card">
          <button 
            className="btn w-full" 
            onClick={() => generateToday.mutate()}
            disabled={generateToday.isPending}
          >
            {generateToday.isPending ? 'Generating...' : "Generate Today's Chores"}
          </button>
          {generateToday.isSuccess && (
            <p className="text-sm text-green-600 mt-2">
              Created {generateToday.data?.createdCount || 0} chore(s)
            </p>
          )}
        </div>
      )}

      {/* My Chores (Children) */}
      {userRole === 'child' && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">My Chores</h2>
          {instances.isLoading && <p className="text-gray-500">Loading...</p>}
          {myInstances.length === 0 && <p className="text-gray-500">No chores assigned</p>}
          
          <div className="space-y-3">
            {myInstances.map((instance: any) => (
              <div key={instance.id} className="p-3 border rounded">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium">Chore #{instance.id.slice(0, 8)}</div>
                    <div className="text-sm text-gray-600">
                      {instance.points} points
                      {instance.dueDate && ` • Due: ${new Date(instance.dueDate).toLocaleDateString()}`}
                    </div>
                    <div className="mt-1">
                      <span className={`text-xs px-2 py-1 rounded ${
                        instance.status === 'approved' ? 'bg-green-100 text-green-800' :
                        instance.status === 'completed' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {instance.status}
                      </span>
                    </div>
                  </div>
                  
                  {instance.status === 'pending' && (
                    <button 
                      className="btn btn-sm"
                      onClick={() => completeInstance.mutate(instance.id)}
                      disabled={completeInstance.isPending}
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Approvals (Parents) */}
      {userRole === 'parent' && pendingApprovals.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Pending Approvals</h2>
          
          <div className="space-y-3">
            {pendingApprovals.map((instance: any) => (
              <div key={instance.id} className="p-3 border rounded">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium">Chore #{instance.id.slice(0, 8)}</div>
                    <div className="text-sm text-gray-600">
                      Assigned to: {instance.assignedTo}
                    </div>
                    <div className="text-sm text-gray-500">
                      {instance.points} points
                      {instance.completedAt && ` • Completed: ${new Date(instance.completedAt).toLocaleString()}`}
                    </div>
                  </div>
                  
                  <button 
                    className="btn btn-sm bg-green-600 hover:bg-green-700"
                    onClick={() => approveInstance.mutate(instance.id)}
                    disabled={approveInstance.isPending}
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Chores (Everyone) */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">All Family Chores</h2>
        {instances.isLoading && <p className="text-gray-500">Loading...</p>}
        {instances.data?.length === 0 && <p className="text-gray-500">No chores yet</p>}
        
        <div className="space-y-2">
          {(instances.data || []).map((instance: any) => (
            <div key={instance.id} className="p-2 border rounded text-sm">
              <div className="flex justify-between items-center">
                <span>#{instance.id.slice(0, 8)}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  instance.status === 'approved' ? 'bg-green-100 text-green-800' :
                  instance.status === 'completed' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {instance.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
