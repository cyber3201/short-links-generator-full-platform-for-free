"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Power, Play, Link, Calendar, Globe, MousePointerClick, Activity, Copy, Lock, Trash2, Loader2, MapPin, RefreshCw, Clock, Monitor, ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LocationStat {
  country: string;
  city: string;
  count: number;
  percentage: number;
}

interface ClickEntry {
  id: string;
  clicked_at: string;
  country: string;
  city: string;
  ip_address: string;
}

interface HourlyDataPoint {
  hour: string;
  clicks: number;
}

export interface LinkDetailPageProps {
  linkId: string;
  onBack: () => void;
}

export function LinkDetailPage({ linkId, onBack }: LinkDetailPageProps) {
  const [link, setLink] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [locationStats, setLocationStats] = useState<LocationStat[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [realClickCount, setRealClickCount] = useState(0);
  const [clickLog, setClickLog] = useState<ClickEntry[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyDataPoint[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchLinkData();
  }, [linkId]);

  const fetchLinkData = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('urls')
      .select('*')
      .eq('id', linkId)
      .single();

    if (!error && data) {
      setLink(data);
      await fetchClickStats(data.id);
    }
    setIsLoading(false);
  };

  const fetchClickStats = async (urlId: string) => {
    setIsLoadingStats(true);
    try {
      const { data, error } = await supabase
        .from('clicks')
        .select('id, country, city, clicked_at, ip_address')
        .eq('url_id', urlId)
        .order('clicked_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const total = data.length;
        setRealClickCount(total);
        supabase.from('urls').update({ clicks: total }).eq('id', urlId).then();

        setClickLog(data.map(d => ({
          id: d.id,
          clicked_at: d.clicked_at,
          country: d.country || 'Unknown',
          city: d.city || 'Unknown',
          ip_address: d.ip_address || 'N/A'
        })));

        // Hourly chart (last 24h)
        const now = new Date();
        const hourlyMap: Record<string, number> = {};
        for (let i = 23; i >= 0; i--) {
          const h = new Date(now.getTime() - i * 60 * 60 * 1000);
          const key = h.toLocaleTimeString('en-US', { hour: '2-digit', hour12: true });
          hourlyMap[key] = 0;
        }
        data.forEach(click => {
          const clickTime = new Date(click.clicked_at);
          const hoursDiff = (now.getTime() - clickTime.getTime()) / (1000 * 60 * 60);
          if (hoursDiff <= 24) {
            const key = clickTime.toLocaleTimeString('en-US', { hour: '2-digit', hour12: true });
            if (hourlyMap[key] !== undefined) hourlyMap[key]++;
          }
        });
        setHourlyData(Object.entries(hourlyMap).map(([hour, clicks]) => ({ hour, clicks })));

        // Location stats
        const aggregated: Record<string, { country: string; city: string; count: number }> = {};
        data.forEach(click => {
          const country = click.country || 'Unknown';
          const city = click.city || 'Unknown';
          const key = `${country}|${city}`;
          if (!aggregated[key]) aggregated[key] = { country, city, count: 0 };
          aggregated[key].count++;
        });
        setLocationStats(
          Object.values(aggregated)
            .map(entry => ({ ...entry, percentage: Math.round((entry.count / total) * 100) }))
            .sort((a, b) => b.count - a.count)
        );
      } else {
        setRealClickCount(0);
        setLocationStats([]);
        setClickLog([]);
        setHourlyData([]);
      }
    } catch (err) {
      console.error('Failed to fetch click stats', err);
    }
    setIsLoadingStats(false);
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleStatusChange = async (newStatus: boolean) => {
    if (!link) return;
    await supabase.from('urls').update({ is_active: newStatus }).eq('id', link.id);
    setLink({ ...link, is_active: newStatus });
  };

  const handleDelete = async () => {
    if (!link) return;
    setIsDeleting(true);
    await supabase.from('urls').delete().eq('id', link.id);
    setIsDeleting(false);
    onBack();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  if (isLoading || !link) {
    return (
      <div className="w-full px-4 sm:px-8 py-12 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const shortUrl = `${window.location.origin}/${link.short_code}`;

  return (
    <div className="w-full px-4 sm:px-8 py-6 animate-in fade-in duration-300">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border border-border/50"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="overflow-hidden">
              <h1 className="text-xl font-bold text-foreground truncate max-w-[250px] sm:max-w-[500px]" title={link.original_url}>
                {link.original_url}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-primary font-mono text-sm font-semibold">{shortUrl}</span>
                <button
                  onClick={() => handleCopy(shortUrl)}
                  className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md transition-colors"
                  title="Copy short link"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {link.is_password_protected && (
                  <div className="bg-amber-500/10 text-amber-500 p-1 rounded-md border border-amber-500/20" title="Password Protected">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {link.is_active ? (
              <motion.button
                className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-xl text-sm font-semibold transition-colors"
                onClick={() => handleStatusChange(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Power className="w-4 h-4" /> Stop Link
              </motion.button>
            ) : (
              <motion.button
                className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 rounded-xl text-sm font-semibold transition-colors"
                onClick={() => handleStatusChange(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Play className="w-4 h-4" /> Enable Link
              </motion.button>
            )}
            <motion.button
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl text-sm font-semibold transition-colors"
              onClick={handleDelete}
              disabled={isDeleting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </motion.button>
            <motion.button
              className="flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 rounded-xl text-sm font-semibold transition-colors"
              onClick={fetchLinkData}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </motion.button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-2xl p-5 border border-border/40 shadow-sm flex flex-col justify-center">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <MousePointerClick className="w-3.5 h-3.5" /> Total Clicks
            </label>
            <div className="text-3xl font-extrabold text-foreground">
              {realClickCount || link.clicks || 0}
            </div>
          </div>
          <div className="bg-card rounded-2xl p-5 border border-border/40 shadow-sm flex flex-col justify-center">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Calendar className="w-3.5 h-3.5" /> Created On
            </label>
            <div className="text-base font-semibold text-foreground">
              {formatDate(link.created_at)}
            </div>
          </div>
          <div className="bg-card rounded-2xl p-5 border border-border/40 shadow-sm flex flex-col justify-center">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Power className="w-3.5 h-3.5" /> Status
            </label>
            <div className="mt-1 inline-flex">
              {link.is_active !== false ? (
                <div className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30">
                  <span className="text-green-400 text-sm font-medium">Active</span>
                </div>
              ) : (
                <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30">
                  <span className="text-red-400 text-sm font-medium">Disabled</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hourly Area Chart */}
        <div className="bg-card rounded-2xl p-5 border border-border/40 shadow-sm">
          <label className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-primary" /> Clicks Over Time (Last 24h)
          </label>
          {isLoadingStats ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : hourlyData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No click data available yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={hourlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="clickGradientPage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F14F44" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F14F44" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} 
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                  interval={2}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} 
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    fontSize: '13px',
                    color: '#fff',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.4)'
                  }}
                  labelStyle={{ color: '#fff', fontWeight: 600 }}
                  itemStyle={{ color: '#F14F44' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="#F14F44" 
                  strokeWidth={2}
                  fill="url(#clickGradientPage)" 
                  dot={{ r: 3, fill: '#F14F44', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#F14F44', strokeWidth: 2, stroke: '#111' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Location Breakdown */}
          <div className="bg-card rounded-2xl p-5 border border-border/40 shadow-sm">
            <label className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-primary" /> Location Breakdown
            </label>
            {isLoadingStats ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : locationStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Globe className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No location data tracked yet.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 bg-muted/30 rounded-lg">
                  <div className="col-span-4">Country</div>
                  <div className="col-span-3">City</div>
                  <div className="col-span-2 text-center">Clicks</div>
                  <div className="col-span-3 text-right">Share</div>
                </div>
                {locationStats.map((stat, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center text-sm px-3 py-2.5 rounded-lg hover:bg-muted/20 transition-colors">
                    <div className="col-span-4 font-medium text-foreground flex items-center gap-1.5 truncate">
                      <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{stat.country}</span>
                    </div>
                    <div className="col-span-3 text-muted-foreground truncate">{stat.city}</div>
                    <div className="col-span-2 text-center font-mono font-semibold text-foreground">{stat.count}</div>
                    <div className="col-span-3 flex items-center gap-2 justify-end">
                      <div className="hidden sm:block flex-1 max-w-[80px] h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${stat.percentage}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground min-w-[35px] text-right">{stat.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Performance */}
          <div className="bg-card rounded-2xl p-5 border border-border/40 shadow-sm">
            <label className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-primary" /> Link Info
            </label>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl">
                <span className="text-sm text-muted-foreground">Original URL</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate max-w-[120px] sm:max-w-[200px]" title={link.original_url}>{link.original_url}</span>
                  <button onClick={() => handleCopy(link.original_url)} className="p-1 hover:bg-muted rounded-md transition-colors">
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl">
                <span className="text-sm text-muted-foreground">Short Code</span>
                <span className="text-sm font-mono font-semibold text-primary">/{link.short_code}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl">
                <span className="text-sm text-muted-foreground">Protection</span>
                <span className="text-sm font-medium text-foreground">
                  {link.is_password_protected ? '🔒 Password Protected' : '🌐 Public'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl">
                <span className="text-sm text-muted-foreground">Avg. Clicks/Day</span>
                <span className="text-sm font-semibold text-foreground">
                  {(() => {
                    const days = Math.max(1, Math.ceil((Date.now() - new Date(link.created_at).getTime()) / (1000*60*60*24)));
                    return ((realClickCount || link.clicks || 0) / days).toFixed(1);
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Click Activity Log */}
        <div className="bg-card rounded-2xl p-5 border border-border/40 shadow-sm">
          <label className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-primary" /> Click Activity Log
          </label>
          {isLoadingStats ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : clickLog.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No clicks recorded yet.</p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto overflow-x-auto space-y-1">
              <div className="min-w-[600px]">
                <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2.5 bg-card border-b border-border/40 rounded-lg sticky top-0 z-10">
                  <div className="col-span-3">Time</div>
                  <div className="col-span-3">Country</div>
                  <div className="col-span-2">City</div>
                  <div className="col-span-3">IP Address</div>
                  <div className="col-span-1 text-right">Device</div>
                </div>
                {clickLog.map((entry) => (
                  <div key={entry.id} className="grid grid-cols-12 gap-2 items-center text-sm px-3 py-2.5 rounded-lg hover:bg-muted/20 transition-colors">
                    <div className="col-span-3 text-foreground font-medium flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="truncate text-xs">
                        {new Date(entry.clicked_at).toLocaleString('en-US', { 
                          month: 'short', day: 'numeric', 
                          hour: '2-digit', minute: '2-digit', hour12: true 
                        })}
                      </span>
                    </div>
                    <div className="col-span-3 text-foreground truncate flex items-center gap-1.5">
                      <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{entry.country}</span>
                    </div>
                    <div className="col-span-2 text-muted-foreground truncate">{entry.city}</div>
                    <div className="col-span-3 font-mono text-xs text-muted-foreground truncate">
                      {entry.ip_address}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Monitor className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
