import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../api/client';
import { useSupabase } from '../../auth/SupabaseContext';

export function ChoreTemplates() {
  const api = useApi();
  const qc = useQueryClient();
  const { session } = useSupabase();
  const familyId = session?.user.user_metadata?.family_id || 'demo-family';
  const userId = localStorage.getItem('demo-user-id') || session?.user.id || 'demo-parent';
  const userRole = localStorage.getItem('demo-user-role') || session?.user.user_metadata?.role || 'parent';

  const templates = useQuery({
    queryKey: ['chore-templates', familyId],
    queryFn: async () => (await api.get(`/chore-templates?familyId=${familyId}`)).data
  });

  const users = useQuery({
    queryKey: ['users', familyId],
    queryFn: async () => (await api.get(`/users?familyId=${familyId}`)).data
  });

  const children = (users.data || []).filter((u: any) => u.role === 'child');

  const createTemplate = useMutation({
    mutationFn: async (payload: any) => (await api.post('/chore-templates', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chore-templates', familyId] })
  });

  const createInstance = useMutation({
    mutationFn: async (payload: any) => (await api.post('/chore-instances', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chore-instances', familyId] });
    }
  });

  if (userRole !== 'parent') {
    return (
      <div className="card">
        <p className="text-gray-600">Only parents can manage chore templates.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Chore Templates</h2>
      
      <form
        className="space-y-3 mb-6 p-4 bg-gray-50 rounded"
        onSubmit={e => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget as HTMLFormElement);
          const daysOfWeek = fd.getAll('daysOfWeek') as string[];
          
          createTemplate.mutate({
            familyId,
            title: fd.get('title'),
            description: fd.get('description'),
            points: Number(fd.get('points') || 1),
            recurrence: fd.get('recurrence'),
            interval: Number(fd.get('interval') || 1),
            daysOfWeek,
            defaultAssignedTo: fd.get('defaultAssignedTo') || null,
            approvalPolicy: fd.get('approvalPolicy') || 'any',
            createdBy: userId
          });
          (e.target as HTMLFormElement).reset();
        }}
      >
        <div>
          <input 
            className="input w-full" 
            name="title" 
            placeholder="Template title (e.g., Clean bedroom)" 
            required 
          />
        </div>
        
        <div>
          <textarea 
            className="input w-full" 
            name="description" 
            placeholder="Description (optional)" 
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Points</label>
            <input 
              className="input w-full" 
              name="points" 
              type="number" 
              min="1" 
              defaultValue="1" 
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-700 mb-1">Recurrence</label>
            <select className="input w-full" name="recurrence" defaultValue="weekly">
              <option value="once">Once</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Days of Week (for weekly)</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'MO', label: 'Mon' },
              { value: 'TU', label: 'Tue' },
              { value: 'WE', label: 'Wed' },
              { value: 'TH', label: 'Thu' },
              { value: 'FR', label: 'Fri' },
              { value: 'SA', label: 'Sat' },
              { value: 'SU', label: 'Sun' }
            ].map(day => (
              <label key={day.value} className="flex items-center gap-1">
                <input type="checkbox" name="daysOfWeek" value={day.value} />
                <span className="text-sm">{day.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Default Assignee</label>
          <select className="input w-full" name="defaultAssignedTo">
            <option value="">None (assign manually)</option>
            {children.map((child: any) => (
              <option key={child.id} value={child.id}>{child.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Approval Policy</label>
          <select className="input w-full" name="approvalPolicy" defaultValue="any">
            <option value="any">Any parent can approve</option>
            <option value="all">All parents must approve</option>
          </select>
        </div>

        <button className="btn w-full" type="submit" disabled={createTemplate.isPending}>
          {createTemplate.isPending ? 'Creating...' : 'Create Template'}
        </button>
      </form>

      <div className="space-y-3">
        <h3 className="font-semibold">Existing Templates</h3>
        {templates.isLoading && <p className="text-gray-500">Loading...</p>}
        {templates.data?.length === 0 && <p className="text-gray-500">No templates yet</p>}
        
        {(templates.data || []).map((t: any) => (
          <div key={t.id} className="p-3 border rounded">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="font-medium">{t.title}</div>
                {t.description && <p className="text-sm text-gray-600">{t.description}</p>}
                <div className="text-sm text-gray-500 mt-1">
                  {t.points} points • {t.recurrence}
                  {t.daysOfWeek?.length > 0 && ` (${t.daysOfWeek.join(', ')})`}
                  {' • '}{t.approvalPolicy} approval
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <select 
                  className="input text-sm py-1 px-2 min-h-0"
                  onChange={(e) => {
                    const childId = e.target.value;
                    if (childId) {
                      createInstance.mutate({
                        templateId: t.id,
                        familyId,
                        assignedTo: childId,
                        points: t.points,
                        dueDate: new Date().toISOString()
                      });
                      e.target.value = ''; // Reset
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Assign to...</option>
                  {children.map((child: any) => (
                    <option key={child.id} value={child.id}>{child.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
