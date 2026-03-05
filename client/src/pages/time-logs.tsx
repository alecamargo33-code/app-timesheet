import { parseISO } from "date-fns";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  useTimeLogs,
  useCreateTimeLog,
  useDeleteTimeLog,
} from "@/hooks/use-time-logs";
import { useUsers } from "@/hooks/use-users";
import { useTasks } from "@/hooks/use-tasks";
import { useCategories } from "@/hooks/use-categories";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z
  .object({
    userId: z.coerce.number().min(1, "Selecione um usuário"),
    taskId: z.coerce.number().min(1, "Selecione uma tarefa"),
    date: z.string().min(1, "Data é obrigatória"),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora inválida"),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora inválida"),
  })
  .refine(
    (data) => {
      if (!data.startTime || !data.endTime) return true;
      return data.endTime > data.startTime;
    },
    {
      message: "Fim deve ser maior que Início",
      path: ["endTime"],
    },
  );

function calculateDuration(start: string, end: string) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export default function TimeLogs() {
  const { data: logs, isLoading: loadingLogs } = useTimeLogs();
  const { data: users, isLoading: loadingUsers } = useUsers();
  const { data: tasks, isLoading: loadingTasks } = useTasks();
  const createMutation = useCreateTimeLog();
  const deleteMutation = useDeleteTimeLog();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: 0,
      taskId: 0,
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "08:00",
      endTime: "09:00",
    },
  });

  const isLoading = loadingLogs || loadingUsers || loadingTasks;

  const startTime = form.watch("startTime");
  const endTime = form.watch("endTime");
  const duration = calculateDuration(startTime, endTime);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate(
      { ...values, durationMinutes: duration },
      {
        onSuccess: () => {
          toast({
            title: "Sucesso",
            description: "Lançamento registrado com sucesso.",
          });
          form.reset({ ...values, startTime: values.endTime, endTime: "" }); // chain times
        },
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "Erro",
            description: err.message,
          });
        },
      },
    );
  };

  const activeUsers = users?.filter((u) => u.isActive) || [];
  const activeTasks = tasks?.filter((t) => t.isActive) || [];
  const recentLogs =
    logs
      ?.slice()
      .sort((a, b) => b.id - a.id)
      .slice(0, 10) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Lançamento de Tempo
        </h1>
        <p className="text-muted-foreground mt-1">
          Registre as horas trabalhadas em cada tarefa.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 shadow-lg shadow-black/5 border-border/50">
          <CardHeader>
            <CardTitle className="font-display">Novo Lançamento</CardTitle>
            <CardDescription>Preencha os detalhes da execução</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuário</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activeUsers.map((u) => (
                            <SelectItem key={u.id} value={u.id.toString()}>
                              {u.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taskId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarefa</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activeTasks.map((t) => (
                            <SelectItem key={t.id} value={t.id.toString()}>
                              {t.name}{" "}
                              <span className="text-xs text-muted-foreground ml-2">
                                ({t.category})
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Início</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fim</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="p-4 bg-muted/50 rounded-xl flex items-center justify-between border border-border/50">
                  <span className="text-sm font-medium">Duração Calculada</span>
                  <span className="font-display font-bold text-lg text-primary">
                    {duration > 0 ? formatDuration(duration) : "0h 0m"}
                  </span>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
                  disabled={createMutation.isPending || duration <= 0}
                >
                  {createMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Clock className="mr-2 h-4 w-4" />
                  )}
                  Registrar Tempo
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg shadow-black/5 border-border/50">
          <CardHeader>
            <CardTitle className="font-display">Lançamentos Recentes</CardTitle>
            <CardDescription>Últimos registros adicionados</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLogs ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : recentLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum lançamento encontrado.
              </div>
            ) : (
              <div className="space-y-4">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:shadow-md transition-shadow group"
                  >
                    <div>
                      <div className="font-medium text-foreground">
                        {log.task.name}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <span className="bg-muted px-2 py-0.5 rounded text-xs">
                          {log.user.name}
                        </span>
                        <span>•</span>
                        <span>{format(parseISO(log.date), "dd/MM/yyyy")}</span>
                        <span>•</span>
                        <span>
                          {log.startTime} - {log.endTime}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="font-bold text-primary bg-primary/10 px-3 py-1 rounded-full text-sm">
                        {formatDuration(log.durationMinutes)}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          if (
                            confirm("Deseja realmente excluir este lançamento?")
                          ) {
                            deleteMutation.mutate(log.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
