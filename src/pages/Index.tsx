import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
<<<<<<< HEAD
import { useAppContext } from "@/context/AppContext";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isHydrating, onboardingComplete } = useAppContext();

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    if (!isAuthenticated) {
      navigate("/home");
      return;
    }

    navigate(onboardingComplete ? "/dashboard" : "/onboarding");
  }, [isAuthenticated, isHydrating, navigate, onboardingComplete]);

=======

const Index = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/home");
  }, [navigate]);
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
  return null;
};

export default Index;
