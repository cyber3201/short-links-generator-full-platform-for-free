import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, Lock, ArrowRight, XCircle } from 'lucide-react';

export default function RedirectHandler() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [error, setError] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const hasProcessed = useRef(false);

  useEffect(() => {
    const fetchOriginalUrl = async () => {
      if (!shortCode) return;

      if (hasProcessed.current) return;
      hasProcessed.current = true;

      try {

        const { data: initialData, error: initialError } = await supabase
          .from('urls')
          .select('id, is_active, is_password_protected')
          .eq('short_code', shortCode)
          .single();

        if (initialError || !initialData) {
          setError("Link not found or has expired.");
          return;
        }

        if (initialData.is_active === false) {
          setError("This link has been temporarily disabled by its owner.");
          return;
        }

        if (initialData.is_password_protected) {
          setNeedsPassword(true);
          return;
        }

        const { data: urlData, error: urlError } = await supabase
          .from('urls')
          .select('original_url')
          .eq('id', initialData.id)
          .single();

        if (urlError || !urlData) {
          setError("Failed to resolve destination URL.");
          return;
        }

        await processAndRedirect(initialData.id, urlData.original_url);

      } catch (err: any) {
        console.error("Unexpected error during redirect lookup:", err);
        setError("An unexpected error occurred.");
      }
    };

    fetchOriginalUrl();
  }, [shortCode]);

  const processAndRedirect = async (urlId: string, destinationUrl: string, existingClicks?: number) => {
    try {
      if (existingClicks === undefined) {
          const { data } = await supabase.from('urls').select('clicks').eq('id', urlId).single();
          if (data) {
             existingClicks = data.clicks;
          }
      }

      let geoCountry: string | null = null;
      let geoCity: string | null = null;
      let geoIp: string | null = null;

      try {
        const geoResponse = await fetch('https://get.geojs.io/v1/ip/geo.json', { signal: AbortSignal.timeout(4000) });
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          geoCountry = geoData.country || null;
          geoCity = geoData.city || null;
          geoIp = geoData.ip || null;
        }
      } catch (err) {
        console.warn('[GeoJS] Failed:', err);
      }

      if (!geoCountry) {
        try {
          const fallback = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(4000) });
          if (fallback.ok) {
            const fbData = await fallback.json();
            if (fbData.success !== false) {
              geoCountry = fbData.country || null;
              geoCity = fbData.city || null;
              geoIp = geoIp || fbData.ip || null;
            }
          }
        } catch (err) {
          console.warn('[ipwho] Failed:', err);
        }
      }

      await Promise.all([
        supabase
          .from('urls')
          .update({ clicks: (existingClicks || 0) + 1 })
          .eq('id', urlId),
        supabase
          .from('clicks')
          .insert([{ 
             url_id: urlId, 
             country: geoCountry, 
             city: geoCity, 
             ip_address: geoIp,
             user_agent: navigator.userAgent 
          }])
      ]);

      window.location.href = destinationUrl;
    } catch (e) {
      console.error(e);
      window.location.href = destinationUrl; // fallback redirect
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!passwordInput || !shortCode) return;

      setIsVerifying(true);
      setError(null);

      try {

          const { data: rpcResult, error: rpcError } = await supabase.rpc('verify_and_get_url', {
             p_short_code: shortCode,
             p_password: passwordInput
          });

          if (rpcError) {
             setError("Server error during verification.");
             setIsVerifying(false);
             return;
          }

          if (!rpcResult.success) {
             setError(rpcResult.error || "Invalid password.");
             setIsVerifying(false);
             return;
          }

          await processAndRedirect(rpcResult.id, rpcResult.url, rpcResult.clicks);
      } catch (e) {
          setError("Unexpected verification error.");
          setIsVerifying(false);
      }
  };

  if (needsPassword) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 relative overflow-hidden">
        
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <form onSubmit={handlePasswordSubmit} className="bg-card/90 border border-border/50 shadow-2xl rounded-3xl p-8 max-w-md w-full text-center backdrop-blur-xl z-10 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-primary/10 text-primary mb-6 p-4 rounded-full inline-flex mx-auto border border-primary/20 shadow-inner">
             <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-3 tracking-tight">Protected Link</h2>
          <p className="text-muted-foreground mb-8 text-sm leading-relaxed px-4">
            This short link is secured by its creator. Please enter the password to gain access.
          </p>
          
          <div className="space-y-4">
             <div className="relative text-left">
               <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground">
                 <Lock className="w-4 h-4" />
               </div>
               <input 
                 type="password" 
                 placeholder="Enter password..." 
                 value={passwordInput}
                 onChange={(e) => { setPasswordInput(e.target.value); setError(null); }}
                 className="w-full h-12 pl-12 pr-4 rounded-xl bg-background/50 border border-input/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-sm"
                 required
               />
             </div>
             
             {error && (
               <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20 animate-in slide-in-from-top-1 text-left">
                 <XCircle className="w-4 h-4 shrink-0" />
                 <span>{error}</span>
               </div>
             )}
             
             <button 
               type="submit"
               disabled={isVerifying || !passwordInput}
               className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-md disabled:bg-primary/50 disabled:cursor-not-allowed"
             >
               {isVerifying ? (
                 <Loader2 className="w-5 h-5 animate-spin" />
               ) : (
                 <>Unlock Link <ArrowRight className="w-4 h-4" /></>
               )}
             </button>
          </div>
        </form>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <div className="bg-card/80 border border-border/50 shadow-2xl rounded-2xl p-8 max-w-md w-full text-center backdrop-blur-md">
          <div className="text-red-500 mb-4 bg-red-500/10 p-4 rounded-full inline-block">
             <XCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Oops!</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <a href="/" className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-full transition-colors hover:bg-primary/90 inline-block">
            Go back home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
       <div className="flex flex-col items-center gap-4 text-primary">
          <Loader2 className="w-12 h-12 animate-spin" />
          <h2 className="text-xl font-medium tracking-tight">Redirecting you to the destination...</h2>
       </div>
    </div>
  );
}
