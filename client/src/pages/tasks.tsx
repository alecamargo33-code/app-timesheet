import { parseISO } from "date-fns";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTasks, useCreateTask, useUpdateTask } from "@/hooks/use-tasks";
import { useCategories } from "@/hooks/use-categories";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type TaskWithCategory } from "@shared/schema";

const formSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  categoryId: z.coerce.number().min(1, "Categoria é obrigatória"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export default function Tasks() {
  const { data: tasks, isLoading: loadingTasks } = useTasks();
  const { data: categories, isLoading: loadingCategories } = useCategories();
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const { toast } = useToast();

  const [editingTask, setEditingTask] = useState<TaskWithCategory | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", categoryId: 0, description: "", isActive: true },
  });

  const openDialog = (task?: TaskWithCategory) => {
    if (task) {
      setEditingTask(task);
      form.reset({
        name: task.name,
        categoryId: task.categoryId,
        description: task.description || "",
        isActive: task.isActive,
      });
    } else {
      setEditingTask(null);
      form.reset({ name: "", categoryId: 0, description: "", isActive: true });
    }
    setDialogOpen(true);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingTask) {
      updateMutation.mutate(
        { id: editingTask.id, ...values },
        {
          onSuccess: () => {
            toast({ title: "Sucesso", description: "Tarefa atualizada." });
            setDialogOpen(false);
          },
        },
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast({ title: "Sucesso", description: "Tarefa criada." });
          setDialogOpen(false);
        },
      });
    }
  };

  const toggleStatus = (task: TaskWithCategory, newStatus: boolean) => {
    updateMutation.mutate({ id: task.id, isActive: newStatus });
  };

  const isLoading = loadingTasks || loadingCategories;
  const activeCategories = categories?.filter(c => c.isActive) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Tarefas
          </h1>
          <p className="text-muted-foreground mt-1">
            Catálogo de atividades mapeadas.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => openDialog()}
              className="bg-primary shadow-lg shadow-primary/20"
            >
              <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingTask ? "Editar Tarefa" : "Criar Tarefa"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 pt-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Tarefa</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
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
                          {activeCategories.map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.name}
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Status Ativo
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="pt-4 flex justify-end">
                  <Button
                    type="submit"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Salvar
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-lg shadow-black/5 border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : tasks?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nenhuma tarefa cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                tasks?.map((task) => (
                  <TableRow
                    key={task.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-medium">{task.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" style={{ borderColor: task.category?.color, color: task.category?.color }}>
                        {task.category?.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {task.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={task.isActive ? "default" : "secondary"}
                        className={
                          task.isActive
                            ? "bg-emerald-500 hover:bg-emerald-600"
                            : ""
                        }
                      >
                        {task.isActive ? "Ativo" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Switch
                          checked={task.isActive}
                          onCheckedChange={(c) => toggleStatus(task, c)}
                          disabled={updateMutation.isPending}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDialog(task)}
                        >
                          <Edit2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
