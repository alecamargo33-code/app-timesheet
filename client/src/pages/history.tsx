import { useState, useMemo } from "react";
import { useTimeLogs, useDeleteTimeLog } from "@/hooks/use-time-logs";
import { useUsers } from "@/hooks/use-users";
import { useCategories } from "@/hooks/use-categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Loader2, Download, Search } from "lucide-react";
import { format, parseISO, isWithinInterval } from "date-fns";

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export default function History() {
  const { data: logs, isLoading } = useTimeLogs();
  const { data: users } = useUsers();
  const { data: categories } = useCategories();
  const deleteMutation = useDeleteTimeLog();

  const [filterUser, setFilterUser] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs
      .filter((log) => {
        const matchUser =
          filterUser === "all" || log.userId.toString() === filterUser;
        const matchCat =
          filterCategory === "all" || log.task.category?.name === filterCategory;

        let matchDate = true;
        if (dateFrom && dateTo) {
          const logDate = parseISO(log.date);
          const from = parseISO(dateFrom);
          const to = parseISO(dateTo);
          // Reset times for accurate day comparison
          from.setHours(0, 0, 0, 0);
          to.setHours(23, 59, 59, 999);
          matchDate = isWithinInterval(logDate, { start: from, end: to });
        }

        return matchUser && matchCat && matchDate;
      })
      .sort((a, b) => b.id - a.id);
  }, [logs, filterUser, filterCategory, dateFrom, dateTo]);

  const totalMinutes = filteredLogs.reduce(
    (acc, log) => acc + log.durationMinutes,
    0,
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Histórico e Relatórios
        </h1>
        <p className="text-muted-foreground mt-1">
          Análise detalhada de todos os lançamentos.
        </p>
      </div>

      <Card className="shadow-md shadow-black/5 border-border/50">
        <CardHeader className="pb-4 border-b border-border/50">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Usuário</label>
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {users?.map((u) => (
                  <SelectItem key={u.id} value={u.id.toString()}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoria</label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories?.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Data Inicial</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Data Final</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-end">
        <div className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-lg font-medium flex items-center gap-2">
          <span>Total no Período:</span>
          <span className="text-xl font-display font-bold">
            {formatDuration(totalMinutes)}
          </span>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      <Card className="shadow-lg shadow-black/5 border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Tarefa</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Duração</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nenhum registro encontrado para os filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium whitespace-nowrap">
                      {format(parseISO(log.date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{log.user.name}</TableCell>
                    <TableCell
                      className="max-w-[200px] truncate"
                      title={log.task.name}
                    >
                      {log.task.name}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className="font-normal" 
                        style={log.task.category ? { borderColor: log.task.category.color, color: log.task.category.color } : {}}
                      >
                        {log.task.category?.name || "Sem Categoria"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {log.startTime} - {log.endTime}
                    </TableCell>
                    <TableCell className="text-right font-medium text-primary">
                      {formatDuration(log.durationMinutes)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-destructive"
                        onClick={() => {
                          if (confirm("Excluir este registro?"))
                            deleteMutation.mutate(log.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
