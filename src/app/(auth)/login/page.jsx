"use client";

import Button from "@/components/Button.jsx";
import Input from "@/components/Input.jsx";
import InputError from "@/components/InputError.jsx";
import Label from "@/components/Label.jsx";
import Link from "next/link";
import { useAuth } from "@/hooks/auth.jsx";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthSessionStatus from "@/app/(auth)/AuthSessionStatus.jsx";
import Loading from "../Loading";
import AuthCard from "../AuthCard";

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
    <div className="min-h-screen bg-[#FDFDFC] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#FDB3C2]/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-[#F891A5]/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-[#E56D85]/15 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-4000"></div>
      </div>
      
      {/* Login Form Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="relative inline-block group">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E56D85] to-[#BF3853] shadow-lg shadow-[#E56D85]/30 group-hover:shadow-[#BF3853]/40 transition-all duration-300 group-hover:scale-110 mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white transform group-hover:scale-110 transition-transform duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#E56D85] to-[#BF3853] opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-300"></div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your BirthCare account</p>
        </div>
          
        {/* Login Card */}
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#E56D85] to-[#BF3853] rounded-2xl opacity-20 group-hover:opacity-30 transition-all duration-300 blur-sm"></div>
          <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20">
          <AuthSessionStatus className="mb-4" status={status} />
            
          <form onSubmit={submitForm} className="space-y-6">
            {/* Email Field */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BF3853]/50 focus:border-[#BF3853] transition-all duration-300 backdrop-blur-sm"
                  placeholder=""
                  required
                  autoFocus
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#E56D85]/10 to-[#BF3853]/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
              <InputError messages={errors.email} className="mt-2" />
            </div>
            
            {/* Password Field */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BF3853]/50 focus:border-[#BF3853] transition-all duration-300 backdrop-blur-sm"
                  placeholder=""
                  required
                  autoComplete="current-password"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#E56D85]/10 to-[#BF3853]/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
              <InputError messages={errors.password} className="mt-2" />
            </div>
            
            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer group">
                <input
                  id="remember_me"
                  type="checkbox"
                  name="remember"
                  className="w-4 h-4 text-[#BF3853] bg-white/80 border-gray-300 rounded focus:ring-[#BF3853]/50 focus:ring-2 transition-colors"
                  onChange={(event) => setShouldRemember(event.target.checked)}
                />
                <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-700 transition-colors">Remember me</span>
              </label>
              
              <Link
                href="/forgot-password"
                className="text-sm text-[#BF3853] hover:text-[#A41F39] hover:underline transition-colors font-medium"
              >
                Forgot password?
              </Link>
            </div>
            
            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white transition-all duration-300 bg-gradient-to-r from-[#BF3853] to-[#A41F39] rounded-xl hover:from-[#A41F39] hover:to-[#8B1A2F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#BF3853]/50 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
          
          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="font-semibold text-[#BF3853] hover:text-[#A41F39] transition-colors duration-300">
                Sign up
              </Link>
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
