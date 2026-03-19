import React, { useState, useEffect } from "react";
import { User, Lock, Upload, Loader2, Save, X, ArrowLeft, Check, AlertCircle, Download, AlertTriangle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { cn } from "../../lib/utils";

export function ProfilePage({ user, onBack }: { user: any; onBack: () => void }) {
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName, avatar_url: avatarUrl }
      });
      if (authError) throw authError;

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ full_name: fullName, avatar_url: avatarUrl })
        .eq('id', user.id);
      
      if (dbError) throw dbError;

      showMessage("Profile updated successfully!", "success");
    } catch (error: any) {
      showMessage(error.message || "Failed to update profile", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      showMessage("Please enter your current password first.", "error");
      return;
    }
    if (!password || password.length < 6) {
      showMessage("New password must be at least 6 characters.", "error");
      return;
    }
    if (password !== confirmPassword) {
      showMessage("New passwords do not match.", "error");
      return;
    }
    setIsSavingPassword(true);
    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword
      });
      if (verifyError) throw new Error("Incorrect current password.");

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      showMessage("Password updated successfully!", "success");
      setPassword("");
      setConfirmPassword("");
      setOldPassword("");
    } catch (error: any) {
      showMessage(error.message || "Failed to update password", "error");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: window.location.origin
      });
      if (error) throw error;
      showMessage("Password reset email sent!", "success");
    } catch (error: any) {
      showMessage(error.message, "error");
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const { data: urls } = await supabase.from('urls').select('*').eq('user_id', user.id);
      const { data: clicks } = await supabase.from('clicks').select('*, urls!inner(user_id)').eq('urls.user_id', user.id);
      
      const exportData = {
        urls: urls || [],
        clicks: clicks?.map(c => { const { urls, ...rest } = c; return rest; }) || []
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-link-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showMessage("Data exported successfully!", "success");
    } catch (error: any) {
      showMessage("Failed to export data", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.rpc('delete_user_account');
      if (error) throw error;
      await supabase.auth.signOut();
      window.location.reload();
    } catch (error: any) {
      showMessage(error.message || "Failed to delete account", "error");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="w-full h-full px-4 sm:px-8 py-8 animate-in fade-in duration-300">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
      </button>

      {message.text && (
        <div className={cn(
          "fixed top-4 right-4 sm:top-6 sm:right-6 p-4 rounded-xl shadow-xl text-sm font-semibold transition-all z-[100] animate-in slide-in-from-top-4 flex items-center gap-2",
          message.type === "success" 
            ? "bg-green-500/10 text-green-500 border border-green-500/20 backdrop-blur-md" 
            : "bg-destructive/10 text-destructive border border-destructive/20 backdrop-blur-md"
        )}>
          {message.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      <div className="w-full max-w-4xl pt-4 relative">

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
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full h-11 px-4 rounded-xl bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-sm"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-muted-foreground block">New Password</label>
                  <button type="button" onClick={handleForgotPassword} className="text-xs text-primary hover:underline font-medium">Forgot Password?</button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 chars)"
                  className="w-full h-11 px-4 rounded-xl bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-sm mb-4"
                />
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full h-11 px-4 rounded-xl bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-sm"
                />
              </div>
            </div>

            <div className="flex justify-start pt-2">
              <button
                type="submit"
                disabled={isSavingPassword || !password || !oldPassword || !confirmPassword}
                className="bg-muted text-foreground border border-border/50 text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-muted/80 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSavingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
              </button>
            </div>
          </form>

          {/* Data Management Export / Delete */}
          <div className="space-y-6 pt-4 border-t border-border/40">
            <h3 className="text-lg font-semibold flex items-center gap-2 pb-2">
              <AlertTriangle className="w-5 h-5 text-destructive" /> Data Management
            </h3>
            
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5 space-y-3">
                <h4 className="font-semibold text-sm">Export Data</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Download a JSON file containing all your links and detailed click analytics.</p>
                <button
                  type="button"
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="mt-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-sm font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Export JSON
                </button>
              </div>

              <div className="p-5 rounded-2xl border border-destructive/20 bg-destructive/5 space-y-3">
                <h4 className="font-semibold text-sm text-destructive">Delete Account</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Permanently delete your account, links, and all associated analytics from the database.</p>
                
                {showDeleteConfirm ? (
                  <div className="space-y-3 p-3 bg-card border border-destructive/20 rounded-xl mt-2 animate-in fade-in zoom-in-95">
                    <p className="text-xs font-semibold text-destructive">Are you absolute sure? This cannot be undone.</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2 shadow-sm disabled:opacity-70"
                      >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, permanently delete"}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting}
                        className="bg-background text-foreground border border-border text-sm font-medium px-4 py-2 rounded-lg hover:bg-muted transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="mt-2 bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 hover:text-destructive-foreground text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-2"
                  >
                    Delete Account
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
