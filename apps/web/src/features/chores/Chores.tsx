import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../api/client';
import { useSupabase } from '../../auth/SupabaseContext';

export function Chores() {
  const api = useApi();
  const qc = useQueryClient();
  const { session } = useSupabase();
  const familyId = session?.user.user_metadata?.family_id || 'demo-family';

  const chores = useQuery({
    queryKey: ['chores', familyId],
    queryFn: async () => (await api.get(`/chores?familyId=${familyId}`)).data
  });

  const create = useMutation({
    mutationFn: async (payload: any) => (await api.post('/chores', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chores', familyId] })
  });

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">Chores</h2>
      <form
        className="flex gap-2 mb-3"
        onSubmit={e => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget as HTMLFormElement);
          create.mutate({
            title: fd.get('title'),
            points: Number(fd.get('points') || 1),
            familyId,
            assignedTo: session?.user.id
          } as any);
          (e.target as HTMLFormElement).reset();
        }}
      >
        <input className="input" name="title" placeholder="New chore title" />
        <input className="input" name="points" type="number" min="1" placeholder="Points" />
        <button className="btn" type="submit">Add</button>
      </form>

      <ul className="space-y-2">
        {(chores.data || []).map((c: any) => (
          <li key={c.id} className="flex items-center justify-between">
            <div>
              <div className="font-medium">{c.title}</div>
              <div className="text-sm text-gray-600">Points: {c.points}</div>
            </div>
            <button
              className="btn"
              onClick={() => api.post(`/chores/${c.id}/complete`).then(() => qc.invalidateQueries({ queryKey: ['chores', familyId] }))}
            >
              Complete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}