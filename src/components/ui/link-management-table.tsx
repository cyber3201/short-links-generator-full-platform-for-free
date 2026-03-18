"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Power, Play, Link, Calendar, Globe, MousePointerClick, Activity } from "lucide-react";
import { supabase } from "../../lib/supabase";

export interface ShortLink {
  id: string;
  original_url: string;
  short_code: string;
  short_url: string;
  created_at: string;
  clicks: number;
  top_location: string;
  is_active: boolean;
  number: string; // generated for display
}

interface LinkManagementTableProps {
  userId: string;
  className?: string;
}

export function LinkManagementTable({
  userId,
  className = ""
}: LinkManagementTableProps) {
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [selectedLink, setSelectedLink] = useState<ShortLink | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLinks();
  }, [userId]);

  const fetchLinks = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('urls')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLinks(data.map((item, index) => ({
        ...item,
        is_active: item.is_active === undefined ? true : item.is_active,
        number: String(index + 1).padStart(2, '0')
      })));
    }
    setIsLoading(false);
  };

  const handleStatusChange = async (linkId: string, newActiveState: boolean) => {
    // Optimistic UI update
    setLinks(prev => prev.map(link => 
      link.id === linkId ? { ...link, is_active: newActiveState } : link
    ));

    if (selectedLink?.id === linkId) {
       setSelectedLink(prev => prev ? { ...prev, is_active: newActiveState } : null);
    }

    // Backend update
    const { error } = await supabase
      .from('urls')
      .update({ is_active: newActiveState })
      .eq('id', linkId);
      
    if (error) {
      console.error("Failed to update status", error);
      fetchLinks(); // Revert on failure
    }
  };

  const openLinkModal = (link: ShortLink) => {
    setSelectedLink(link);
  };

  const closeLinkModal = () => {
    setSelectedLink(null);
  };

  const getCPUBars = (clicks: number, is_active: boolean) => {
    const maxClicks = Math.max(1, ...links.map(l => l.clicks || 0));
    const percentage = clicks === 0 ? 0 : Math.max(5, Math.round((clicks / maxClicks) * 100));
    const filledBars = Math.round((percentage / 100) * 10);
    
    const getBarColor = (index: number) => {
      if (index >= filledBars) {
        return "bg-muted/40 border border-border/30";
      }
      return is_active ? "bg-primary" : "bg-muted-foreground/30";
    };
    
    return (
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className={`w-1.5 h-4 sm:h-5 rounded-full transition-all duration-500 ${getBarColor(index)}`}
            />
          ))}
        </div>
        <span className="text-xs sm:text-sm font-mono text-foreground font-medium min-w-[3rem]">
          {clicks}
        </span>
      </div>
    );
  };

  const getStatusBadge = (is_active: boolean) => {
    if (is_active) {
        return (
          <div className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center">
            <span className="text-green-400 text-xs sm:text-sm font-medium">Active</span>
          </div>
        );
    } else {
        return (
          <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <span className="text-red-400 text-xs sm:text-sm font-medium">Disabled</span>
          </div>
        );
    }
  };

  const getStatusGradient = (is_active: boolean) => {
    return is_active ? "from-green-500/5 to-transparent" : "from-red-500/5 to-transparent";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  if (isLoading) {
    return <div className="text-center py-10 text-muted-foreground animate-pulse">Loading dashboard...</div>;
  }

  if (links.length === 0) {
     return <div className="text-center py-10 text-muted-foreground">You haven't created any links yet.</div>;
  }

  return (
    <div className={`w-full mx-auto mt-10 ${className}`}>
      <div className="relative border border-border/30 rounded-2xl p-4 sm:p-6 bg-card/60 backdrop-blur-xl shadow-xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <h2 className="text-xl font-bold tracking-tight text-foreground">Link Analytics Dashboard</h2>
            </div>
          </div>
          <div className="text-sm font-medium text-muted-foreground bg-background/50 px-4 py-2 rounded-full border border-border/50">
            {links.filter(s => s.is_active).length} Active • {links.filter(s => !s.is_active).length} Disabled
          </div>
        </div>

        <div className="overflow-x-auto pb-4">
          <motion.div
            className="space-y-3 min-w-[800px]"
            variants={{
              visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
            }}
            initial="hidden"
            animate="visible"
          >
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-1">No</div>
              <div className="col-span-3">Original URL</div>
              <div className="col-span-2">Short Code</div>
              <div className="col-span-2">Location</div>
              <div className="col-span-2">Clicks Activity</div>
              <div className="col-span-1 border-l border-transparent">Created</div>
              <div className="col-span-1 text-right">Status</div>
            </div>

            {links.map((link) => (
              <motion.div
                key={link.id}
                variants={{
                  hidden: { opacity: 0, y: 10, scale: 0.98, filter: "blur(2px)" },
                  visible: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { type: "spring", stiffness: 350, damping: 25 } },
                }}
                className="relative cursor-pointer"
                onMouseEnter={() => setHoveredLink(link.id)}
                onMouseLeave={() => setHoveredLink(null)}
                onClick={() => openLinkModal(link)}
              >
                <motion.div
                  className="relative bg-background/80 border border-border/50 rounded-xl p-4 overflow-hidden transition-colors hover:border-primary/30"
                  whileHover={{ y: -2 }}
                >
                  <div 
                    className={`absolute inset-0 bg-gradient-to-l ${getStatusGradient(link.is_active)} pointer-events-none opacity-50`}
                    style={{ backgroundSize: "30% 100%", backgroundPosition: "right", backgroundRepeat: "no-repeat" }} 
                  />
                  
                  <div className="relative grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1">
                      <span className="text-xl font-bold text-muted-foreground/50">{link.number}</span>
                    </div>

                    <div className="col-span-3 flex items-center gap-3 pr-4 overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                        <Link className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-foreground font-medium truncate" title={link.original_url}>
                        {link.original_url}
                      </span>
                    </div>

                    <div className="col-span-2">
                      <span className="text-primary font-mono text-sm bg-primary/5 px-2.5 py-1 rounded-md border border-primary/10">
                        /{link.short_code}
                      </span>
                    </div>

                    <div className="col-span-2 flex items-center gap-2 text-sm text-foreground">
                      <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{link.top_location}</span>
                    </div>

                    <div className="col-span-2">
                      {getCPUBars(link.clicks, link.is_active)}
                    </div>

                    <div className="col-span-1 text-sm text-muted-foreground font-medium">
                      {formatDate(link.created_at)}
                    </div>

                    <div className="col-span-1 flex justify-end">
                      {getStatusBadge(link.is_active)}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <AnimatePresence>
          {selectedLink && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-md flex flex-col rounded-2xl z-20 overflow-hidden"
            >
              <div className="relative bg-gradient-to-r from-card to-transparent p-5 sm:p-6 border-b border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                    <Activity className="w-6 h-6 text-primary" />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-lg font-bold text-foreground truncate mt-1 w-full max-w-[250px] sm:max-w-md" title={selectedLink.original_url}>
                      {selectedLink.original_url}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-primary font-mono text-xs font-semibold tracking-wider">
                        {selectedLink.short_url}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {selectedLink.is_active ? (
                    <motion.button
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl text-sm font-semibold transition-colors"
                      onClick={() => handleStatusChange(selectedLink.id, false)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Power className="w-4 h-4" /> Stop Link
                    </motion.button>
                  ) : (
                    <motion.button
                      className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 rounded-xl text-sm font-semibold transition-colors"
                      onClick={() => handleStatusChange(selectedLink.id, true)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Play className="w-4 h-4" /> Enable Link
                    </motion.button>
                  )}

                  <motion.button
                    className="w-10 h-10 bg-background hover:bg-muted rounded-full flex items-center justify-center border border-border/50 text-muted-foreground ml-2 shadow-sm"
                    onClick={closeLinkModal}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-gradient-to-b from-transparent to-muted/10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-card rounded-2xl p-4 border border-border/40 shadow-sm flex flex-col justify-center">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <MousePointerClick className="w-3.5 h-3.5" /> Total Clicks
                    </label>
                    <div className="text-3xl font-extrabold text-foreground">
                      {selectedLink.clicks}
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl p-4 border border-border/40 shadow-sm flex flex-col justify-center">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <Globe className="w-3.5 h-3.5" /> Top Location
                    </label>
                    <div className="text-lg font-semibold text-foreground truncate">
                      {selectedLink.top_location}
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl p-4 border border-border/40 shadow-sm flex flex-col justify-center">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <Calendar className="w-3.5 h-3.5" /> Created On
                    </label>
                    <div className="text-base font-semibold text-foreground">
                      {formatDate(selectedLink.created_at)}
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl p-4 border border-border/40 shadow-sm flex flex-col justify-center">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <Power className="w-3.5 h-3.5" /> Status
                    </label>
                    <div className="mt-1 inline-flex">
                      {getStatusBadge(selectedLink.is_active)}
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-5 border border-border/40 shadow-sm">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
                    <Activity className="w-4 h-4 text-primary" /> Relative Performance
                  </label>
                  <div className="p-2 border border-border/30 rounded-xl bg-background/50">
                    {getCPUBars(selectedLink.clicks, selectedLink.is_active)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                    This visualization shows the popularity of this link relative to your other active links.
                    {selectedLink.is_active 
                      ? " The link is currently fully operational and resolving traffic." 
                      : " Traffic is currently disabled; visitors will see an error page."}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
