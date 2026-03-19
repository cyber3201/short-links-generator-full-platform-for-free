import React, { useState, useEffect, useCallback } from "react";
import { cn } from './lib/utils';
import { Link, ArrowRight, Scissors, Copy, Check, Github, History, X, Plus, Search, BarChart2, MapPin, Linkedin, User as UserIcon, AlertTriangle, Activity, LogOut, Loader2, Lock } from "lucide-react";
import { LoginPage } from "./components/ui/animated-characters-login-page";
import { ProfilePage } from "./components/ui/profile-page";
import { LinkManagementTable } from "./components/ui/link-management-table";
import { LinkDetailPage } from "./components/ui/link-detail-page";
import { ThemeToggle } from "./components/ui/theme-toggle";
import { InfiniteGridBackground } from "./components/ui/infinite-grid";
import { ShinyButton } from "./components/ui/shiny-button";
import { GlowingEffect } from "./components/ui/glowing-effect";
import { HighlightedText } from "./components/ui/highlighted-text";
import { supabase, hasSupabaseKeys } from "./lib/supabase";

type HistoryItem = {
  id: string;
  originalUrl: string;
  shortUrl: string;
  clicks: number;
  topLocation: string;
};

export default function App() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [isShortening, setIsShortening] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProtected, setIsProtected] = useState(false);
  const [linkPassword, setLinkPassword] = useState("");
  const [view, setView] = useState<'home' | 'login' | 'signup' | 'terms' | 'privacy' | 'profile' | 'dashboard' | 'linkDetail'>('home');
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);

  // Auto-scroll to top when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchHistory(session.user.id);
    });

    // Listen for auth changes (login/logout/signup)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
         fetchHistory(session.user.id);
      } else {
         setHistory([]); // clear history on logout
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchHistory = async (userId: string) => {
    const { data, error } = await supabase
      .from('urls')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching history:', error);
    } else if (data) {
      // Map database columns to component's expected HistoryItem structure
      setHistory(data.map(item => ({
        id: item.id,
        originalUrl: item.original_url,
        shortUrl: item.short_url,
        clicks: item.clicks || 0,
        topLocation: item.top_location || 'Unknown'
      })));
    }
  };

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsShortening(true);
    
    // Generate a short code locally (ideally we might ask a backend edge function)
    const shortCode = Math.random().toString(36).substring(2, 8);
    // Match the current domain (e.g. Netlify) so links resolve automatically
    const baseUrl = window.location.origin;
    const newShortUrl = `${baseUrl}/${shortCode}`;

    // If user is logged in, attach their ID, otherwise it's null (anonymous)
    const { data: rpcData, error } = await supabase.rpc('create_short_url_secure', {
      p_original_url: url,
      p_short_code: shortCode,
      p_short_url: newShortUrl,
      p_user_id: user?.id || null,
      p_password: isProtected ? linkPassword : null
    });

    if (error || !rpcData) {
        console.error("Error inserting URL:", error);
        alert(`Failed to create short link: ${error?.message || 'Unknown error'}`);
    } else {
        setShortUrl(newShortUrl);
        setHistory(prev => [{ 
            id: rpcData.id, 
            originalUrl: url, 
            shortUrl: newShortUrl,
            clicks: 0, 
            topLocation: 'Unknown'
        }, ...prev]);
        setIsProtected(false);
        setLinkPassword("");
    }
    setIsShortening(false);
  };

  const handleCopy = async (textToCopy: string, isMain: boolean = true) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for when clipboard API is not available or blocked
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        document.body.prepend(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (error) {
          console.error("Fallback copy failed", error);
        } finally {
          textArea.remove();
        }
      }
      
      if (isMain) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy text: ", err);
      alert("Uh oh! Your browser blocked copying to the clipboard. You can manually highlight and copy the link.");
    }
  };

  const handleReset = () => {
    setUrl("");
    setShortUrl("");
    setCopied(false);
    setIsProtected(false);
    setLinkPassword("");
  };

  // Handle auth form success
  const handleAuth = async (email: string) => {
      // Redirect to dashboard on login/signup success
      setView('dashboard');
  };

  const filteredHistory = history.filter(item => 
    item.originalUrl.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.shortUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!hasSupabaseKeys) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <div className="max-w-xl w-full bg-destructive/10 border border-destructive/20 rounded-2xl p-8 text-center space-y-4">
          <div className="bg-destructive/10 text-destructive p-4 rounded-full inline-flex mx-auto mb-2">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-destructive">Missing Environment Variables</h2>
          <p className="text-muted-foreground leading-relaxed">
            The application cannot connect to the database because the Supabase keys are missing.
          </p>
          <div className="bg-background/80 p-4 rounded-xl text-left border border-border mt-6 text-sm">
            <p className="font-semibold mb-2">If you deployed to Netlify:</p>
            <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
              <li>Open your Netlify Project Dashboard.</li>
              <li>Go to <strong>Site configuration</strong> &gt; <strong>Environment variables</strong>.</li>
              <li>Add <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">VITE_SUPABASE_URL</code> and your URL.</li>
              <li>Add <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">VITE_SUPABASE_ANON_KEY</code> and your anon key.</li>
              <li>Go to <strong>Deploys</strong> and click <strong>Trigger deploy</strong> to rebuild the site.</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative text-foreground bg-background overflow-hidden">
      <InfiniteGridBackground />

      {/* Header */}
      <header className="relative z-10 pt-8 pb-4">
        <div className="container mx-auto px-4 flex flex-row items-center justify-between relative gap-4 sm:gap-0">
          <div 
            className="flex items-center justify-start gap-2 font-bold text-xl sm:text-2xl tracking-tight cursor-pointer w-1/2"
            onClick={() => setView('home')}
          >
            <img src="https://i.ibb.co/rGZzYLJV/9-SIR-LOGO.png" alt="9-SIR" className="h-10 sm:h-12 object-contain drop-shadow-md" />
          </div>
          <div className="flex justify-end items-center gap-2 sm:gap-4">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <button 
                  onClick={() => setView('dashboard')}
                  className={cn(
                    "flex items-center gap-2 hover:bg-muted/50 px-2 sm:px-3 py-1.5 rounded-full transition-colors border border-transparent hover:border-border text-sm font-medium",
                    view === 'dashboard' ? "bg-muted text-primary" : ""
                  )}
                  title="Dashboard"
                >
                  <BarChart2 className="w-5 h-5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </button>
                <div className="hidden sm:block w-px h-4 bg-border"></div>
                <button 
                  onClick={() => setView('profile')}
                  className={cn(
                    "flex items-center gap-2 hover:bg-muted/50 p-1 sm:p-1.5 rounded-full sm:pl-2 transition-colors border border-transparent hover:border-border text-sm font-medium",
                    view === 'profile' ? "bg-muted text-primary" : ""
                  )}
                  title="Profile"
                >
                  <span className="hidden sm:inline-block truncate max-w-[120px]">
                    {user.user_metadata?.full_name || user.email.split('@')[0]}
                  </span>
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-border">
                      <UserIcon className="w-4 h-4 sm:w-4 sm:h-4" />
                    </div>
                  )}
                </button>
                <button 
                  onClick={() => { supabase.auth.signOut(); setView('home'); }} 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors ml-1 sm:ml-2 flex flex-col items-center justify-center p-1.5 rounded-full hover:bg-muted/50 border border-transparent hover:border-border"
                  title="Log out"
                >
                  <span className="hidden sm:inline">Log out</span>
                  <LogOut className="w-5 h-5 sm:hidden" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-4">
                <button onClick={() => setView('login')} className="text-sm font-medium hover:text-foreground transition-colors hidden sm:block">Log in</button>
                <button onClick={() => setView('login')} className="bg-primary text-primary-foreground text-sm font-medium px-5 py-2 rounded-full border border-transparent hover:bg-background hover:text-primary hover:border-primary transition-all shadow-sm sm:hidden">
                  Log in
                </button>
                <button onClick={() => setView('signup')} className="hidden sm:block bg-primary text-primary-foreground text-sm font-medium px-5 py-2 rounded-full border border-transparent hover:bg-background hover:text-primary hover:border-primary transition-all shadow-sm">
                  Sign up
                </button>
              </div>
            )}
            <div className="w-px h-6 bg-border mx-1 sm:mx-2 line-clamp-1"></div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        "flex-1 relative z-10 flex flex-col items-center justify-center px-4",
        view === 'dashboard' ? "py-8" : "py-8 md:py-20"
      )}>

        {(view === 'login' || view === 'signup') && (
          <LoginPage 
            type={view} 
            onAuth={(email) => handleAuth(email)}
            onNavigate={(newView) => setView(newView as any)}
          />
        )}

        {view === 'profile' && user && (
          <ProfilePage user={user} onBack={() => setView('home')} />
        )}

        {view === 'dashboard' && user && (
          <div className="w-full px-4 sm:px-8 animate-in fade-in duration-300">
            <LinkManagementTable 
              userId={user.id} 
              onViewDetails={(linkId: string) => {
                setSelectedLinkId(linkId);
                setView('linkDetail');
              }}
            />
          </div>
        )}

        {view === 'linkDetail' && user && selectedLinkId && (
          <LinkDetailPage 
            linkId={selectedLinkId} 
            onBack={() => {
              setSelectedLinkId(null);
              setView('dashboard');
            }} 
          />
        )}

        {view === 'home' && (
          <div className="max-w-4xl w-full text-center space-y-10 animate-in fade-in duration-300">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
                Shorten Your Links. <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60 dark:from-primary dark:to-primary/50">
                  Expand Your Reach.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                A simple, fast, and secure URL shortener. Transform long, ugly links into <HighlightedText from="left" delay={0.3} className="text-foreground">clean, memorable ones in seconds.</HighlightedText>
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-card/80 border border-border/50 shadow-2xl rounded-[2rem] p-3 md:p-4 max-w-2xl mx-auto backdrop-blur-xl">
                {!shortUrl ? (
                  <form onSubmit={handleShorten} className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-muted-foreground">
                          <Link className="w-5 h-5" />
                        </div>
                        <input
                          type="url"
                          required
                          placeholder="Paste your long link here..."
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          className="w-full h-16 pl-14 pr-4 rounded-2xl bg-background/50 border border-input/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-lg shadow-inner"
                        />
                      </div>
                      <ShinyButton
                        type="submit"
                        disabled={isShortening}
                        className="h-16 px-8 text-lg font-bold rounded-2xl flex items-center justify-center gap-2 whitespace-nowrap shadow-md focus:outline-none shrink-0"
                      >
                        {isShortening ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-4" />
                        ) : (
                          "Shorten"
                        )}
                      </ShinyButton>
                    </div>

                    <div className="flex flex-col gap-3 px-2">
                      <div className="flex items-center gap-2">
                         <input 
                           type="checkbox" 
                           id="protected" 
                           checked={isProtected} 
                           onChange={(e) => setIsProtected(e.target.checked)} 
                           className="w-4 h-4 accent-primary cursor-pointer" 
                         />
                         <label htmlFor="protected" className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors">
                           <Lock className="w-4 h-4" /> Password Protect Link
                         </label>
                      </div>
                      {isProtected && (
                        <div className="relative animate-in slide-in-from-top-2 duration-200">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground">
                            <Lock className="w-4 h-4" />
                          </div>
                          <input 
                            type="password" 
                            placeholder="Set a secure password to restrict access..." 
                            value={linkPassword}
                            onChange={(e) => setLinkPassword(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 rounded-xl bg-background/30 border border-input/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-sm"
                            required={isProtected}
                          />
                        </div>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300 p-2">
                    <div className="bg-background rounded-2xl border border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 shadow-sm">
                      <div className="flex flex-col items-start truncate pr-4 w-full text-left">
                        <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5">Your Short Link</span>
                        <a href={`/${shortUrl.split('/').pop()}`} target="_blank" rel="noreferrer" className="text-primary font-semibold text-xl hover:underline truncate w-full">
                          {shortUrl}
                        </a>
                      </div>
                      <button
                        onClick={() => handleCopy(shortUrl, true)}
                        className={cn(
                          "shrink-0 flex items-center justify-center gap-2 border px-6 py-3 rounded-xl text-sm font-semibold transition-all w-full sm:w-auto",
                          copied 
                            ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400" 
                            : "bg-primary text-primary-foreground border-transparent hover:border-primary hover:bg-background hover:text-primary"
                        )}
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" /> Copy Link
                          </>
                        )}
                      </button>
                    </div>
                    <button
                      onClick={handleReset}
                      className="mx-auto flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-full hover:bg-muted/50"
                    >
                      <Plus className="w-4 h-4" /> Shorten another link
                    </button>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => setShowHistory(true)}
                className="inline-flex items-center gap-2 text-sm font-medium hover:text-foreground transition-colors text-muted-foreground bg-background/50 hover:bg-muted/50 px-5 py-2.5 rounded-full border border-border/50 backdrop-blur-md shadow-sm"
              >
                <History className="w-4 h-4" />
                <span>View Link History</span>
              </button>
            </div>
            
            <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-10 text-left max-w-6xl mx-auto">
              {/* Lightning Fast Card */}
              <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3 list-none">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <div className="relative flex min-h-[250px] md:min-h-[280px] h-full flex-col justify-between overflow-hidden rounded-xl border-[0.75px] bg-background p-8 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-10 space-y-4 hover:bg-muted/30 transition-colors">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-2 border-[0.75px] border-border shrink-0">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-2xl tracking-tight text-foreground mb-3">Lightning Fast</h3>
                    <p className="text-muted-foreground text-base leading-relaxed text-balance">Generate short links instantly with our globally distributed edge infrastructure.</p>
                  </div>
                </div>
              </div>

              {/* Secure & Reliable Card */}
              <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3 list-none">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <div className="relative flex min-h-[250px] md:min-h-[280px] h-full flex-col justify-between overflow-hidden rounded-xl border-[0.75px] bg-background p-8 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-10 space-y-4 hover:bg-muted/30 transition-colors">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2 border-[0.75px] border-border shrink-0">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-2xl tracking-tight text-foreground mb-3">Secure & Reliable</h3>
                    <p className="text-muted-foreground text-base leading-relaxed text-balance">Every link is encrypted and scanned for malware to protect you and your users.</p>
                  </div>
                </div>
              </div>

              {/* Detailed Analytics Card */}
              <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3 list-none">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <div className="relative flex min-h-[250px] md:min-h-[280px] h-full flex-col justify-between overflow-hidden rounded-xl border-[0.75px] bg-background p-8 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-10 space-y-4 hover:bg-muted/30 transition-colors">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-2 border-[0.75px] border-border shrink-0">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-2xl tracking-tight text-foreground mb-3">Detailed Analytics</h3>
                    <p className="text-muted-foreground text-base leading-relaxed text-balance">Track clicks, geographic data, and referrers for every link you create in real-time.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'terms' && (
          <div className="max-w-3xl w-full bg-card/80 border border-border/50 shadow-2xl rounded-[2rem] p-8 md:p-12 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300 text-left">
            <h2 className="text-3xl font-bold mb-6">Terms of Use</h2>
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                Welcome to Link 9sir. By accessing or using our URL shortening service, you agree to be bound by these Terms of Use. If you disagree with any part of the terms, you may not access the service.
              </p>
              <h3 className="text-xl font-semibold text-foreground">1. Acceptable Use</h3>
              <p>
                You agree not to use the service to create short links that redirect to malicious content, spam, phishing sites, or any material that violates applicable laws. We reserve the right to disable any link at our discretion without prior notice.
              </p>
              <h3 className="text-xl font-semibold text-foreground">2. User Accounts</h3>
              <p>
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our service.
              </p>
              <h3 className="text-xl font-semibold text-foreground">3. Limitation of Liability</h3>
              <p>
                In no event shall mister-zack.link, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.
              </p>
            </div>
            <button 
              onClick={() => setView('home')}
              className="mt-10 px-6 py-2 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-full transition-colors"
            >
              Back to Home
            </button>
          </div>
        )}

        {view === 'privacy' && (
          <div className="max-w-3xl w-full bg-card/80 border border-border/50 shadow-2xl rounded-[2rem] p-8 md:p-12 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300 text-left">
            <h2 className="text-3xl font-bold mb-6">Privacy Policy</h2>
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                Your privacy is important to us. It is Link 9sir's policy to respect your privacy regarding any information we may collect from you across our website and other sites we own and operate.
              </p>
              <h3 className="text-xl font-semibold text-foreground">1. Information We Collect</h3>
              <p>
                We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we're collecting it and how it will be used.
              </p>
              <h3 className="text-xl font-semibold text-foreground">2. Data Analytics</h3>
              <p>
                When a short link is clicked, we collect non-personally identifying information of the sort that web browsers and servers typically make available, such as the browser type, language preference, referring site, and the date and time of each visitor request. Our purpose in collecting non-personally identifying information is to better understand how visitors use our links.
              </p>
              <h3 className="text-xl font-semibold text-foreground">3. Data Sharing</h3>
              <p>
                We don't share any personally identifying information publicly or with third-parties, except when required to by law. Our website may link to external sites that are not operated by us. Please be aware that we have no control over the content and practices of these sites, and cannot accept responsibility or liability for their respective privacy policies.
              </p>
            </div>
            <button 
              onClick={() => setView('home')}
              className="mt-10 px-6 py-2 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-full transition-colors"
            >
              Back to Home
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      {view !== 'login' && view !== 'signup' && (
        <footer className="relative z-10 border-t border-border/40 bg-background/60 backdrop-blur-xl py-10">
          <div className="container mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
              <img src="https://i.ibb.co/rGZzYLJV/9-SIR-LOGO.png" alt="9-SIR" className="h-10 sm:h-12 object-contain opacity-80 hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-center gap-4 text-muted-foreground flex-wrap justify-center">
              <button onClick={() => setView('terms')} className="hover:text-foreground transition-colors text-muted-foreground border border-border px-3 py-1 rounded-md text-sm font-medium">Terms of Use</button>
              <button onClick={() => setView('privacy')} className="hover:text-foreground transition-colors text-muted-foreground text-sm font-medium">Privacy Policy</button>
              <div className="hidden md:block w-px h-4 bg-border mx-2"></div>
              <a href="https://github.com/cyber3201" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://www.linkedin.com/in/zakaryagbibar/" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </footer>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border/50 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/50 flex items-center justify-between bg-muted/10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-primary" /> 
                Authentication Required
              </h2>
              <button 
                onClick={() => setShowAuthModal(false)} 
                className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 text-center space-y-6">
              <p className="text-muted-foreground text-base leading-relaxed">
                You need to be logged in to shorten links. Please create an account or log in to continue.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => { setShowAuthModal(false); setView('login'); }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-border hover:border-primary hover:bg-primary/5 hover:text-primary transition-all font-medium"
                >
                  Log In
                </button>
                <button
                  onClick={() => { setShowAuthModal(false); setView('signup'); }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-md"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border/50 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/50 flex items-center justify-between bg-muted/10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <History className="w-5 h-5 text-primary" /> 
                Link History
              </h2>
              <button 
                onClick={() => setShowHistory(false)} 
                className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 border-b border-border/50 bg-background">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search links..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 rounded-xl bg-muted/50 border border-input/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-sm"
                />
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <Search className="w-6 h-6" />
                  </div>
                  <p className="text-muted-foreground font-medium">No links found.</p>
                </div>
              ) : (
                filteredHistory.map(item => (
                  <div key={item.id} className="p-4 rounded-2xl bg-muted/30 border border-border/50 flex flex-col gap-3 hover:bg-muted/50 transition-colors">
                    <div className="text-sm text-muted-foreground truncate" title={item.originalUrl}>
                      {item.originalUrl}
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <a href={`/${item.shortUrl.split('/').pop()}`} target="_blank" rel="noreferrer" className="text-primary font-semibold hover:underline truncate">
                        {item.shortUrl}
                      </a>
                      <button
                        onClick={() => handleCopy(item.shortUrl, false)}
                        className="p-2 bg-background border border-border/50 hover:bg-muted rounded-lg transition-colors shrink-0 text-foreground shadow-sm"
                        title="Copy short link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-4 pt-2 mt-1 border-t border-border/50 text-xs text-muted-foreground font-medium">
                      <div className="flex items-center gap-1.5">
                        <BarChart2 className="w-3.5 h-3.5" />
                        {item.clicks} clicks
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        Top Location: {item.topLocation}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
