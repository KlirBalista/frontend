"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/auth.jsx";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthSessionStatus from "@/app/(auth)/AuthSessionStatus.jsx";
import InputError from "@/components/InputError.jsx";
import "./animations.css";

// Small component to provide interactive tilt
const InteractiveCard = ({ children }) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotY = (px - 0.5) * 12; // left-right
    const rotX = (0.5 - py) * 12; // up-down
    setTilt({ x: rotX, y: rotY });
  };
  const reset = () => setTilt({ x: 0, y: 0 });
  return (
    <div
      className="group relative card-tilt"
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
    >
      {/* glow border */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#E56D85] to-[#BF3853] rounded-2xl opacity-20 group-hover:opacity-40 transition-all duration-300 blur-sm"></div>
      {children}
    </div>
  );
};

const Login = () => {
  const router = useRouter();

  const { login } = useAuth({
    middleware: "guest",
    redirectIfAuthenticated: "/dashboard",
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shouldRemember, setShouldRemember] = useState(false);
  const [errors, setErrors] = useState([]);
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (router.reset?.length > 0 && errors.length === 0) {
      setStatus(atob(router.reset));
    } else {
      setStatus(null);
    }
  }, [router.reset, errors.length]);

  const submitForm = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      await login({
        email,
        password,
        remember: shouldRemember,
        setErrors,
        setStatus,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#FFF9FA]">
      {/* Left: Brand/Visual Panel */}
      <div className="relative hidden lg:block overflow-hidden bg-gradient-to-br from-[#FDE5EB] via-[#FBD5DF] to-[#FFF1F4] gradient-bg-animate">
        {/* Decorative blobs */}
        <div className="absolute -top-16 -left-10 w-80 h-80 bg-[#FDB3C2]/40 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-20 -right-16 w-96 h-96 bg-[#F891A5]/30 rounded-full blur-3xl animate-float animation-delay-1500"></div>
        <div className="absolute -bottom-16 left-1/3 w-80 h-80 bg-[#E56D85]/20 rounded-full blur-3xl animate-float animation-delay-3000"></div>

        {/* Rotating ring */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[32rem] h-[32rem] rounded-full border-4 border-white/30 animate-rotate-border"></div>
        </div>

        {/* Particles */}
        <span className="particle particle-1" style={{ top: "20%", left: "12%" }} />
        <span className="particle particle-2" style={{ top: "65%", left: "8%" }} />
        <span className="particle particle-3" style={{ top: "35%", left: "75%" }} />

        {/* Content */}
        <div className="relative z-10 h-full flex items-center justify-center p-16">
          <div className="max-w-md animate-fade-in-up">
            <div className="mb-8">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E56D85] to-[#BF3853] shadow-lg shadow-[#E56D85]/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-gray-800 tracking-tight">Care that starts with a sign-in</h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Securely access your BirthCare dashboard to manage appointments, records, and personalized care plans.
            </p>
            <ul className="mt-8 space-y-3 text-gray-700">
              <li className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-[#E56D85] animate-pulse" /> Patient-first experience</li>
              <li className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-[#BF3853] animate-pulse animation-delay-200" /> Privacy & security built-in</li>
              <li className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-[#A41F39] animate-pulse animation-delay-400" /> Fast, reliable access</li>
            </ul>
          </div>
        </div>

        {/* Bottom wave */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 80 C 240 140 480 20 720 80 C 960 140 1200 40 1440 80 L1440 120 L0 120 Z" fill="#ffffff55" />
        </svg>
      </div>

      {/* Right: Form Panel */}
      <div className="relative flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden animate-fade-in-up">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Welcome Back</h1>
            <p className="mt-1 text-gray-600">Sign in to your BirthCare account</p>
          </div>

          <InteractiveCard>
            <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20">
              <AuthSessionStatus className="mb-4" status={status} />

              <form onSubmit={submitForm} className="space-y-6">
                {/* Email */}
                <div className="group">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BF3853]/50 focus:border-[#BF3853] transition-all duration-300 backdrop-blur-sm"
                      required
                      autoFocus
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#E56D85]/10 to-[#BF3853]/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                  <InputError messages={errors.email} className="mt-2" />
                </div>

                {/* Password */}
                <div className="group">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BF3853]/50 focus:border-[#BF3853] transition-all duration-300 backdrop-blur-sm"
                      required
                      autoComplete="current-password"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#E56D85]/10 to-[#BF3853]/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                  <InputError messages={errors.password} className="mt-2" />
                </div>

                {/* Options */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      id="remember_me"
                      type="checkbox"
                      name="remember"
                      className="w-4 h-4 text-[#BF3853] bg-white/80 border-gray-300 rounded focus:ring-[#BF3853]/50 focus:ring-2 transition-colors"
                      onChange={(e) => setShouldRemember(e.target.checked)}
                    />
                    <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-700 transition-colors">Remember me</span>
                  </label>

                  <Link href="/forgot-password" className="text-sm text-[#BF3853] hover:text-[#A41F39] hover:underline transition-colors font-medium">
                    Forgot password?
                  </Link>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-shimmer btn-hover-lift group relative w-full inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white transition-all duration-300 bg-gradient-to-r from-[#BF3853] to-[#A41F39] rounded-xl hover:from-[#A41F39] hover:to-[#8B1A2F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#BF3853]/50 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#BF3853] to-[#A41F39] opacity-100 group-hover:opacity-90 transition-opacity"></div>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#A41F39] to-[#8B1A2F] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative flex items-center">
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing In...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-3 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Sign In
                      </>
                    )}
                  </div>
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link href="/register" className="font-semibold text-[#BF3853] hover:text-[#A41F39] transition-colors duration-300">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </InteractiveCard>
        </div>
      </div>
    </div>
  );
};

export default Login;
