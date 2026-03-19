"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Checkbox } from "./checkbox";
import { Eye, EyeOff, Mail, Sparkles, X, ArrowLeft, Check } from "lucide-react";
import { cn } from "../../lib/utils";
import { supabase } from "../../lib/supabase";

interface PupilProps {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
}

const Pupil = ({ 
  size = 12, 
  maxDistance = 5,
  pupilColor = "black",
  forceLookX,
  forceLookY
}: PupilProps) => {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const pupilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const calculatePupilPosition = () => {
    if (!pupilRef.current) return { x: 0, y: 0 };

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const pupil = pupilRef.current.getBoundingClientRect();
    const pupilCenterX = pupil.left + pupil.width / 2;
    const pupilCenterY = pupil.top + pupil.height / 2;

    const deltaX = mouseX - pupilCenterX;
    const deltaY = mouseY - pupilCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={pupilRef}
      className="rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    />
  );
};

interface EyeBallProps {
  size?: number;
  pupilSize?: number;
  maxDistance?: number;
  eyeColor?: string;
  pupilColor?: string;
  isBlinking?: boolean;
  forceLookX?: number;
  forceLookY?: number;
}

const EyeBall = ({ 
  size = 48, 
  pupilSize = 16, 
  maxDistance = 10,
  eyeColor = "white",
  pupilColor = "black",
  isBlinking = false,
  forceLookX,
  forceLookY
}: EyeBallProps) => {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const eyeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const calculatePupilPosition = () => {
    if (!eyeRef.current) return { x: 0, y: 0 };

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const eye = eyeRef.current.getBoundingClientRect();
    const eyeCenterX = eye.left + eye.width / 2;
    const eyeCenterY = eye.top + eye.height / 2;

    const deltaX = mouseX - eyeCenterX;
    const deltaY = mouseY - eyeCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={eyeRef}
      className="rounded-full flex items-center justify-center transition-all duration-150"
      style={{
        width: `${size}px`,
        height: isBlinking ? '2px' : `${size}px`,
        backgroundColor: eyeColor,
        overflow: 'hidden',
      }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}
    </div>
  );
};

