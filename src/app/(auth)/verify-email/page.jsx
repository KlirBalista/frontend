"use client";

import Button from "@/components/Button";
import Loading from "@/components/Loading";
import { useAuth } from "@/hooks/auth";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AuthCard from "../AuthCard";

const VerifyEmailContent = () => {
  const { logout, resendEmailVerification } = useAuth({
    middleware: "auth",
    redirectIfAuthenticated: "/dashboard",
  });

  const searchParams = useSearchParams();
  const [status, setStatus] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Handle email verification link clicks
  useEffect(() => {
    const verifyUrl = searchParams.get('verify_url');
    if (verifyUrl) {
      setIsVerifying(true);
      // Redirect to the backend verification URL
      window.location.href = decodeURIComponent(verifyUrl);
    }
  }, [searchParams]);

  if (isVerifying) {
    return <Loading />;
  }

  return (
    <AuthCard>
      <div className="mb-4 text-sm text-gray-600">
        Thanks for signing up! Before getting started, could you verify your
        email address by clicking on the link we just emailed to you? If you
        didn&apos;t receive the email, we will gladly send you another.
      </div>

      {status === "verification-link-sent" && (
        <div className="mb-4 font-medium text-sm text-green-600">
          A new verification link has been sent to the email address you
          provided during registration.
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <Button onClick={() => resendEmailVerification({ setStatus })}>
          Resend Verification Email
        </Button>

        <button
          type="button"
          className="underline text-sm text-gray-600 hover:text-gray-900"
          onClick={logout}
        >
          Logout
        </button>
      </div>
    </AuthCard>
  );
};

const Page = () => {
  return (
    <Suspense fallback={<Loading />}>
      <VerifyEmailContent />
    </Suspense>
  );
};

export default Page;
