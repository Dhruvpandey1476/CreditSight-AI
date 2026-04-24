"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await login(username, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to login. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-sm text-[#888888] hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="w-full max-w-[440px] relative z-10">
        <div className="bg-[#0a0a0a] border border-[#222222] rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Welcome to CreditSight</h1>
            <p className="text-sm text-[#888888]">Secure login for B2B Lenders</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red/10 border border-red/30 rounded-lg text-sm text-red text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#dddddd] mb-1.5" htmlFor="username">
                Email or Username (try test@crednova.com)
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#111111] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-[#555555] focus:outline-none focus:border-[#666666] transition-all text-sm"
                placeholder="name@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#dddddd] mb-1.5" htmlFor="password">
                Password (try password)
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#111111] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-[#555555] focus:outline-none focus:border-[#666666] transition-all text-sm"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#eeeeee] active:scale-[0.98] transition-all disabled:opacity-70 mt-6"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin text-black" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-[#888888]">
            Don't have an account?{" "}
            <Link href="/register" className="text-white font-semibold hover:underline">
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