export function LoginPage({ 
  type = 'login', 
  onAuth, 
  onNavigate 
}: { 
  type?: 'login' | 'signup', 
  onAuth?: (email: string) => void,
  onNavigate?: (view: 'login' | 'signup' | 'home') => void
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;

    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(() => {
        setIsPurpleBlinking(true);
        setTimeout(() => {
          setIsPurpleBlinking(false);
          scheduleBlink();
        }, 150);
      }, getRandomBlinkInterval());

      return blinkTimeout;
    };

    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;

    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(() => {
        setIsBlackBlinking(true);
        setTimeout(() => {
          setIsBlackBlinking(false);
          scheduleBlink();
        }, 150);
      }, getRandomBlinkInterval());

      return blinkTimeout;
    };

    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const timer = setTimeout(() => {
        setIsLookingAtEachOther(false);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setIsLookingAtEachOther(false);
    }
  }, [isTyping]);

  useEffect(() => {
    if (password.length > 0 && showPassword) {
      const schedulePeek = () => {
        const peekInterval = setTimeout(() => {
          setIsPurplePeeking(true);
          setTimeout(() => {
            setIsPurplePeeking(false);
          }, 800);
        }, Math.random() * 3000 + 2000);
        return peekInterval;
      };

      const firstPeek = schedulePeek();
      return () => clearTimeout(firstPeek);
    } else {
      setIsPurplePeeking(false);
    }
  }, [password, showPassword, isPurplePeeking]);

  const calculatePosition = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;

    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;

    const faceX = Math.max(-15, Math.min(15, deltaX / 20));
    const faceY = Math.max(-10, Math.min(10, deltaY / 30));

    const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120));

    return { faceX, faceY, bodySkew };
  };

  const purplePos = calculatePosition(purpleRef);
  const blackPos = calculatePosition(blackRef);
  const yellowPos = calculatePosition(yellowRef);
  const orangePos = calculatePosition(orangeRef);

  const getEmailError = (val: string) => {
    if (!val) return "";
    if (!val.includes('@')) return "Email must contain an '@' symbol.";
    return "";
  };

  const emailErrorMsg = getEmailError(email);

  const isPasswordValid = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value !== "" && index < 7) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    try {
      setError("");
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      alert("Verification code resent to your email.");
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (emailErrorMsg && !awaitingConfirmation) {
       setError(emailErrorMsg);
       return;
    }

    if (awaitingConfirmation) {
      const token = otp.join('');
      if (token.length < 8) {
        setError("Please enter the 8-digit verification code.");
        return;
      }
      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'signup'
        });
        if (error) throw error;
        if (onAuth && data.user) {
          onAuth(data.user.email || email);
        }
      } catch (err: any) {
        setError(err.message || "Invalid or expired verification code.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (type === 'signup') {
      if (!isPasswordValid) {
         setError("Please ensure your password meets all requirements.");
         return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    } else if (type === 'login') {
      if (!password) {
        setError("Password is required.");
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isResettingPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin
        });
        if (error) throw error;
        alert("Password reset email sent! Please check your inbox.");
        setIsResettingPassword(false);
      } else if (type === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nom,
              prenom,
            },
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;

        if (data.user && data.session === null) {
          setAwaitingConfirmation(true);
        } else if (onAuth && data.user) {
           onAuth(data.user.email || email);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (onAuth && data.user) {
          onAuth(data.user.email || email);
        }
      }
    } catch (err: any) {
       setError(err.message || "An error occurred during authentication.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-card/80 backdrop-blur-xl rounded-[2rem] border border-border/50 shadow-2xl overflow-hidden grid lg:grid-cols-2 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="relative flex flex-col justify-between bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-8 md:p-12 text-primary-foreground overflow-hidden">
        <div className="relative z-20 flex items-end justify-center h-[280px] md:h-[500px] w-full">
          
          <div className="relative transform scale-[0.55] md:scale-100 origin-bottom" style={{ width: '550px', height: '400px' }}>
            
            <div 
              ref={purpleRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '70px',
                width: '180px',
                height: (isTyping || (password.length > 0 && !showPassword)) ? '440px' : '400px',
                backgroundColor: '#6C3FF5',
                borderRadius: '10px 10px 0 0',
                zIndex: 1,
                transform: (password.length > 0 && showPassword)
                  ? `skewX(0deg)`
                  : (isTyping || (password.length > 0 && !showPassword))
                    ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)` 
                    : `skewX(${purplePos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div 
                className="absolute flex gap-8 transition-all duration-700 ease-in-out"
                style={{
                  left: (password.length > 0 && showPassword) ? `${20}px` : isLookingAtEachOther ? `${55}px` : `${45 + purplePos.faceX}px`,
                  top: (password.length > 0 && showPassword) ? `${35}px` : isLookingAtEachOther ? `${65}px` : `${40 + purplePos.faceY}px`,
                }}
              >
                <EyeBall 
                  size={18} 
                  pupilSize={7} 
                  maxDistance={5} 
                  eyeColor="white" 
                  pupilColor="#2D2D2D" 
                  isBlinking={isPurpleBlinking}
                  forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                />
                <EyeBall 
                  size={18} 
                  pupilSize={7} 
                  maxDistance={5} 
                  eyeColor="white" 
                  pupilColor="#2D2D2D" 
                  isBlinking={isPurpleBlinking}
                  forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                />
              </div>
            </div>

            <div 
              ref={blackRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '240px',
                width: '120px',
                height: '310px',
                backgroundColor: '#2D2D2D',
                borderRadius: '8px 8px 0 0',
                zIndex: 2,
                transform: (password.length > 0 && showPassword)
                  ? `skewX(0deg)`
                  : isLookingAtEachOther
                    ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                    : (isTyping || (password.length > 0 && !showPassword))
                      ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)` 
                      : `skewX(${blackPos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div 
                className="absolute flex gap-6 transition-all duration-700 ease-in-out"
                style={{
                  left: (password.length > 0 && showPassword) ? `${10}px` : isLookingAtEachOther ? `${32}px` : `${26 + blackPos.faceX}px`,
                  top: (password.length > 0 && showPassword) ? `${28}px` : isLookingAtEachOther ? `${12}px` : `${32 + blackPos.faceY}px`,
                }}
              >
                <EyeBall 
                  size={16} 
                  pupilSize={6} 
                  maxDistance={4} 
                  eyeColor="white" 
                  pupilColor="#2D2D2D" 
                  isBlinking={isBlackBlinking}
                  forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined}
                />
                <EyeBall 
                  size={16} 
                  pupilSize={6} 
                  maxDistance={4} 
                  eyeColor="white" 
                  pupilColor="#2D2D2D" 
                  isBlinking={isBlackBlinking}
                  forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined}
                />
              </div>
            </div>

            <div 
              ref={orangeRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '0px',
                width: '240px',
                height: '200px',
                zIndex: 3,
                backgroundColor: '#FF9B6B',
                borderRadius: '120px 120px 0 0',
                transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${orangePos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div 
                className="absolute flex gap-8 transition-all duration-200 ease-out"
                style={{
                  left: (password.length > 0 && showPassword) ? `${50}px` : `${82 + (orangePos.faceX || 0)}px`,
                  top: (password.length > 0 && showPassword) ? `${85}px` : `${90 + (orangePos.faceY || 0)}px`,
                }}
              >
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
              </div>
            </div>

            <div 
              ref={yellowRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '310px',
                width: '140px',
                height: '230px',
                backgroundColor: '#E8D754',
                borderRadius: '70px 70px 0 0',
                zIndex: 4,
                transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${yellowPos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div 
                className="absolute flex gap-6 transition-all duration-200 ease-out"
                style={{
                  left: (password.length > 0 && showPassword) ? `${20}px` : `${52 + (yellowPos.faceX || 0)}px`,
                  top: (password.length > 0 && showPassword) ? `${35}px` : `${40 + (yellowPos.faceY || 0)}px`,
                }}
              >
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
              </div>
              <div 
                className="absolute w-20 h-[4px] bg-[#2D2D2D] rounded-full transition-all duration-200 ease-out"
                style={{
                  left: (password.length > 0 && showPassword) ? `${10}px` : `${40 + (yellowPos.faceX || 0)}px`,
                  top: (password.length > 0 && showPassword) ? `${88}px` : `${88 + (yellowPos.faceY || 0)}px`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="absolute top-1/4 right-1/4 size-64 bg-primary-foreground/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 size-96 bg-primary-foreground/5 rounded-full blur-3xl" />
      </div>

      <div className="flex justify-center p-6 md:p-12 bg-background relative h-full overflow-y-auto">
        <div className="w-full max-w-[420px] my-auto py-8 md:py-12 relative">
          
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); onNavigate?.('home'); }}
            className="absolute top-2 left-0 md:-ml-4 -mt-6 p-2 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm font-medium rounded-lg hover:bg-muted/50"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>

          <div className="text-center mb-10 mt-6">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {isResettingPassword 
                ? 'Reset Password' 
                : awaitingConfirmation 
                  ? 'Verify your email' 
                  : type === 'login' ? 'Welcome back!' : 'Create an account'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isResettingPassword 
                ? 'Enter your email to receive a password reset link.' 
                : awaitingConfirmation 
                  ? 'We sent a confirmation link to your email. Please click it to verify your account.'
                  : type === 'login' ? 'Please enter your details to log in.' : 'Start shortening and tracking your links.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!awaitingConfirmation && !isResettingPassword && type === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nom" className="text-sm font-medium">Nom</Label>
                    <Input
                      id="nom"
                      type="text"
                      placeholder="Doe"
                      value={nom}
                      autoComplete="off"
                      onChange={(e) => setNom(e.target.value)}
                      onFocus={() => setIsTyping(true)}
                      onBlur={() => setIsTyping(false)}
                      required
                      className="h-12 bg-background border-border/60 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prenom" className="text-sm font-medium">Prénom</Label>
                    <Input
                      id="prenom"
                      type="text"
                      placeholder="John"
                      value={prenom}
                      autoComplete="off"
                      onChange={(e) => setPrenom(e.target.value)}
                      onFocus={() => setIsTyping(true)}
                      onBlur={() => setIsTyping(false)}
                      required
                      className="h-12 bg-background border-border/60 focus:border-primary"
                    />
                  </div>
                </div>
              </>
            )}

            {awaitingConfirmation ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-center gap-2 sm:gap-4 mt-4">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onFocus={() => setIsTyping(true)}
                      onBlur={() => setIsTyping(false)}
                      className="w-8 h-10 sm:w-10 sm:h-12 md:w-12 md:h-14 text-center text-lg sm:text-xl font-bold bg-background border border-border/60 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  ))}
                </div>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Didn't receive the code? Resend
                  </button>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium mt-4" 
                  size="lg" 
                  disabled={isLoading || otp.join('').length < 8}
                >
                  {isLoading ? "Verifying..." : "Verify & Continue"}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  autoComplete="off"
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  required
                  className={cn(
                    "h-12 bg-background border-border/60 focus:border-primary",
                    emailErrorMsg ? "border-red-500/50 focus:border-red-500/50" : ""
                  )}
                />
                {emailErrorMsg && <p className="text-xs text-red-500 font-medium ml-1">{emailErrorMsg}</p>}
                {!emailErrorMsg && String(email).length > 0 && <p className="text-xs text-green-500 font-medium ml-1">Valid email format</p>}
              </div>
            )}

            {!awaitingConfirmation && !isResettingPassword && (
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pr-10 bg-background border-border/60 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
              {type === 'signup' && (
                <div className="mt-2 space-y-1.5 p-2 bg-muted/30 rounded-lg border border-border/50">
                  <p className={cn("text-xs flex items-center gap-1.5 font-medium transition-colors duration-200", password.length >= 8 ? "text-green-500" : "text-muted-foreground/70")}>
                    <Check className={cn("w-3.5 h-3.5 transition-opacity duration-200", password.length >= 8 ? "opacity-100" : "opacity-40")} /> At least 8 characters
                  </p>
                  <p className={cn("text-xs flex items-center gap-1.5 font-medium transition-colors duration-200", /[A-Z]/.test(password) ? "text-green-500" : "text-muted-foreground/70")}>
                    <Check className={cn("w-3.5 h-3.5 transition-opacity duration-200", /[A-Z]/.test(password) ? "opacity-100" : "opacity-40")} /> Contains uppercase letter
                  </p>
                  <p className={cn("text-xs flex items-center gap-1.5 font-medium transition-colors duration-200", /[a-z]/.test(password) ? "text-green-500" : "text-muted-foreground/70")}>
                    <Check className={cn("w-3.5 h-3.5 transition-opacity duration-200", /[a-z]/.test(password) ? "opacity-100" : "opacity-40")} /> Contains lowercase letter
                  </p>
                  <p className={cn("text-xs flex items-center gap-1.5 font-medium transition-colors duration-200", /\d/.test(password) ? "text-green-500" : "text-muted-foreground/70")}>
                    <Check className={cn("w-3.5 h-3.5 transition-opacity duration-200", /\d/.test(password) ? "opacity-100" : "opacity-40")} /> Contains number
                  </p>
                </div>
              )}
            </div>
            )}

            {!awaitingConfirmation && !isResettingPassword && type === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12 pr-10 bg-background border-border/60 focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="size-5" />
                    ) : (
                      <Eye className="size-5" />
                    )}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <p className={cn("text-xs font-semibold ml-1 mt-1 transition-colors duration-200", password === confirmPassword ? "text-green-500" : "text-red-500")}>
                    {password === confirmPassword ? "Passwords match" : "Passwords do not match"}
                  </p>
                )}
              </div>
            )}

            {!awaitingConfirmation && !isResettingPassword && type === 'login' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <Label
                    htmlFor="remember"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Remember for 30 days
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={() => setIsResettingPassword(true)}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg">
                {error}
              </div>
            )}

            {!awaitingConfirmation && (
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium" 
                size="lg" 
                disabled={isLoading}
              >
                {isLoading 
                  ? (isResettingPassword ? "Sending..." : type === 'login' ? "Signing in..." : "Signing up...") 
                  : (isResettingPassword ? "Send Reset Link" : type === 'login' ? "Log in" : "Sign up")}
              </Button>
            )}
          </form>

          <div className="text-center text-sm text-muted-foreground mt-8 flex flex-col items-center gap-3">
            {isResettingPassword ? (
              <button 
                onClick={() => { setIsResettingPassword(false); setError(""); }}
                className="text-foreground font-medium hover:underline"
              >
                Back to log in
              </button>
            ) : awaitingConfirmation ? (
              <button 
                onClick={() => { setAwaitingConfirmation(false); setError(""); onNavigate?.('login'); }}
                className="text-foreground font-medium hover:underline"
              >
                Proceed to login
              </button>
            ) : (
              <div>
                {type === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button 
                  onClick={() => { onNavigate?.(type === 'login' ? 'signup' : 'login'); setError(""); }}
                  className="text-foreground font-medium hover:underline ml-1"
                >
                  {type === 'login' ? 'Sign Up' : 'Log in'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const Component = LoginPage;
