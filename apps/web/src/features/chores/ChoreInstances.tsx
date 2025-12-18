import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../api/client';
import { useSupabase } from '../../auth/SupabaseContext';
import { useState } from 'react';

export function ChoreInstances() {
  const api = useApi();
  const qc = useQueryClient();
  const { session } = useSupabase();
  const familyId = session?.user.user_metadata?.family_id || 'demo-family';
  const userId = localStorage.getItem('demo-user-id') || session?.user.id || 'child-1';
  const userRole = localStorage.getItem('demo-user-role') || session?.user.user_metadata?.role || 'child';
  
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionMessage, setRejectionMessage] = useState("");

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

  const rejectInstance = useMutation({
    mutationFn: async ({ id, message }: { id: string; message: string }) =>
      (await api.post(`/chore-instances/${id}/reject`, { parentId: userId, message })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chore-instances', familyId] });
      setRejectingId(null);
      setRejectionMessage("");
    },
  });

  const unapproveInstance = useMutation({
    mutationFn: async (id: string) =>
      (await api.post(`/chore-instances/${id}/unapprove`, { parentId: userId })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chore-instances', familyId] }),
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
                    <div className="font-medium">{instance.template?.title || 'Chore'}</div>
                    {instance.template?.description && (
                      <div className="text-sm text-gray-600">{instance.template.description}</div>
                    )}
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
                    <div className="font-medium">{instance.template?.title || 'Chore'}</div>
                    {instance.template?.description && (
                      <div className="text-sm text-gray-600">{instance.template.description}</div>
                    )}
                    <div className="text-sm text-gray-600">
                      Assigned to: {instance.assignedTo}
                    </div>
                    <div className="text-sm text-gray-500">
                      {instance.points} points
                      {instance.completedAt && ` • Completed: ${new Date(instance.completedAt).toLocaleString()}`}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      className="btn btn-sm bg-green-600 hover:bg-green-700"
                      onClick={() => approveInstance.mutate(instance.id)}
                      disabled={approveInstance.isPending}
                    >
                      ✓ Approve
                    </button>
                    <button 
                      className="btn btn-sm bg-red-600 hover:bg-red-700"
                      onClick={() => setRejectingId(instance.id)}
                      disabled={rejectInstance.isPending}
                    >
                      ✗ Reject
                    </button>
                  </div>
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
            <div key={instance.id} className="p-3 border rounded">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <div className="font-medium">{instance.template?.title || 'Chore'}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    #{instance.id.slice(0, 8)} • {instance.points} pts • Assigned to: {instance.assignedTo}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    instance.status === 'approved' ? 'bg-green-100 text-green-800' :
                    instance.status === 'completed' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {instance.status}
                  </span>
                  {userRole === 'parent' && instance.status === 'approved' && (
                    <button
                      className="text-xs text-red-600 hover:text-red-700 underline"
                      onClick={() => {
                        if (confirm("Undo this approval? Points will be deducted.")) {
                          unapproveInstance.mutate(instance.id);
                        }
                      }}
                      disabled={unapproveInstance.isPending}
                    >
                      undo
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

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
