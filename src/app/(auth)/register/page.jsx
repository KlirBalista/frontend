"use client";

import Button from "@/components/Button.jsx";
import Input from "@/components/Input.jsx";
import InputError from "@/components/InputError.jsx";
import Label from "@/components/Label.jsx";
import Link from "next/link";
import { useAuth } from "@/hooks/auth";
import { useState } from "react";
import "../login/animations.css";

const RegisterPage = () => {
  const { register } = useAuth({
    middleware: "guest",
    redirectIfAuthenticated: "/dashboard",
  });
  
  const [firstname, setFirstname] = useState("");
  const [middlename, setMiddlename] = useState("");
  const [lastname, setLastname] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [errors, setErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Input sanitizers to block special characters
  const onlyLetters = (v) => v.replace(/[^A-Za-z\s]/g, "");
  const onlyDigits = (v) => v.replace(/\D/g, "");
  const onlyAlnumSpace = (v) => v.replace(/[^A-Za-z0-9\s]/g, "");

  const submitForm = async (event) => {
    event.preventDefault();

    if (!agreedToTerms) {
      setErrors({ general: ['You must agree to the terms and conditions to register.'] });
      return;
    }

    setIsLoading(true);
    try {
      await register({
        firstname,
        middlename,
        lastname,
        contact_number: contactNumber,
        address,
        email,
        password,
        password_confirmation: passwordConfirmation,
        setErrors,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Left Panel - Brand/Welcome */}
      <div className="hidden lg:flex relative overflow-hidden animate-slide-in-left">
        {/* Background Image */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/birth.jpg')" }}
          ></div>
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-16 text-white animate-fade-in-up animation-delay-300">
          {/* Logo */}
          <div className="mb-8">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E56D85] to-[#BF3853] shadow-2xl mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>

          <div className="max-w-2xl text-center">
            <h1 className="text-5xl font-bold mb-6 drop-shadow-lg whitespace-nowrap">Welcome to BirthCare</h1>
            <p className="text-xl text-white/90 leading-relaxed text-justify">
              At BirthCare, we believe that every birth story is special. Our platform is here to support you and your team in providing gentle, compassionate care—whether you're managing appointments, updating patient records, or keeping everything organized with ease. With tools made just for birthing homes, we help you focus on nurturing mothers and welcoming new life with confidence and heart.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="flex items-center justify-center p-8 lg:p-16 bg-gray-50 animate-slide-in-right">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E56D85] to-[#BF3853] shadow-lg mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">BIRTHCARE</h1>
          </div>
          {/* Form Card */}
          <div className="bg-white rounded-3xl p-8 shadow-xl max-h-[calc(100vh-4rem)] overflow-y-auto animate-fade-in-up animation-delay-300">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h2>
              <p className="text-gray-600">Fill in your details to get started</p>
            </div>

            <form onSubmit={submitForm} className="space-y-5">
              {errors.general && (
                <div className="p-4 bg-red-100 border border-red-200 text-red-700 rounded-xl">
                  <ul>
                    {errors.general.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Name Fields Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <input
                    id="firstname"
                    type="text"
                    value={firstname}
                    onChange={(event) => setFirstname(onlyLetters(event.target.value))}
                    placeholder="First Name"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E56D85] focus:border-transparent transition-all duration-300"
                    pattern="^[A-Za-z ]+$"
                    title="Only letters and spaces are allowed"
                    required
                    autoFocus
                  />
                  <InputError messages={errors.firstname} className="mt-2" />
                </div>

                {/* Last Name */}
                <div>
                  <input
                    id="lastname"
                    type="text"
                    value={lastname}
                    onChange={(event) => setLastname(onlyLetters(event.target.value))}
                    placeholder="Last Name"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E56D85] focus:border-transparent transition-all duration-300"
                    pattern="^[A-Za-z ]+$"
                    title="Only letters and spaces are allowed"
                    required
                  />
                  <InputError messages={errors.lastname} className="mt-2" />
                </div>
              </div>

              {/* Middle Name */}
              <div>
                <input
                  id="middlename"
                  type="text"
                  value={middlename}
                  onChange={(event) => setMiddlename(onlyLetters(event.target.value))}
                  placeholder="Middle Name (Optional)"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E56D85] focus:border-transparent transition-all duration-300"
                  pattern="^[A-Za-z ]*$"
                  title="Only letters and spaces are allowed"
                />
                <InputError messages={errors.middlename} className="mt-2" />
              </div>

              {/* Contact Number */}
              <div>
                <input
                  id="contact_number"
                  type="tel"
                  value={contactNumber}
                  onChange={(event) => setContactNumber(onlyDigits(event.target.value))}
                  placeholder="Contact Number"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E56D85] focus:border-transparent transition-all duration-300"
                  inputMode="numeric"
                  pattern="^[0-9]+$"
                  title="Digits only"
                />
                <InputError messages={errors.contact_number} className="mt-2" />
              </div>

              {/* Address */}
              <div>
                <input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(event) => setAddress(onlyAlnumSpace(event.target.value))}
                  placeholder="Address"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E56D85] focus:border-transparent transition-all duration-300"
                  pattern="^[A-Za-z0-9 ]*$"
                  title="Only letters, numbers and spaces are allowed"
                />
                <InputError messages={errors.address} className="mt-2" />
              </div>

              {/* Email Field */}
              <div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email Address"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E56D85] focus:border-transparent transition-all duration-300"
                  required
                />
                <InputError messages={errors.email} className="mt-2" />
              </div>

              {/* Password Fields Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password Field */}
                <div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E56D85] focus:border-transparent transition-all duration-300"
                    required
                    autoComplete="new-password"
                  />
                  <InputError messages={errors.password} className="mt-2" />
                </div>

                {/* Confirm Password Field */}
                <div>
                  <input
                    id="passwordConfirmation"
                    type="password"
                    value={passwordConfirmation}
                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                    placeholder="Confirm Password"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E56D85] focus:border-transparent transition-all duration-300"
                    required
                  />
                  <InputError messages={errors.password_confirmation} className="mt-2" />
                </div>
              </div>

              {/* Terms and Conditions Checkbox */}
              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-[#E56D85] focus:ring-[#E56D85] cursor-pointer"
                />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-[#E56D85] hover:text-[#BF3853] underline"
                  >
                    terms and conditions
                  </button>
                </label>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={!agreedToTerms || isLoading}
                className="w-full px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-[#E56D85] to-[#BF3853] rounded-xl hover:from-[#BF3853] hover:to-[#A41F39] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E56D85] transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  'Register'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-[#E56D85] hover:text-[#BF3853] transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="sticky top-0 bg-gradient-to-r from-[#BF3853] to-[#A41F39] px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Terms and Conditions</h2>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-8rem)]">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to BirthCare</h2>
              
              <p className="text-sm leading-6 text-gray-700 mb-4 text-justify">
                These Terms and Conditions ("Terms") govern your use of the BirthCare System website ("Service"), which provides maternal care information, birthing home support, patient management, and billing services. By accessing or using this Service, you agree to comply with and be bound by these Terms. If you do not agree, please discontinue use of the Service immediately.
              </p>

              <p className="text-sm leading-6 text-gray-700 mb-4 text-justify">
                BirthCare System offers digital tools and resources to assist expectant mothers, families, and birthing homes in managing prenatal, delivery, and postnatal care. The Service is intended to support—but not replace—professional medical advice, diagnosis, or treatment. Always seek guidance from licensed healthcare providers regarding any health concerns. The Company is not responsible for medical decisions or outcomes resulting from the use of information on this platform.
              </p>

              <p className="text-sm leading-6 text-gray-700 mb-4 text-justify">
                You must be at least eighteen (18) years old, or the legal age of majority in your location, to access or use this Service. When registering an account, you agree to provide accurate and complete information and to maintain the confidentiality of your login credentials. You are responsible for all activity conducted under your account, including billing and patient data management.
              </p>

              <p className="text-sm leading-6 text-gray-700 mb-4 text-justify">
                BirthCare System may process personal and medical-related information in connection with your account and use of the Service. By using the platform, you consent to the collection, use, and storage of your information as described in our Privacy Policy. We use appropriate security measures to protect data but cannot guarantee complete protection from unauthorized access or system errors.
              </p>

              <p className="text-sm leading-6 text-gray-700 mb-4 text-justify">
                All content, tools, and materials available on the Service are owned by or licensed to BirthCare System and are protected by intellectual property laws. You may use the Service and its materials solely for lawful, authorized, and non-commercial purposes related to maternal and birthing care management. You may not reproduce, distribute, or modify any content without prior written permission.
              </p>

              <p className="text-sm leading-6 text-gray-700 mb-4 text-justify">
                The Service, including all features such as billing and patient management, is provided "as is" and "as available" without any warranties of any kind. BirthCare System makes no guarantees regarding the accuracy, reliability, or availability of the Service. We shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of the Service, including billing errors, service interruptions, or data loss.
              </p>

              <p className="text-sm leading-6 text-gray-700 mb-4 text-justify">
                We may update these Terms periodically, and any revisions will take effect upon posting. Continued use of the Service after changes are made constitutes your acceptance of the revised Terms. We reserve the right to suspend or terminate your access to the Service at any time for violations of these Terms or for operational reasons.
              </p>

              <p className="text-sm leading-6 text-gray-700 mb-4 text-justify">
                These Terms are governed by the laws of the Philippines. Any disputes arising from or relating to these Terms shall be subject to the exclusive jurisdiction of the courts located in Davao City, Philippines.
              </p>

              <div className="text-sm leading-6 text-gray-700 mt-6 pt-4 border-t border-gray-200">
                <p className="font-semibold mb-2">For questions, billing inquiries, or support, please contact us at:</p>
                <p>Email: birthcare@gmail.com</p>
                <p>Address: Davao City, Philippines</p>
                <p>Phone: 09486198125</p>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setAgreedToTerms(true);
                  setShowTermsModal(false);
                }}
                className="px-6 py-2 bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white rounded-lg hover:from-[#A41F39] hover:to-[#8B1A2F] transition-all"
              >
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
