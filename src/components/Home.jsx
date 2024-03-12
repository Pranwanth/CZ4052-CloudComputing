import ImageUpload from '/Users/shannenlee/Documents/GitHub/CZ4052-CloudComputing/src/components/ImageUpload.jsx';
import NutritionSummary from '/Users/shannenlee/Documents/GitHub/CZ4052-CloudComputing/src/components/NutritionSummary.jsx';
import React, { useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Home = () => {  
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login'); // If there is no user logged in, redirect to the login page
    }
  }, [user, navigate]);
  


  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center" style={{backgroundImage: "url('src/assets/Background1.png')"}}>
      <div className="container mx-auto p-4">
      <NutritionSummary />
      
    </div></div>
  );
};

export default Home;
