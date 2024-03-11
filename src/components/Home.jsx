import ImageUpload from '/Users/shannenlee/Documents/GitHub/CZ4052-CloudComputing/src/components/ImageUpload.jsx';
import NutritionSummary from '/Users/shannenlee/Documents/GitHub/CZ4052-CloudComputing/src/components/NutritionSummary.jsx';

const Home = () => {
  
  const nutritionData = {
    consumedCalories: 530,
    totalCalories: 2500,
    nutrients: {
      Calories: { actual: 856, goal: 2500, color: '#4ade80' },
      Protein: { actual: 128, goal: 300, color: '#fbbf24' },
      Carbs: { actual: 173, goal: 300, color: '#60a5fa' },
      Fats: { actual: 199, goal: 70, color: '#f87171' }
    }}

  const handleImageUpload = (file) => {
    // You can now send this file to the server or process it with OpenAI's API
    console.log(file);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center" style={{backgroundImage: "url('src/assets/Background1.png')"}}>
      <div className="container mx-auto p-4">
      <NutritionSummary {...nutritionData} />
      
      <div className="bg-white bg-opacity-90 p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-8">Upload Your Meal Image</h1>
        <ImageUpload onImageUpload={handleImageUpload} />
      </div>
    </div></div>
  );
};

export default Home;
