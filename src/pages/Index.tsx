import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isHydrating, onboardingComplete, currentRole } = useAppContext();

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    if (!isAuthenticated) {
      navigate("/dashboard");
      return;
    }

    if (currentRole === "platform_admin") {
      navigate("/admin");
      return;
    }

    if (currentRole === "reseller") {
      navigate("/reseller");
      return;
    }

    navigate(onboardingComplete ? "/dashboard" : "/onboarding");
  }, [currentRole, isAuthenticated, isHydrating, navigate, onboardingComplete]);

  return null;
};

export default Index;
