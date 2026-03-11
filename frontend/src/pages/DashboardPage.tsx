import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Building2, Clock, TrendingUp, ArrowRight, AlertCircle } from 'lucide-react';
import { format, isPast, isFuture } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { bookingAPI, resourceAPI } from '../services/api';
import type { Booking, Resource } from '../types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      bookingAPI.list({ upcoming: true }),
      resourceAPI.list(),
    ]).then(([bRes, rRes]) => {
      setBookings(bRes.data);
      setResources(rRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const upcomingBookings = bookings
    .filter((b) => b.status === 'confirmed' && isFuture(new Date(b.start_time)))
    .slice(0, 5);

  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;

  const stats = [
    { label: 'Upcoming Bookings', value: confirmedCount, icon: CalendarDays, color: 'bg-campus-100 text-campus-700' },
    { label: 'Available Resources', value: resources.length, icon: Building2, color: 'bg-emerald-100 text-emerald-700' },
    { label: 'Hours This Week', value: Math.round(bookings.reduce((acc, b) => {
      if (b.status !== 'confirmed') return acc;
      return acc + (new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) / 3600000;
    }, 0)), icon: Clock, color: 'bg-amber-100 text-amber-700' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-campus-300 border-t-campus-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Welcome back, {user?.full_name?.split(' ')[0]}
        </h1>
        <p className="text-slate-500 mt-1">Here's your campus booking overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon size={20} />
              </div>
              <span className="text-sm text-slate-500">{s.label}</span>
            </div>
            <p className="text-3xl font-display font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Upcoming Bookings */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-display font-semibold text-slate-900">Upcoming Bookings</h2>
          <Link to="/bookings" className="text-sm text-campus-600 hover:text-campus-700 flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {upcomingBookings.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle size={24} className="text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No upcoming bookings</p>
            <Link to="/resources" className="text-sm text-campus-600 hover:underline mt-1 inline-block">
              Browse resources to book
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcomingBookings.map((b) => (
              <div key={b.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-campus-50 border border-campus-200 flex flex-col items-center justify-center text-campus-700 shrink-0">
                  <span className="text-xs font-mono font-bold leading-none">
                    {format(new Date(b.start_time), 'dd')}
                  </span>
                  <span className="text-[10px] font-mono uppercase">
                    {format(new Date(b.start_time), 'MMM')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{b.title}</p>
                  <p className="text-xs text-slate-500">
                    {b.resource?.name} · {format(new Date(b.start_time), 'h:mm a')} – {format(new Date(b.end_time), 'h:mm a')}
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2 py-1 rounded-md bg-emerald-100 text-emerald-700">
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Resource Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-slate-900">Quick Book</h2>
          <Link to="/resources" className="text-sm text-campus-600 hover:text-campus-700 flex items-center gap-1">
            All resources <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {resources.slice(0, 8).map((r) => (
            <Link
              key={r.id}
              to={`/resources?book=${r.id}`}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:border-campus-300 hover:shadow-md hover:shadow-campus-100/50 transition-all group"
            >
              <div className="text-xs font-mono uppercase text-slate-400 mb-1">{r.resource_type}</div>
              <p className="text-sm font-medium text-slate-900 group-hover:text-campus-700 transition-colors truncate">
                {r.name}
              </p>
              {r.capacity && (
                <p className="text-xs text-slate-400 mt-1">Cap: {r.capacity}</p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
