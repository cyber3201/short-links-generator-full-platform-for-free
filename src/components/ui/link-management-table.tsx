"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, Calendar, Globe, Copy, Lock, Plus, Loader2, RefreshCw, X, LinkIcon } from "lucide-react";
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
  is_password_protected: boolean;
  number: string;
}

interface LinkManagementTableProps {
  userId: string;
  className?: string;
  onCreateNew?: () => void;
  onViewDetails?: (linkId: string) => void;
}

export function LinkManagementTable({
  userId,
  className = "",
  onCreateNew,
  onViewDetails
}: LinkManagementTableProps) {
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [isProtected, setIsProtected] = useState(false);
  const [linkPassword, setLinkPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);

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

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl || isCreating) return;

    setIsCreating(true);
    const shortCode = Math.random().toString(36).substring(2, 8);
    const baseUrl = window.location.origin;
    const newShortUrl = `${baseUrl}/${shortCode}`;

    const { error } = await supabase.rpc('create_short_url_secure', {
      p_original_url: newUrl,
      p_short_code: shortCode,
      p_short_url: newShortUrl,
      p_user_id: userId,
      p_password: isProtected ? linkPassword : null
    });

    if (error) {
      console.error("Error creating link:", error);
      alert(`Failed to create short link: ${error.message}`);
    } else {
      setNewUrl("");
      setIsProtected(false);
      setLinkPassword("");
      setShowCreateModal(false);
      await fetchLinks();
    }
    setIsCreating(false);
  };

  const handleCopy = async (e: React.MouseEvent, textToCopy: string) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        document.body.prepend(textArea);
        textArea.select();
        try { document.execCommand('copy'); } catch (err) { console.error(err); }
        finally { textArea.remove(); }
      }
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const getCPUBars = (clicks: number, is_active: boolean) => {
    const maxClicks = Math.max(1, ...links.map(l => l.clicks || 0));
    const percentage = clicks === 0 ? 0 : Math.max(5, Math.round((clicks / maxClicks) * 100));
    const filledBars = Math.round((percentage / 100) * 10);
    
    const getBarColor = (index: number) => {
      if (index >= filledBars) return "bg-muted/40 border border-border/30";
      return is_active ? "bg-primary" : "bg-muted-foreground/30";
    };
    
    return (
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className={`w-1.5 h-4 sm:h-5 rounded-full transition-all duration-500 ${getBarColor(index)}`} />
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
    }
    return (
      <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center">
        <span className="text-red-400 text-xs sm:text-sm font-medium">Disabled</span>
      </div>
    );
  };

  const getStatusGradient = (is_active: boolean) => {
    return is_active ? "from-green-500/5 to-transparent" : "from-red-500/5 to-transparent";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    });
  };

  if (isLoading) {
    return (
      <div className="w-full px-4 sm:px-8 py-12 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <h2 className="text-xl font-bold tracking-tight text-foreground">Link Analytics Dashboard</h2>
          </div>
          <div className="bg-card rounded-2xl border border-border/40 shadow-sm flex flex-col items-center justify-center py-20 gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Link className="w-10 h-10" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold tracking-tight text-foreground">No links found</h3>
              <p className="text-muted-foreground font-medium max-w-sm">You haven't shortened any links yet. Create your first link to see tracking analytics here.</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-md"
            >
              <Plus className="w-5 h-5" /> Generate Short Link
            </button>
          </div>
        </div>

        {/* Create Link Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <CreateLinkModal
              newUrl={newUrl}
              setNewUrl={setNewUrl}
              isProtected={isProtected}
              setIsProtected={setIsProtected}
              linkPassword={linkPassword}
              setLinkPassword={setLinkPassword}
              isCreating={isCreating}
              onSubmit={handleCreateLink}
              onClose={() => { setShowCreateModal(false); setNewUrl(""); setIsProtected(false); setLinkPassword(""); }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <h2 className="text-xl font-bold tracking-tight text-foreground">Link Analytics Dashboard</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm font-medium text-muted-foreground bg-card px-4 py-2 rounded-full border border-border/50">
              {links.filter(s => s.is_active).length} Active • {links.filter(s => !s.is_active).length} Disabled
            </div>
            <button
              onClick={fetchLinks}
              className="flex items-center gap-1.5 px-4 py-2 bg-card text-muted-foreground hover:text-foreground font-semibold rounded-full hover:bg-muted/50 transition-all border border-border/50 text-sm"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-all shadow-sm text-sm"
              title="Create New Link"
            >
              <Plus className="w-4 h-4" /> New Link
            </button>
          </div>
        </div>

        {/* Links List */}
        <motion.div
          className="space-y-3"
          variants={{ visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } }}
          initial="hidden"
          animate="visible"
        >
          {/* Headers (Desktop Only) */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-1">No</div>
            <div className="col-span-3">Original URL</div>
            <div className="col-span-2">Short Code</div>
            <div className="col-span-2">Location</div>
            <div className="col-span-2">Clicks Activity</div>
            <div className="col-span-1">Created</div>
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
              onClick={() => onViewDetails?.(link.id)}
            >
              <motion.div
                className="relative bg-card border border-border/50 rounded-xl p-4 overflow-hidden transition-colors hover:border-primary/30"
                whileHover={{ y: -2 }}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-l ${getStatusGradient(link.is_active)} pointer-events-none opacity-50`}
                  style={{ backgroundSize: "30% 100%", backgroundPosition: "right", backgroundRepeat: "no-repeat" }}
                />

                {/* Desktop Layout */}
                <div className="hidden lg:grid relative grid-cols-12 gap-4 items-center">
                  <div className="col-span-1">
                    <span className="text-xl font-bold text-muted-foreground/50">{link.number}</span>
                  </div>
                  <div className="col-span-3 flex items-center gap-2 pr-4 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                      <Link className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-foreground font-medium truncate" title={link.original_url}>
                      {link.original_url}
                    </span>
                    <button
                      onClick={(e) => handleCopy(e, link.original_url)}
                      className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md transition-colors shrink-0"
                      title="Copy original link"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <span className="text-primary font-mono text-sm bg-primary/5 px-2.5 py-1 rounded-md border border-primary/10 truncate">
                      /{link.short_code}
                    </span>
                    {link.is_password_protected && (
                      <div className="bg-amber-500/10 text-amber-500 p-1.5 rounded-md border border-amber-500/20" title="Password Protected">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <button
                      onClick={(e) => handleCopy(e, link.short_url)}
                      className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md transition-colors shrink-0"
                      title="Copy short link"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
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

                {/* Mobile / Tablet Layout */}
                <div className="lg:hidden relative flex flex-col gap-3">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-primary font-mono text-xs font-semibold tracking-wider bg-primary/5 px-2.5 py-1 rounded-md border border-primary/10">
                        /{link.short_code}
                      </span>
                      {link.is_password_protected && (
                        <div className="bg-amber-500/10 text-amber-500 p-1 rounded-md border border-amber-500/20" title="Password Protected">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <button
                        onClick={(e) => handleCopy(e, link.short_url)}
                        className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md transition-colors"
                        title="Copy short link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {getStatusBadge(link.is_active)}
                  </div>

                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                      <Link className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-foreground font-semibold truncate flex-1" title={link.original_url}>
                      {link.original_url}
                    </span>
                    <button
                      onClick={(e) => handleCopy(e, link.original_url)}
                      className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md transition-colors shrink-0"
                      title="Copy original link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium bg-muted/30 p-3 rounded-lg border border-border/30">
                    <div className="flex items-center gap-1.5 truncate">
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{link.top_location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(link.created_at)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/30 w-full">
                    {getCPUBars(link.clicks, link.is_active)}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Create Link Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateLinkModal
            newUrl={newUrl}
            setNewUrl={setNewUrl}
            isProtected={isProtected}
            setIsProtected={setIsProtected}
            linkPassword={linkPassword}
            setLinkPassword={setLinkPassword}
            isCreating={isCreating}
            onSubmit={handleCreateLink}
            onClose={() => { setShowCreateModal(false); setNewUrl(""); setIsProtected(false); setLinkPassword(""); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------
   Create Link Modal (Popup)
------------------------------------------------ */
function CreateLinkModal({
  newUrl, setNewUrl,
  isProtected, setIsProtected,
  linkPassword, setLinkPassword,
  isCreating,
  onSubmit, onClose
}: {
  newUrl: string; setNewUrl: (v: string) => void;
  isProtected: boolean; setIsProtected: (v: boolean) => void;
  linkPassword: string; setLinkPassword: (v: string) => void;
  isCreating: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="relative bg-card border border-border/50 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <LinkIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Create New Link</h3>
            <p className="text-sm text-muted-foreground">Shorten a URL and start tracking clicks</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">Destination URL</label>
            <input
              type="url"
              required
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com/very-long-url"
              className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsProtected(!isProtected)}
              className={`relative w-11 h-6 rounded-full transition-colors ${isProtected ? 'bg-primary' : 'bg-muted'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isProtected ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
            </button>
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-medium">Password protect</span>
            </div>
          </div>

          {isProtected && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <input
                type="password"
                required={isProtected}
                value={linkPassword}
                onChange={(e) => setLinkPassword(e.target.value)}
                placeholder="Enter a password"
                className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-sm"
              />
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isCreating || !newUrl}
            className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isCreating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
            ) : (
              <><Plus className="w-4 h-4" /> Create Short Link</>
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
