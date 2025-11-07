"use client";
import LoginLinks from "@/app/LoginLinks.jsx";
import { useState } from "react";
import PlansPage from "./(guest)/plans/page";

const Home = () => {
  const [isOpen, setIsOpen] = useState(false);
  

  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-[#FDB3C2]/10 via-white to-[#F891A5]/10">
      {/* Header */}
      <header className="fixed top-0 left-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-[#FDB3C2]/30 shadow-sm">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <nav className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3 group">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F891A5] to-[#E56D85] shadow-lg shadow-[#FDB3C2]/50 group-hover:shadow-[#F891A5]/60 transition-all duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-white"
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
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-gray-900">
                  BirthCare
                </span>
                <span className="text-xs text-[#E56D85] font-semibold tracking-wider -mt-1">
                  Maternal Care
                </span>
              </div>
            </div>

            {/* Desktop Links */}
            <div className="hidden items-center gap-1 md:flex">
              <a
                href="#home"
                className="px-5 py-2 font-medium text-gray-900 hover:text-[#E56D85] transition-colors duration-300"
              >
                Home
              </a>
              <a
                href="#services"
                className="px-5 py-2 font-medium text-gray-900 hover:text-[#E56D85] transition-colors duration-300"
              >
                Services
              </a>
              <a
                href="#pricing"
                className="px-5 py-2 font-medium text-gray-900 hover:text-[#E56D85] transition-colors duration-300"
              >
                Pricing
              </a>
              <a
                href="#about"
                className="px-5 py-2 font-medium text-gray-900 hover:text-[#E56D85] transition-colors duration-300"
              >
                About
              </a>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden items-center gap-4 md:flex">
              <LoginLinks />
            </div>

            {/* Mobile Menu Button */}
            <button
              className="relative p-3 rounded-xl bg-[#FDB3C2]/20 hover:bg-[#FDB3C2]/30 focus:outline-none focus:ring-2 focus:ring-[#F891A5]/30 md:hidden transition-all duration-300"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className={`h-6 w-6 text-[#E56D85] transition-all duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </nav>

          {/* Mobile Menu Links */}
          {isOpen && (
            <div className="mt-6 space-y-3 rounded-2xl bg-white/95 backdrop-blur-md p-6 shadow-xl border border-[#FDB3C2]/40 md:hidden">
              <div className="space-y-2">
                <a
                  href="#home"
                  className="block px-4 py-3 font-medium text-gray-900 hover:text-[#E56D85] hover:bg-[#FDB3C2]/20 rounded-xl transition-all duration-300"
                >
                  Home
                </a>
                <a
                  href="#services"
                  className="block px-4 py-3 font-medium text-gray-900 hover:text-[#E56D85] hover:bg-[#FDB3C2]/20 rounded-xl transition-all duration-300"
                >
                  Services
                </a>
                <a
                  href="#pricing"
                  className="block px-4 py-3 font-medium text-gray-900 hover:text-[#E56D85] hover:bg-[#FDB3C2]/20 rounded-xl transition-all duration-300"
                >
                  Pricing
                </a>
                <a
                  href="#about"
                  className="block px-4 py-3 font-medium text-black hover:text-[#E56D85] hover:bg-[#FDB3C2]/20 rounded-xl transition-all duration-300"
                >
                  About
                </a>
              </div>

              <div className="border-t border-[#FDB3C2]/40 pt-4 mt-6">
                <LoginLinks />
              </div>
            </div>
          )}
        </div>
      </header>
      
      {/* Hero Section - Modern Pink Theme */}
      <section
        id="home"
        className="relative min-h-screen pt-20 bg-gradient-to-br from-[#FDB3C2]/20 via-white to-[#F891A5]/15"
      >
        {/* Decorative blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#FDB3C2]/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#F891A5]/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-7xl md:text-8xl lg:text-9xl font-black leading-none">
                  <span className="block text-[#FDB3C2] drop-shadow-sm">ONE</span>
                  <span className="block text-[#F891A5] drop-shadow-sm">STEP AT</span>
                  <span className="block text-[#E56D85] drop-shadow-sm">A TIME</span>
                </h1>
                <p className="text-2xl text-[#F891A5] font-semibold italic tracking-wide">
                  Where life begins with care
                </p>
              </div>
              
              <p className="text-lg text-gray-700 leading-relaxed max-w-xl">
                Your trusted partner in prenatal, childbirth, and postnatal care. Experience compassionate service every step of the way.
              </p>
              
              <div className="flex gap-4 pt-4">
                <a
                  href="#services"
                  className="px-8 py-4 bg-[#A41F39] text-white font-semibold rounded-full shadow-lg shadow-[#A41F39]/50 hover:shadow-[#A41F39]/60 hover:scale-105 transition-all duration-300 inline-block"
                >
                  Our Services
                </a>
                <a
                  href="#about"
                  className="px-8 py-4 bg-white text-[#A41F39] font-semibold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 inline-block"
                >
                  Learn More
                </a>
              </div>
            </div>
            
            {/* Right Image */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#FDB3C2] to-[#F891A5] rounded-full blur-3xl opacity-20"></div>
              <div className="relative bg-gradient-to-br from-[#FDB3C2]/40 to-[#F891A5]/30 rounded-full p-8 shadow-2xl">
                <div className="aspect-square rounded-full overflow-hidden bg-white">
                  <img
                    src="/birth.jpg"
                    alt="Maternal Care"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Services Section with Enhanced Design */}
      <section
        id="services"
        className="relative min-h-screen bg-gradient-to-br from-[#FDB3C2]/10 via-white to-[#F891A5]/10 px-4 py-24"
      >
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FDB3C2]/25 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#F891A5]/20 rounded-full blur-3xl"></div>
        
        <div className="relative mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#FDB3C2]/30 to-[#F891A5]/20 rounded-full text-[#E56D85] font-bold text-sm mb-6 shadow-sm">
              ✨ Comprehensive Care Platform
            </div>
            <h2 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#E56D85] via-[#F891A5] to-[#E56D85] mb-6">
              Our Services
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Advanced digital healthcare management designed specifically for maternal and newborn care
            </p>
          </div>
          
          <div className="grid gap-10 md:grid-cols-3">
            {/* Card 1 - Prenatal Care */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#FDB3C2] via-[#F891A5] to-[#E56D85] rounded-3xl opacity-25 group-hover:opacity-50 transition-all duration-500 blur-lg"></div>
              <div className="relative bg-white rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                {/* Icon */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FDB3C2] to-[#F891A5] rounded-2xl blur-xl opacity-35 group-hover:opacity-55 transition-opacity duration-300"></div>
                  <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F891A5] to-[#E56D85] shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
                
                {/* Content */}
                <h3 className="mb-4 text-center text-3xl font-bold text-gray-900 group-hover:text-[#E56D85] transition-colors duration-300">
                  Prenatal Care
                </h3>
                <p className="text-center text-gray-600 text-lg leading-relaxed mb-6">
                  Complete prenatal scheduling, patient charting, medical forms, and comprehensive monitoring throughout pregnancy.
                </p>
                
                {/* Bottom accent */}
                <div className="h-1 bg-gradient-to-r from-transparent via-[#F891A5] to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>

            {/* Card 2 - Labor & Delivery */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#FDB3C2] via-[#F891A5] to-[#E56D85] rounded-3xl opacity-25 group-hover:opacity-50 transition-all duration-500 blur-lg"></div>
              <div className="relative bg-white rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                {/* Icon */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FDB3C2] to-[#F891A5] rounded-2xl blur-xl opacity-35 group-hover:opacity-55 transition-opacity duration-300"></div>
                  <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F891A5] to-[#E56D85] shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                
                {/* Content */}
                <h3 className="mb-4 text-center text-3xl font-bold text-gray-900 group-hover:text-[#E56D85] transition-colors duration-300">
                  Labor & Delivery
                </h3>
                <p className="text-center text-gray-600 text-lg leading-relaxed mb-6">
                  Advanced labor monitoring systems, patient admission management, room allocation, and comprehensive birth documentation.
                </p>
                
                {/* Bottom accent */}
                <div className="h-1 bg-gradient-to-r from-transparent via-[#F891A5] to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>

            {/* Card 3 - Postnatal Care */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#FDB3C2] via-[#F891A5] to-[#E56D85] rounded-3xl opacity-25 group-hover:opacity-50 transition-all duration-500 blur-lg"></div>
              <div className="relative bg-white rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                {/* Icon */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FDB3C2] to-[#F891A5] rounded-2xl blur-xl opacity-35 group-hover:opacity-55 transition-opacity duration-300"></div>
                  <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F891A5] to-[#E56D85] shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                </div>
                
                {/* Content */}
                <h3 className="mb-4 text-center text-3xl font-bold text-gray-900 group-hover:text-[#E56D85] transition-colors duration-300">
                  Postnatal Care
                </h3>
                <p className="text-center text-gray-600 text-lg leading-relaxed mb-6">
                  Complete newborn screening, APGAR scoring, birth certificates, discharge planning, billing, and comprehensive patient records management.
                </p>
                
                {/* Bottom accent */}
                <div className="h-1 bg-gradient-to-r from-transparent via-[#F891A5] to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Pricing Section with Background Image */}
      <section>
        <PlansPage id="pricing" />
      </section>
      {/* About Section with Warm Caring Theme */}
      <section
        id="about"
        className="relative overflow-hidden bg-gradient-to-br from-[#E56D85] via-[#F891A5] to-[#FDB3C2] px-4 py-32"
      >
        {/* Simplified background */}
        <div className="absolute inset-0">
          {/* Single subtle gradient orb */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#FDB3C2]/25 to-transparent"></div>
        </div>
        
        <div className="relative z-20 mx-auto max-w-6xl">
          {/* Animated Title */}
          <div className="text-center mb-16">
            <div className="inline-block relative">
              <h2 className="text-6xl md:text-7xl font-bold text-gray-800 mb-6 tracking-tight">
                About BirthCare
              </h2>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="w-32 h-1 bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-full"></div>
                <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full mt-1 mx-auto"></div>
              </div>
            </div>
            <p className="text-xl text-gray-800 mt-8 max-w-2xl mx-auto leading-relaxed">
              Empowering the future, one birth at a time
            </p>
          </div>
          
          {/* Main Content Card */}
          <div className="group relative">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#FDB3C2]/50 via-[#F891A5]/30 to-white rounded-3xl opacity-20 group-hover:opacity-40 transition-all duration-1000 blur-lg group-hover:blur-xl"></div>
            
            <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl overflow-hidden">
              {/* Inner glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-[#FDB3C2]/10 pointer-events-none"></div>
              
              <div className="relative p-12 md:p-16">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  {/* Text Content */}
                  <div className="space-y-8">
                    <div className="relative">
                      <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-white/60 to-white/40 rounded-full"></div>
                      <p className="text-lg md:text-xl leading-relaxed text-gray-800 font-light">
                        BirthCare was founded to <span className="font-semibold text-gray-800">empower mothers and families</span> by delivering accessible, quality maternal care.
                      </p>
                    </div>
                    
                    <p className="text-lg md:text-xl leading-relaxed text-gray-800 font-light">
                      Our team of dedicated professionals is committed to <span className="font-semibold text-gray-800">guiding you through each stage of motherhood</span> with empathy, expertise, and personalized attention.
                    </p>
                    
                    <div className="flex flex-wrap gap-4 pt-4">
                      <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/20 border border-white/30">
                        <div className="w-2 h-2 bg-gray-800 rounded-full animate-pulse"></div>
                        <span className="text-gray-800 text-sm font-medium">Expert Care</span>
                      </div>
                      <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/20 border border-white/30">
                        <div className="w-2 h-2 bg-gray-800 rounded-full animate-pulse animation-delay-1000"></div>
                        <span className="text-gray-800 text-sm font-medium">Personalized Attention</span>
                      </div>
                      <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/20 border border-white/30">
                        <div className="w-2 h-2 bg-gray-800 rounded-full animate-pulse animation-delay-2000"></div>
                        <span className="text-gray-800 text-sm font-medium">Empathetic Support</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Visual Elements */}
                  <div className="relative">
                    <div className="relative mx-auto w-80 h-80">
                      {/* Central orb */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-[#FDB3C2]/25 to-white/30 rounded-full filter blur-xl animate-pulse"></div>
                      <div className="absolute inset-4 bg-gradient-to-br from-white/20 to-[#FDB3C2]/15 rounded-full backdrop-blur-sm border border-white/20">
                        <div className="absolute inset-8 bg-gradient-to-br from-white/40 via-[#FDB3C2]/30 to-white/40 rounded-full animate-spin-slow">
                          <div className="absolute inset-8 bg-gradient-to-br from-white/10 to-transparent rounded-full flex items-center justify-center">
                            <svg className="w-16 h-16 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 5.5V8.5C15 9.33 14.33 10 13.5 10H10.5C9.67 10 9 9.33 9 8.5V5.5L3 7V9H21ZM12 10.5C12.83 10.5 13.5 11.17 13.5 12V21C13.5 21.83 12.83 22.5 12 22.5S10.5 21.83 10.5 21V12C10.5 11.17 11.17 10.5 12 10.5Z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      {/* Floating icons */}
                      <div className="absolute top-8 right-8 w-12 h-12 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/40 animate-bounce animation-delay-500">
                        <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      
                      <div className="absolute bottom-8 left-8 w-12 h-12 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/40 animate-bounce animation-delay-1000">
                        <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      
                      <div className="absolute top-20 left-4 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/40 animate-bounce animation-delay-1500">
                        <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Contact Methods */}
                <div className="mt-16 pt-12 border-t border-white/20">
                  <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8">
                    <div className="group flex items-center space-x-3 px-6 py-4 bg-white/20 rounded-2xl border border-gray-800 hover:border-white/60 transition-all duration-300 cursor-pointer hover:scale-105 transform-gpu">
                      <div className="w-12 h-12 bg-white/30 rounded-xl flex items-center justify-center group-hover:bg-white/50 transition-colors duration-300">
                        <svg className="w-6 h-6 text-gray-800 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-800 font-medium">Email Us</p>
                        <p className="text-gray-800 text-sm">Get in touch</p>
                      </div>
                    </div>
                    
                    <div className="group flex items-center space-x-3 px-6 py-4 bg-white/20 rounded-2xl border border-gray-800 hover:border-white/60 transition-all duration-300 cursor-pointer hover:scale-105 transform-gpu">
                      <div className="w-12 h-12 bg-white/30 rounded-xl flex items-center justify-center group-hover:bg-white/50 transition-colors duration-300">
                        <svg className="w-6 h-6 text-gray-800 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-800 font-medium">Call Us</p>
                        <p className="text-gray-800 text-sm">24/7 Support</p>
                      </div>
                    </div>
                    
                    <div className="group flex items-center space-x-3 px-6 py-4 bg-white/20 rounded-2xl border border-gray-800 hover:border-white/60 transition-all duration-300 cursor-pointer hover:scale-105 transform-gpu">
                      <div className="w-12 h-12 bg-white/30 rounded-xl flex items-center justify-center group-hover:bg-white/50 transition-colors duration-300">
                        <svg className="w-6 h-6 text-gray-800 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-800 font-medium">Visit Us</p>
                        <p className="text-gray-800 text-sm">Our locations</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Footer with Enhanced Styling */}
      <footer className="bg-gradient-to-br from-[#FDB3C2]/30 to-[#F891A5]/20 py-12 text-center">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 flex flex-col items-center justify-between md:flex-row">
            <div className="mb-6 md:mb-0">
              <h3 className="mb-2 text-2xl font-bold text-gray-800">BirthCare</h3>
              <p className="text-gray-600">
                Your trusted maternal care partner
              </p>
            </div>
            <div className="flex space-x-4">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FDB3C2]/50 text-gray-700 transition-colors duration-300 hover:bg-[#F891A5]/50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FDB3C2]/50 text-gray-700 transition-colors duration-300 hover:bg-[#F891A5]/50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FDB3C2]/50 text-gray-700 transition-colors duration-300 hover:bg-[#F891A5]/50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                </svg>
              </a>
            </div>
          </div>
          <div className="border-t border-gray-900 pt-8">
            <p className="text-gray-600">
              © {new Date().getFullYear()} BirthCare. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
