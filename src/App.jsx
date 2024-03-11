import { Link } from 'react-router-dom';
import ImageUpload from './components/ImageUpload';


const App = () => {
  const handleImageUpload = (file) => {
    // You can now send this file to the server or process it with OpenAI's API
    console.log(file);
  };

  return (
    <div>
      <h1>HWLLOOOO Welcome to the Meal Nutrient App</h1>
      <nav>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </nav>
      <h2>Upload Your Meal Image</h2>
      <ImageUpload onImageUpload={handleImageUpload} />
    </div>
  );
};

export default App;


