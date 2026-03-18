import React, { useState, useEffect } from "react";
import { User, Lock, Upload, Loader2, Save, X, ArrowLeft, Activity } from "lucide-react";
import { LinkManagementTable } from "./link-management-table";
import { supabase } from "../../lib/supabase";
import { cn } from "../../lib/utils";

export function ProfilePage({ user, onBack }: { user: any; onBack: () => void }) {
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || "");
  const [password, setPassword] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      if (data?.publicUrl) {
        setAvatarUrl(data.publicUrl);
        showMessage("Image uploaded successfully! Remember to save changes.", "success");
      }
    } catch (error: any) {
      showMessage(error.message || "Error uploading image", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName, avatar_url: avatarUrl }
      });
      if (error) throw error;
      showMessage("Profile updated successfully!", "success");
    } catch (error: any) {
      showMessage(error.message || "Failed to update profile", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      showMessage("Password must be at least 6 characters.", "error");
      return;
    }
    setIsSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      showMessage("Password updated successfully!", "success");
      setPassword("");
    } catch (error: any) {
      showMessage(error.message || "Failed to update password", "error");
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 animate-in fade-in duration-300">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
      </button>

      <div className="bg-card/80 border border-border/50 shadow-2xl rounded-[2rem] p-6 sm:p-10 backdrop-blur-xl relative overflow-hidden">
        {message.text && (
          <div className={cn(
            "absolute top-0 left-0 right-0 p-3 text-center text-sm font-semibold transition-all z-10",
            message.type === "success" ? "bg-green-500/10 text-green-500 border-b border-green-500/20" : "bg-destructive/10 text-destructive border-b border-destructive/20"
          )}>
            {message.text}
          </div>
        )}

        <div className="mb-8 mt-2">
          <h2 className="text-3xl font-bold tracking-tight">Your Profile</h2>
          <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
        </div>

        <div className="space-y-10">
          {/* Profile Details Form */}
          <form onSubmit={updateProfile} className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 border-b border-border/40 pb-2">
              <User className="w-5 h-5 text-primary" /> Profile Details
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="relative group shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-muted/50 border border-border flex items-center justify-center overflow-hidden shadow-sm">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground/50" />
                  )}
                </div>
                <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer text-white backdrop-blur-sm">
                  {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                  <span className="text-xs font-semibold mt-1">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex-1 space-y-4 w-full">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email Address (Cannot change)</label>
                  <input
                    type="text"
                    disabled
                    value={user?.email || ""}
                    className="w-full h-11 px-4 rounded-xl bg-muted/30 border border-input/50 text-muted-foreground/70 text-sm cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Display Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Zack"
                    className="w-full h-11 px-4 rounded-xl bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-sm"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="bg-primary text-primary-foreground text-sm font-semibold px-6 py-2.5 rounded-xl border border-transparent hover:bg-background hover:text-primary hover:border-primary transition-all shadow-sm flex items-center gap-2 disabled:opacity-70"
              >
                {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </form>

          {/* Password Form */}
          <form onSubmit={updatePassword} className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 border-b border-border/40 pb-2">
              <Lock className="w-5 h-5 text-primary" /> Security
            </h3>
            
            <div className="space-y-4 max-w-md">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 chars)"
                  className="w-full h-11 px-4 rounded-xl bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-sm"
                />
              </div>
            </div>

            <div className="flex justify-start pt-2">
              <button
                type="submit"
                disabled={isSavingPassword || !password}
                className="bg-muted text-foreground border border-border/50 text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-muted/80 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSavingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
              </button>
            </div>
          </form>

          {/* Dashboard Table */}
          <div className="mt-8 pt-8 border-t border-border/40">
            <h3 className="text-xl font-bold tracking-tight flex items-center gap-2 mb-2">
              <Activity className="w-6 h-6 text-primary" /> Link Management
            </h3>
            <p className="text-muted-foreground text-sm mb-6">Track your link performance and disable links as needed.</p>
            <div className="-mx-4 sm:mx-0">
              <LinkManagementTable userId={user.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
