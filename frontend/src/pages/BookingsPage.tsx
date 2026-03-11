import React, { useEffect, useState } from 'react';
import { format, isPast } from 'date-fns';
import {
  CalendarDays, Clock, Trash2, AlertCircle, CheckCircle,
  XCircle, Filter, Loader2,
} from 'lucide-react';
import { bookingAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Booking, BookingStatus } from '../types';

const statusConfig: Record<BookingStatus, { color: string; icon: React.ElementType }> = {
  confirmed: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  cancelled: { color: 'bg-red-100 text-red-700', icon: XCircle },
  completed: { color: 'bg-slate-100 text-slate-500', icon: CheckCircle },
};

export default function BookingsPage() {
  const { isAdmin } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BookingStatus | ''>('');
  const [cancelling, setCancelling] = useState<number | null>(null);

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const { data } = await bookingAPI.list({
        status: filter || undefined,
      });
      setBookings(data);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this booking?')) return;
    setCancelling(id);
    try {
      await bookingAPI.cancel(id);
      loadBookings();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to cancel');
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          {isAdmin ? 'All Bookings' : 'My Bookings'}
        </h1>
        <p className="text-slate-500 text-sm mt-1">Manage your scheduled bookings</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['', 'confirmed', 'cancelled', 'completed'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s as BookingStatus | '')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-campus-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-campus-300'
            }`}
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-3 border-campus-300 border-t-campus-600 rounded-full animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <AlertCircle size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const StatusIcon = statusConfig[b.status].icon;
            const past = isPast(new Date(b.end_time));
            return (
              <div
                key={b.id}
                className={`bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 transition-all hover:shadow-sm ${
                  past && b.status === 'confirmed' ? 'opacity-60' : ''
                }`}
              >
                <div className="w-14 h-14 rounded-xl bg-campus-50 border border-campus-200 flex flex-col items-center justify-center text-campus-700 shrink-0">
                  <span className="text-sm font-mono font-bold leading-none">
                    {format(new Date(b.start_time), 'dd')}
                  </span>
                  <span className="text-[10px] font-mono uppercase">
                    {format(new Date(b.start_time), 'MMM')}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-slate-900 truncate">{b.title}</h3>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md ${statusConfig[b.status].color}`}>
                      {b.status}
                    </span>
                    {b.recurring_group_id && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-100 text-purple-600">
                        recurring
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    {b.resource?.name || `Resource #${b.resource_id}`}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {format(new Date(b.start_time), 'h:mm a')} – {format(new Date(b.end_time), 'h:mm a')}
                    </span>
                    {b.user && isAdmin && (
                      <span>by {b.user.full_name}</span>
                    )}
                  </div>
                </div>

                {b.status === 'confirmed' && !past && (
                  <button
                    onClick={() => handleCancel(b.id)}
                    disabled={cancelling === b.id}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Cancel booking"
                  >
                    {cancelling === b.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
