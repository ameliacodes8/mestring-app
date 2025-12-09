import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../api/client';
import { useSupabase } from '../../auth/SupabaseContext';

export function Goals() {
  const api = useApi();
  const qc = useQueryClient();
  const { session } = useSupabase();
  const familyId = session?.user.user_metadata?.family_id || 'demo-family';

  const goals = useQuery({
    queryKey: ['goals', familyId],
    queryFn: async () => (await api.get(`/goals?familyId=${familyId}`)).data
  });

  const create = useMutation({
    mutationFn: async (payload: any) => (await api.post('/goals', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals', familyId] })
  });

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">Goals</h2>
      <form
        className="flex gap-2 mb-3"
        onSubmit={e => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget as HTMLFormElement);
          create.mutate({
            title: fd.get('title'),
            description: fd.get('description'),
            familyId,
            assignedTo: session?.user.id
          } as any);
          (e.target as HTMLFormElement).reset();
        }}
      >
        <input className="input" name="title" placeholder="New goal title" />
        <input className="input" name="description" placeholder="Description" />
        <button className="btn" type="submit">Add</button>
      </form>

      <ul className="space-y-2">
        {(goals.data || []).map((g: any) => (
          <li key={g.id} className="flex items-center justify-between">
            <div>
              <div className="font-medium">{g.title}</div>
              <div className="text-sm text-gray-600">{g.description}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}