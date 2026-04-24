"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import Toast from "../../components/Toast";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const showToast = (message, type) => setToast({ visible: true, message, type });
  const hideToast = () => setToast(prev => ({ ...prev, visible: false }));
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    hideToast();

    try {
      await register(username, email, password);
      setIsSuccess(true);
      showToast("Account created! Redirecting to dashboard...", "success");
      
      // Add a small delay so the user can see the success toast before unmounting
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (err) {
      showToast(err.message || "Failed to create account. Please try again.", "error");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative">
      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onClose={hideToast} 
      />
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-sm text-[#888888] hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="w-full max-w-[440px] relative z-10">
        <div className="bg-[#0a0a0a] border border-[#222222] rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-sm text-[#888888]">Start your free trial today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-xs font-semibold text-[#dddddd] mb-1.5" htmlFor="email">
                Email (try test@crednova.com)
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#111111] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-[#555555] focus:outline-none focus:border-[#666666] transition-all text-sm"
                placeholder="name@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#dddddd] mb-1.5" htmlFor="username">
                Username (min 4 chars, no spaces)
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#111111] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-[#555555] focus:outline-none focus:border-[#666666] transition-all text-sm"
                placeholder="Choose a username"
                required
                minLength={4}
                pattern="^\S+$"
                title="Username cannot contain spaces"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#dddddd] mb-1.5" htmlFor="password">
                Password (min 6 chars)
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#111111] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-[#555555] focus:outline-none focus:border-[#666666] transition-all text-sm"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isSuccess}
              className="w-full bg-white text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#eeeeee] active:scale-[0.98] transition-all disabled:opacity-70 mt-6"
            >
              {isSubmitting || isSuccess ? (
                <>
                  <Loader2 size={18} className="animate-spin text-black" />
                  {isSuccess ? "Preparing Dashboard..." : "Signing Up..."}
                </>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-[#888888]">
            Already have an account?{" "}
            <Link href="/login" className="text-white font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
