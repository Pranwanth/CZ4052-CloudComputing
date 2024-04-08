import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import NutritionSummary from "../components/NutritionSummary";
import { AuthContext } from "../contexts/AuthContext";

const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  return (
    <div
      className='min-h-screen flex items-center justify-center bg-cover bg-center'
      style={{ backgroundImage: "url('src/assets/Background1.png')" }}
    >
      <div className='container mx-auto p-4'>
        <NutritionSummary />
      </div>
    </div>
  );
};

export default Home;
