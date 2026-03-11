import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, Clock, Building2, CalendarDays } from 'lucide-react';
import { analyticsAPI } from '../services/api';
import type { AnalyticsResponse, PeakHoursResponse } from '../types';

const COLORS = ['#0c8ce9', '#d946ef', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6'];

export default function AnalyticsPage() {
  const [utilization, setUtilization] = useState<AnalyticsResponse | null>(null);
  const [peakHours, setPeakHours] = useState<PeakHoursResponse | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [days]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, pRes] = await Promise.all([
        analyticsAPI.utilization(days),
        analyticsAPI.peakHours(days),
      ]);
      setUtilization(uRes.data);
      setPeakHours(pRes.data);
    } finally {
      setLoading(false);
    }
  };

  const formatHour = (h: number) => {
    if (h === 0) return '12am';
    if (h < 12) return `${h}am`;
    if (h === 12) return '12pm';
    return `${h - 12}pm`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-campus-300 border-t-campus-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Resource utilization and booking patterns</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-campus-500 focus:ring-2 focus:ring-campus-200 outline-none"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Summary Cards */}
      {utilization && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <Building2 size={16} /> Total Resources
            </div>
            <p className="text-2xl font-display font-bold text-slate-900">{utilization.total_resources}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <CalendarDays size={16} /> Total Bookings
            </div>
            <p className="text-2xl font-display font-bold text-slate-900">{utilization.total_bookings}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <TrendingUp size={16} /> Avg Utilization
            </div>
            <p className="text-2xl font-display font-bold text-slate-900">{utilization.avg_utilization}%</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <Clock size={16} /> Peak Hour
            </div>
            <p className="text-2xl font-display font-bold text-slate-900">
              {peakHours ? formatHour(peakHours.busiest_hour) : '-'}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Utilization Chart */}
        {utilization && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-display font-semibold text-slate-900 mb-4">Resource Utilization</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={utilization.utilization}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="resource_name"
                  tick={{ fontSize: 11 }}
                  angle={-30}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
                  formatter={(val: number) => [`${val}%`, 'Utilization']}
                />
                <Bar dataKey="utilization_pct" fill="#0c8ce9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Peak Hours Chart */}
        {peakHours && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-display font-semibold text-slate-900 mb-4">Booking Volume by Hour</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={peakHours.peak_hours.filter((h) => h.hour >= 7 && h.hour <= 22)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 11 }}
                  tickFormatter={formatHour}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
                  labelFormatter={(h) => formatHour(h as number)}
                  formatter={(val: number) => [val, 'Bookings']}
                />
                <Bar dataKey="booking_count" fill="#d946ef" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Booking Distribution Pie */}
      {utilization && utilization.utilization.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-display font-semibold text-slate-900 mb-4">Booking Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={utilization.utilization.filter((u) => u.total_bookings > 0)}
                dataKey="total_bookings"
                nameKey="resource_name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ resource_name, total_bookings }) => `${resource_name}: ${total_bookings}`}
                labelLine={{ stroke: '#94a3b8' }}
              >
                {utilization.utilization.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
