import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertTimeLog, type UpdateTimeLogRequest, type TimeLogWithRelations } from "@shared/schema";

export function useTimeLogs() {
  return useQuery({
    queryKey: [api.timeLogs.list.path],
    queryFn: async () => {
      const res = await fetch(api.timeLogs.list.path);
      if (!res.ok) throw new Error("Falha ao carregar lançamentos");
      // Cast the response to TimeLogWithRelations array as the schema uses z.any() for relations
      const data = await res.json();
      return data as TimeLogWithRelations[];
    },
  });
}

export function useCreateTimeLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertTimeLog) => {
      const res = await fetch(api.timeLogs.create.path, {
        method: api.timeLogs.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Falha ao criar lançamento");
      return api.timeLogs.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.timeLogs.list.path] }),
  });
}

export function useUpdateTimeLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & UpdateTimeLogRequest) => {
      const url = buildUrl(api.timeLogs.update.path, { id });
      const res = await fetch(url, {
        method: api.timeLogs.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Falha ao atualizar lançamento");
      return api.timeLogs.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.timeLogs.list.path] }),
  });
}

export function useDeleteTimeLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.timeLogs.delete.path, { id });
      const res = await fetch(url, { method: api.timeLogs.delete.method });
      if (!res.ok) throw new Error("Falha ao excluir lançamento");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.timeLogs.list.path] }),
  });
}
