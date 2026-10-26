"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { date: string; count: number };

export function RegistrationsChart({ data }: { data: Point[] }) {
  if (!data.length) return <p className="empty">No registration events in this period.</p>;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid stroke="#373737" strokeDasharray="4 4" />
        <XAxis dataKey="date" stroke="#959595" tick={{ fontSize: 11 }} />
        <YAxis stroke="#959595" tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip contentStyle={{ background: "#181818", border: "1px solid #373737" }} />
        <Line type="monotone" dataKey="count" stroke="#b8ff45" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ViewsChart({ data }: { data: Point[] }) {
  if (!data.length) return <p>No prompt views recorded yet.</p>;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid stroke="#373737" strokeDasharray="4 4" />
        <XAxis dataKey="date" stroke="#959595" tick={{ fontSize: 11 }} />
        <YAxis stroke="#959595" tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip contentStyle={{ background: "#181818", border: "1px solid #373737" }} />
        <Line type="monotone" dataKey="count" stroke="#1d9bf0" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CategoryBarChart({ data }: { data: { name: string; events: number }[] }) {
  if (!data.length) return <p>No category engagement yet.</p>;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid stroke="#373737" strokeDasharray="4 4" />
        <XAxis dataKey="name" stroke="#959595" tick={{ fontSize: 11 }} />
        <YAxis stroke="#959595" tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip contentStyle={{ background: "#181818", border: "1px solid #373737" }} />
        <Bar dataKey="events" fill="#ff00b8" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
