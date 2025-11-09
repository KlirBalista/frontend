import useSWR from "swr";
import axios from "@/lib/axios";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export const useAuth = ({ middleware, redirectIfAuthenticated } = {}) => {
  const router = useRouter();
  const params = useParams();

  const {
    data: user,
    error,
    mutate,
  } = useSWR("/api/user", () =>
    axios
      .get("/api/user")
      .then((res) => res.data)
      .catch((error) => {
        if (error.response.status !== 409) throw error;

        router.push("/api/verify-email");
      })
  );

  const csrf = () => axios.get("/sanctum/csrf-cookie");

  const register = async ({ setErrors, ...props }) => {
    try {
      await csrf();
      setErrors([]);

      const response = await axios.post("/register", props);
      await mutate();
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: [error.message || 'Registration failed. Please try again.'] });
      }
    }
  };

  const login = async ({ setErrors, setStatus, ...props }) => {
    await csrf();

    setErrors([]);
    setStatus(null);

    try {
      await axios.post("/login", props);
      await mutate();
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors);
        return; // keep function resolved after handling validation errors
      }
      throw error;
    }
  };

  const forgotPassword = async ({ setErrors, setStatus, email }) => {
    await csrf();

    setErrors([]);
    setStatus(null);

    axios
      .post("/forgot-password", { email })
      .then((response) => setStatus(response.data.status))
      .catch((error) => {
        if (error.response.status !== 422) throw error;

        setErrors(error.response.data.errors);
      });
  };

  const resetPassword = async ({ setErrors, setStatus, ...props }) => {
    await csrf();

    setErrors([]);
    setStatus(null);

    axios
      .post("/reset-password", { token: params.token, ...props })
      .then((response) =>
        router.push("/login?reset=" + btoa(response.data.status))
      )
      .catch((error) => {
        if (error.response.status !== 422) throw error;

        setErrors(error.response.data.errors);
      });
  };

  const resendEmailVerification = ({ setStatus }) => {
    axios
      .post("/email/verification-notification")
      .then((response) => setStatus(response.data.status));
  };

  const logout = async () => {
    if (!error) {
      await axios.post("/logout").then(() => mutate());
    }

    window.location.pathname = "/";
  };

  useEffect(() => {
    if (middleware === "guest" && redirectIfAuthenticated && user) {
      // Dynamic redirect based on user role
      let dashboardUrl = redirectIfAuthenticated;
      
      if (user.system_role_id === 1) {
        dashboardUrl = "/dashboard"; // Super Admin
      } else if (user.system_role_id === 2) {
        dashboardUrl = "/facility-dashboard"; // Facility Owner
      } else if (user.system_role_id === 3) {
        // Staff - redirect to their facility dashboard
        const birthcare_Id = user?.birth_care_staff?.birth_care_id;
        if (birthcare_Id) {
          dashboardUrl = `/${birthcare_Id}/dashboard`;
        }
      }
      
      router.push(dashboardUrl);
    }

    if (middleware === "auth" && user && !user.email_verified_at)
      router.push("/verify-email");

    if (window.location.pathname === "/verify-email" && user?.email_verified_at)
      router.push(redirectIfAuthenticated);
    if (middleware === "auth" && error) logout();
  }, [user, error]);

  return {
    user,
    register,
    login,
    forgotPassword,
    resetPassword,
    resendEmailVerification,
    logout,
  };
};
