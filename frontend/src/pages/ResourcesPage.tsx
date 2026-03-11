import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2, FlaskConical, Wrench, Search, Filter, Users,
  MapPin, X, CalendarDays, Clock, Check, AlertCircle, Loader2,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { resourceAPI, bookingAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Resource, ResourceType, AvailabilitySlot } from '../types';

const typeIcons: Record<ResourceType, React.ElementType> = {
  room: Building2, lab: FlaskConical, equipment: Wrench,
};

const typeColors: Record<ResourceType, string> = {
  room: 'bg-blue-100 text-blue-700',
  lab: 'bg-purple-100 text-purple-700',
  equipment: 'bg-amber-100 text-amber-700',
};

export default function ResourcesPage() {
  const { isAdmin } = useAuth();
  const [params, setParams] = useSearchParams();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ResourceType | ''>('');

  // Booking modal state
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [bookingForm, setBookingForm] = useState({
    title: '', description: '', start_time: '', end_time: '',
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMsg, setBookingMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadResources();
  }, [typeFilter]);

  useEffect(() => {
    const bookId = params.get('book');
    if (bookId && resources.length) {
      const r = resources.find((res) => res.id === Number(bookId));
      if (r) openBooking(r);
      setParams({});
    }
  }, [resources, params]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const { data } = await resourceAPI.list({
        resource_type: typeFilter || undefined,
        search: search || undefined,
      });
      setResources(data);
    } finally {
      setLoading(false);
    }
  };

  const openBooking = async (resource: Resource) => {
    setSelectedResource(resource);
    setBookingMsg(null);
    setBookingForm({ title: '', description: '', start_time: '', end_time: '' });
    loadSlots(resource.id, selectedDate);
  };

  const loadSlots = async (resourceId: number, date: string) => {
    try {
      const { data } = await resourceAPI.availability(resourceId, date);
      setSlots(data);
    } catch {
      setSlots([]);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (selectedResource) loadSlots(selectedResource.id, date);
  };

  const handleSlotClick = (slot: AvailabilitySlot) => {
    if (!slot.is_available) return;
    setBookingForm((prev) => ({
      ...prev,
      start_time: slot.start_time,
      end_time: slot.end_time,
    }));
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResource || !bookingForm.start_time || !bookingForm.end_time) return;

    setBookingLoading(true);
    setBookingMsg(null);
    try {
      await bookingAPI.create({
        resource_id: selectedResource.id,
        title: bookingForm.title,
        description: bookingForm.description || undefined,
        start_time: bookingForm.start_time,
        end_time: bookingForm.end_time,
      });
      setBookingMsg({ type: 'success', text: 'Booking confirmed!' });
      loadSlots(selectedResource.id, selectedDate);
      setBookingForm({ title: '', description: '', start_time: '', end_time: '' });
    } catch (err: any) {
      setBookingMsg({
        type: 'error',
        text: err.response?.data?.detail || 'Booking failed',
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const filtered = resources.filter((r) =>
    !search || r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Resources</h1>
          <p className="text-slate-500 text-sm mt-1">Browse and book campus resources</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadResources()}
            placeholder="Search resources..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:border-campus-500 focus:ring-2 focus:ring-campus-200 outline-none transition text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(['', 'room', 'lab', 'equipment'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t as ResourceType | '')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === t
                  ? 'bg-campus-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-campus-300'
              }`}
            >
              {t ? t.charAt(0).toUpperCase() + t.slice(1) + 's' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-3 border-campus-300 border-t-campus-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => {
            const Icon = typeIcons[r.resource_type];
            return (
              <div key={r.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-campus-200 transition-all">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeColors[r.resource_type]}`}>
                      <Icon size={20} />
                    </div>
                    <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                      {r.resource_type}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-slate-900 mb-1">{r.name}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">{r.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    {r.location && (
                      <span className="flex items-center gap-1"><MapPin size={12} /> {r.location}</span>
                    )}
                    {r.capacity && (
                      <span className="flex items-center gap-1"><Users size={12} /> {r.capacity}</span>
                    )}
                  </div>
                  {r.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {r.amenities.slice(0, 4).map((a) => (
                        <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
                          {a}
                        </span>
                      ))}
                      {r.amenities.length > 4 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">
                          +{r.amenities.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                  <button
                    onClick={() => openBooking(r)}
                    className="w-full text-sm font-medium text-campus-600 hover:text-campus-700 flex items-center justify-center gap-1.5 py-1"
                  >
                    <CalendarDays size={14} /> Check Availability & Book
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Modal */}
      {selectedResource && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedResource(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h2 className="font-display font-bold text-lg text-slate-900">{selectedResource.name}</h2>
                <p className="text-sm text-slate-500">Select a time slot to book</p>
              </div>
              <button onClick={() => setSelectedResource(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Date picker */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  max={format(addDays(new Date(), 30), 'yyyy-MM-dd')}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-campus-500 focus:ring-2 focus:ring-campus-200 outline-none text-sm"
                />
              </div>

              {/* Availability slots */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Available Slots</label>
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => {
                    const isSelected = bookingForm.start_time === slot.start_time;
                    return (
                      <button
                        key={slot.start_time}
                        onClick={() => handleSlotClick(slot)}
                        disabled={!slot.is_available}
                        className={`p-2 rounded-lg text-xs font-mono text-center transition-all ${
                          !slot.is_available
                            ? 'bg-red-50 text-red-300 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-campus-600 text-white ring-2 ring-campus-300'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {format(new Date(slot.start_time), 'h:mm a')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {bookingMsg && (
                <div className={`p-3 rounded-lg text-sm ${
                  bookingMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {bookingMsg.text}
                </div>
              )}

              {/* Booking form */}
              <form onSubmit={handleBooking} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Booking Title</label>
                  <input
                    type="text"
                    value={bookingForm.title}
                    onChange={(e) => setBookingForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-campus-500 focus:ring-2 focus:ring-campus-200 outline-none text-sm"
                    placeholder="e.g., Team Meeting, Lab Session"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
                  <textarea
                    value={bookingForm.description}
                    onChange={(e) => setBookingForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-campus-500 focus:ring-2 focus:ring-campus-200 outline-none text-sm"
                    rows={2}
                    placeholder="Brief description..."
                  />
                </div>
                {bookingForm.start_time && (
                  <div className="p-3 rounded-lg bg-campus-50 border border-campus-200 text-sm">
                    <Clock size={14} className="inline mr-1 text-campus-600" />
                    {format(new Date(bookingForm.start_time), 'MMM d, h:mm a')} – {format(new Date(bookingForm.end_time), 'h:mm a')}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={bookingLoading || !bookingForm.title || !bookingForm.start_time}
                  className="w-full flex items-center justify-center gap-2 bg-campus-600 hover:bg-campus-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {bookingLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <><Check size={16} /> Confirm Booking</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
