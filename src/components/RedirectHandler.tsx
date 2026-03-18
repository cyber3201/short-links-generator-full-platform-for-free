import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function RedirectHandler() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOriginalUrl = async () => {
      if (!shortCode) return;

      try {
        const { data, error: fetchError } = await supabase
          .from('urls')
          .select('id, original_url, clicks, user_id, is_active')
          .eq('short_code', shortCode)
          .single();

        if (fetchError || !data) {
          console.error("Link lookup failed:", fetchError);
          setError("Link not found or has expired.");
          return;
        }

        if (data.is_active === false) {
          setError("This link has been temporarily disabled by its owner.");
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const currentUser = sessionData.session?.user;

        // Condition to restrict incrementing clicks for the owner
        if (!currentUser || currentUser.id !== data.user_id) {
          // Increment the click count asynchronously
          supabase
            .from('urls')
            .update({ clicks: (data.clicks || 0) + 1 })
            .eq('id', data.id)
            .then(({ error: updateError }) => {
               if (updateError) console.error("Failed to update clicks:", updateError);
            });

          // Insert into analytics table
          supabase
            .from('clicks')
            .insert([{ url_id: data.id }])
            .then(({ error: clickError }) => {
               if (clickError) console.error("Failed to insert click record:", clickError);
            });
        }

        // Perform the redirect
        window.location.href = data.original_url;

      } catch (err: any) {
        console.error("Unexpected error during redirect lookup:", err);
        setError("An unexpected error occurred.");
      }
    };

    fetchOriginalUrl();
  }, [shortCode]);

  // If there's an error, show it. Otherwise, show a loading spinner.
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <div className="bg-card/80 border border-border/50 shadow-2xl rounded-2xl p-8 max-w-md w-full text-center backdrop-blur-md">
          <div className="text-red-500 mb-4 bg-red-500/10 p-4 rounded-full inline-block">
             <svg xmlns="http://www.w3.org/2000/Url" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-8 h-8">
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
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
