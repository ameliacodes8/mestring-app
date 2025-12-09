import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';

export function useChores() {
  const qc = useQueryClient();
  const chores = useQuery({
    queryKey: ['chores'],
    queryFn: async () => (await api.get('/chores')).data,
  });

  const createChore = useMutation({
    mutationFn: async (payload: any) => (await api.post('/chores', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chores'] }),
  });

  return { chores, createChore };
}