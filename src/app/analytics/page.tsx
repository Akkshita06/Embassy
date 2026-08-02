"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Panel } from "@/components/panel";
import { AnimatedCounter } from "@/components/animated-counter";
import { analyticsSummary } from "@/lib/mock-data";

const stats = [
  { label: "Total purchases", value: analyticsSummary.totalPurchases, suffix: "", color: "var(--ink)" },
  { label: "Approval rate", value: Math.round(analyticsSummary.approvalRate * 100), suffix: "%", color: "var(--green)" },
  { label: "Escalation rate", value: Math.round(analyticsSummary.escalationRate * 100), suffix: "%", color: "var(--amber)" },
  { label: "Denial rate", value: Math.round(analyticsSummary.denialRate * 100), suffix: "%", color: "var(--red)" },
];

const pieColors = ["#c9a227", "#3dd68c", "#8a90a2"];

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Insights</p>
        <h1 className="mt-1 font-display text-3xl">Analytics</h1>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Panel interactive className="px-5 py-5">
              <div className="text-xs text-muted">{s.label}</div>
              <div className="mt-2 font-display text-3xl" style={{ color: s.color }}>
                <AnimatedCounter value={s.value} suffix={s.suffix} />
              </div>
            </Panel>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel interactive className="px-6 py-6">
          <h2 className="mb-1 font-display text-lg">Weekly volume</h2>
          <p className="mb-4 text-xs text-muted">Approved, escalated, and denied purchases by day.</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsSummary.weeklyVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} width={28} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                  cursor={{ fill: "rgba(20,20,20,0.04)" }}
                />
                <Bar dataKey="approved" stackId="a" fill="#3dd68c" radius={[0, 0, 0, 0]} />
                <Bar dataKey="escalated" stackId="a" fill="#f0a93c" />
                <Bar dataKey="denied" stackId="a" fill="#f0554c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel interactive className="px-6 py-6">
          <h2 className="mb-1 font-display text-lg">Mandate usage</h2>
          <p className="mb-4 text-xs text-muted">Purchases attributed to each mandate.</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsSummary.mandateUsage}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {analyticsSummary.mandateUsage.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: "var(--muted)" }}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}
