import { useState, useMemo } from "react";
import { useTimeLogs } from "@/hooks/use-time-logs";
import { useUsers } from "@/hooks/use-users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Calendar, TrendingUp, Trophy, AlertCircle } from "lucide-react";
import { isToday, isThisWeek, parseISO } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function Dashboard() {
  const {
    data: logs,
    isLoading: loadingLogs,
    error: errorLogs,
  } = useTimeLogs();
  const { data: users, isLoading: loadingUsers } = useUsers();
  const [selectedUser, setSelectedUser] = useState<string>("all");

  const metrics = useMemo(() => {
    if (!logs) return null;

    const filteredLogs =
      selectedUser === "all"
        ? logs
        : logs.filter((l) => l.userId.toString() === selectedUser);

    let todayMins = 0;
    let weekMins = 0;
    const userTotals: Record<number, { name: string; mins: number }> = {};
    const categoryTotals: Record<string, number> = {};
    const dailyTotals: Record<string, number> = {};

    filteredLogs.forEach((log) => {
      const date = parseISO(log.date);
      if (isToday(date)) todayMins += log.durationMinutes;
      if (isThisWeek(date, { weekStartsOn: 1 }))
        weekMins += log.durationMinutes;

      // Group by user for "Top User"
      if (!userTotals[log.userId]) {
        userTotals[log.userId] = { name: log.user.name, mins: 0 };
      }
      userTotals[log.userId].mins += log.durationMinutes;

      // Group by category
      const cat = log.task.category;
      categoryTotals[cat] = (categoryTotals[cat] || 0) + log.durationMinutes;

      // Group by day for line chart
      dailyTotals[log.date] =
        (dailyTotals[log.date] || 0) + log.durationMinutes;
    });

    let topUser = { name: "-", mins: 0 };
    Object.values(userTotals).forEach((u) => {
      if (u.mins > topUser.mins) topUser = u;
    });

    const uniqueDays = Object.keys(dailyTotals).length || 1;
    const avgMins = Math.round(
      Object.values(dailyTotals).reduce((a, b) => a + b, 0) / uniqueDays,
    );

    // Prepare chart data
    const pieData = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value: Number((value / 60).toFixed(1)),
    }));

    const barData = Object.entries(categoryTotals).map(([name, value]) => ({
      category: name,
      hours: Number((value / 60).toFixed(1)),
    }));

    const lineData = Object.entries(dailyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({
        date: date.split("-").slice(1).join("/"), // MM/DD
        hours: Number((value / 60).toFixed(1)),
      }));

    return {
      todayMins,
      weekMins,
      topUser,
      avgMins,
      pieData,
      barData,
      lineData,
    };
  }, [logs, selectedUser]);

  if (loadingLogs || loadingUsers) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  if (errorLogs) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>
          Falha ao carregar dados do dashboard.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão geral do tempo investido.
          </p>
        </div>
        <div className="w-full sm:w-64">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="bg-card shadow-sm border-border/50 h-11">
              <SelectValue placeholder="Filtrar por Usuário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Usuários</SelectItem>
              {users?.map((u) => (
                <SelectItem key={u.id} value={u.id.toString()}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {metrics && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-lg shadow-black/5 border-border/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Horas Hoje
                </CardTitle>
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-display">
                  {formatDuration(metrics.todayMins)}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg shadow-black/5 border-border/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Horas na Semana
                </CardTitle>
                <div className="h-10 w-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-display">
                  {formatDuration(metrics.weekMins)}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg shadow-black/5 border-border/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Média Diária
                </CardTitle>
                <div className="h-10 w-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-display">
                  {formatDuration(metrics.avgMins)}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg shadow-black/5 border-border/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top Usuário
                </CardTitle>
                <div className="h-10 w-10 bg-amber-500/10 rounded-full flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-amber-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className="text-xl font-bold truncate"
                  title={metrics.topUser.name}
                >
                  {selectedUser === "all"
                    ? metrics.topUser.name
                    : users?.find((u) => u.id.toString() === selectedUser)
                        ?.name || "-"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDuration(metrics.topUser.mins)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-lg shadow-black/5 border-border/50">
              <CardHeader>
                <CardTitle className="font-display">
                  Tempo por Categoria (Horas)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metrics.barData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 12,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 12,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                    />
                    <RechartsTooltip
                      cursor={{ fill: "hsl(var(--muted)/0.5)" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar
                      dataKey="hours"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-lg shadow-black/5 border-border/50">
              <CardHeader>
                <CardTitle className="font-display">
                  Evolução Diária (Horas)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={metrics.lineData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 12,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 12,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="hours"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: "hsl(var(--background))",
                        strokeWidth: 2,
                      }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-lg shadow-black/5 border-border/50 lg:col-span-2">
              <CardHeader>
                <CardTitle className="font-display">
                  Distribuição Total
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                {metrics.pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {metrics.pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-muted-foreground">
                    Sem dados para exibir.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
