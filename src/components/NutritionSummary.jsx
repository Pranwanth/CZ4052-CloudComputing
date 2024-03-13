import React, { useState, useEffect, useContext, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-circular-progressbar/dist/styles.css";
import "react-datepicker/dist/react-datepicker.css";
import { ChevronDownIcon } from "@heroicons/react/20/solid"; // Assuming you're using Heroicons
import ImageUpload from "/Users/shannenlee/Documents/GitHub/CZ4052-CloudComputing/src/components/ImageUpload.jsx"; // Adjust the import path as necessary
import { AuthContext } from "/Users/shannenlee/Documents/GitHub/CZ4052-CloudComputing/src/contexts/AuthContext"; // Adjust the import path
import {
  getFirestore,
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  getDoc,
  setDoc
} from "firebase/firestore";
import app from "/Users/shannenlee/Documents/GitHub/CZ4052-CloudComputing/src/firebaseApp.js";
import axios from "axios";

const db = getFirestore(app);

const NutritionSummary = () => {
  const [mealImage, setMealImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(""); // New state for storing the image preview URL
  const [isProcessing, setIsProcessing] = useState(false); // New state to indicate processing status

  const onImageUpload = (file) => {
    setMealImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (file) => {
    // Assuming you have an API key stored securely on your server or using environment variables
    const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY; 

    // Function to encode the image
    const toBase64 = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });

    try {
      const base64Image = await toBase64(file);
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      };

      const payload = {
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please provide an estimated nutritional breakdown of the meal shown in the image. Respond with a simple JSON object with estimated values for 'calories', 'fats', and 'proteins' in grams. Avoid explanatory text, just provide the values in JSON format.",
              },
              {
                type: "image_url",
                image_url: {
                  url: base64Image,
                },
              },
            ],
          },
        ],
        max_tokens: 300,
      };

      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        payload,
        { headers }
      );

      if (response.data) {
        const cleanString = response.data.choices[0].message.content.replace(
          /```json\n|\n```/g,
          ""
        );
        console.log(cleanString);
        const macronutrients = JSON.parse(cleanString);

        console.log(macronutrients); // This will log the actual JavaScript object

        return macronutrients; // Returns the parsed object
      }
    } catch (error) {
      console.error("Error calling OpenAI Vision API:", error);
      // Handle the error
      // Possibly return an indication that the request failed
    }
  };

  // New state to manage which meal's image is being displayed
  const [expandedMealId, setExpandedMealId] = useState(null);

  // Function to remove the image
  const removeImage = () => {
    setMealImage(null);
    setImagePreviewUrl("");
  };

  // Function to toggle the display of the meal's image
  const toggleMealImageDisplay = (mealId) => {
    if (expandedMealId === mealId) {
      setExpandedMealId(null); // Collapse the currently expanded image
    } else {
      setExpandedMealId(mealId); // Expand the clicked image
    }
  };

  const addMealWithImage = async () => {
    setIsProcessing(true);

    try {
      const { calories, fats, proteins } = await processImage(mealImage);

      const dateString = selectedDate.toISOString().split("T")[0];
      const docRef = doc(
        db,
        "users",
        user.uid,
        "nutritionSummaries",
        dateString
      );

      const newMeal = {
        description: mealDescription,
        calories, // Use the values directly
        fats,
        proteins,
        timestamp: new Date(),
        image: imagePreviewUrl,
      };


    // Check if the document exists
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // If the document exists, update it with the new meal
      await updateDoc(docRef, {
        meals: arrayUnion(newMeal),
        recommendedCalories: Number(dateNutrients.recommendedCalories),
        recommendedFats: Number(dateNutrients.recommendedFats),
        recommendedProteins: Number(dateNutrients.recommendedProteins),
      });
    } else {
      // If the document does not exist, create it with the new meal
      await setDoc(docRef, {
        meals: [newMeal], // Initialize with the newMeal inside an array
        recommendedCalories: Number(dateNutrients.recommendedCalories),
        recommendedFats: Number(dateNutrients.recommendedFats),
        recommendedProteins: Number(dateNutrients.recommendedProteins),
      });
    }

    // Clear the input fields and image preview
    setMealDescription("");
    removeImage(); 
    setIsAddMealModalOpen(false);


    } catch (error) {
      console.error("Error processing image:", error);
    }

    setIsProcessing(false);
  };

  const { user } = useContext(AuthContext);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateNutrients, setDateNutrients] = useState({
    meals: [],
    recommendedCalories: 2000,
    recommendedFats: 70, // Set your default recommended daily fats intake
    recommendedProteins: 60, // Set your default recommended daily proteins intake
  });
  const totalCalories = dateNutrients.meals && Array.isArray(dateNutrients.meals)
  ? dateNutrients.meals.reduce((acc, meal) => acc + meal.calories, 0)
  : 0;
  const totalFats = dateNutrients.meals && Array.isArray(dateNutrients.meals)
  ? dateNutrients.meals.reduce((acc, meal) => acc + meal.fats, 0)
  : 0;
  const totalProteins = dateNutrients.meals && Array.isArray(dateNutrients.meals)
  ? dateNutrients.meals.reduce((acc, meal) => acc + meal.proteins, 0)
  : 0;

  const [mealDescription, setMealDescription] = useState("");

  useEffect(() => {
    if (!user || !user.uid) {
      console.log(
        "User is not logged in or UID is missing. Skipping Firestore access."
      );
      return;
    }

    const dateString = selectedDate.toISOString().split("T")[0];
    const docRef = doc(db, "users", user.uid, "nutritionSummaries", dateString);

    const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setDateNutrients(docSnapshot.data());
      } else {
        setDateNutrients({
          meals: [],
          recommendedCalories: 2000,
          recommendedFats: 70,
          recommendedProteins: 60,
        });
      }
    });

    return () => unsubscribe();
  }, [selectedDate, user]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const caloriePercentage = dateNutrients.recommendedCalories
    ? (totalCalories / dateNutrients.recommendedCalories) * 100
    : 0;

  const fatsPercentage = dateNutrients.recommendedFats
    ? (totalFats / dateNutrients.recommendedFats) * 100
    : 0;
  const proteinsPercentage = dateNutrients.recommendedProteins
    ? (totalProteins / dateNutrients.recommendedProteins) * 100
    : 0;

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);

  const [newRecommendedCalories, setNewRecommendedCalories] = useState(
    dateNutrients.recommendedCalories
  );
  const [newRecommendedFats, setNewRecommendedFats] = useState(
    dateNutrients.recommendedFats
  );
  const [newRecommendedProteins, setNewRecommendedProteins] = useState(
    dateNutrients.recommendedProteins
  );

  const handleSaveNewIntakes = async () => {
    // Create a reference to the Firestore document
    const dateString = selectedDate.toISOString().split("T")[0];
    const docRef = doc(db, "users", user.uid, "nutritionSummaries", dateString);
  
    // New values for daily intakes
    const updatedValues = {
      recommendedCalories: newRecommendedCalories,
      recommendedFats: newRecommendedFats,
      recommendedProteins: newRecommendedProteins,
    };
  
    // Check if the document exists
    const docSnap = await getDoc(docRef);
  
    if (docSnap.exists()) {
      // If the document exists, update it with the new values
      await updateDoc(docRef, updatedValues);
    } else {
      // If the document does not exist, create it with the new values
      await setDoc(docRef, updatedValues);
    }
  
    // Update local state
    setDateNutrients(prevState => ({
      ...prevState,
      ...updatedValues,
    }));
  
    // Close the modal
    setEditModalOpen(false);
  };
  
  useEffect(() => {
    if (!user || !user.uid) {
      console.log("User is not logged in or UID is missing. Skipping Firestore access.");
      return;
    }
  
    const dateString = selectedDate.toISOString().split("T")[0];
    const docRef = doc(db, "users", user.uid, "nutritionSummaries", dateString);
  
    const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setDateNutrients(data);
      } else {
        // Document does not exist, so you might want to handle that scenario as well.
      }
    });
  
    return () => unsubscribe();
  }, [selectedDate, user]);
  
  const toggleAddMealModal = () => {
    setIsAddMealModalOpen(!isAddMealModalOpen);
  };

  return (

    <div className='bg-green-50 p-4 rounded-lg shadow space-y-6'>

{/* DATE */}

      <div className='flex justify-between items-center'>
        <div className='relative'>
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat='eeee, d MMM yyyy'
            dropdownMode='select'
            className='text-lg font-semibold appearance-none bg-white pr-10 pl-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-green-500 w-full'
          />
          <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
            <ChevronDownIcon className='h-5 w-5 text-gray-400 sm:h-6 sm:w-6' />
          </div>
        </div>
      </div>
      <br></br>

{/* PROGRESS BARS */}

      <div className='relative bg-white p-4 rounded-lg shadow'>
        <button
          onClick={() => setEditModalOpen(true)}
          className='absolute top-2 right-2 p-1'
        >
          <img
            src='src/assets/editicon.png' // Replace with your actual path to the edit icon
            alt='Edit'
            className='h-6 w-6' // Adjust size as needed
          />
        </button>
        <p className='text-sm  text-gray-700 mb-4'>Calories 💦</p>
        <div className='text-3xl flex items-center space-x-1 mb-4'>
          <p className='font-medium text-blue-700'>{totalCalories} </p>
          <p className='font-medium text-gray-700'>
            / {dateNutrients.recommendedCalories} Cal
          </p>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-6 dark:bg-gray-700 mb-8'>
          <div
            className='bg-blue-700 h-6 rounded-full'
            style={{ width: `${Math.min(caloriePercentage, 100)}%` }}
          ></div>
        </div>

        <p className='text-sm  text-gray-700 mb-4'>Fats 🧀</p>
        <div className='text-3xl flex items-center space-x-1 mb-4'>
          <p className='font-medium text-yellow-500'>{totalFats} </p>
          <p className='font-medium text-gray-700'>
            / {dateNutrients.recommendedFats} g
          </p>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-6 dark:bg-gray-700 mb-8'>
          <div
            className='bg-yellow-500 h-6 rounded-full'
            style={{ width: `${Math.min(fatsPercentage, 100)}%` }}
          ></div>
        </div>

        <p className='text-sm  text-gray-700 mb-4'>Proteins 🍗</p>
        <div className='text-3xl flex items-center space-x-1 mb-4'>
          <p className='font-medium text-orange-700'>{totalProteins} </p>
          <p className='font-medium text-gray-700'>
            / {dateNutrients.recommendedProteins} g
          </p>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-6 dark:bg-gray-700 mb-8'>
          <div
            className='bg-orange-700 h-6 rounded-full'
            style={{ width: `${Math.min(proteinsPercentage, 100)}%` }}
          ></div>
        </div>
      </div>

{/* EDIT PROGRESS BAR MODAL */}

      {isEditModalOpen && (
        <div
          className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full'
          id='my-modal'
        >
          <div className='relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-green-50'>
            <div className='mt-3 '>
              <h3 className='text-lg text-center leading-6 font-medium text-gray-900'>
                Edit Daily Intakes:
              </h3>
              <div className='mt-2 px-7 py-3'>
                <label className='block text-sm font-medium text-gray-700'>
                  Calories:
                </label>
                <input
                  type='number'
                  className='mt-1 block w-full border-gray-300 rounded-md shadow mb-4'
                  value={newRecommendedCalories}
                  onChange={(e) => setNewRecommendedCalories(e.target.value)}
                />
                <label className='block text-sm font-medium text-gray-700'>
                  Fats (g):
                </label>
                <input
                  type='number'
                  className='mt-1 block w-full border-gray-300 rounded-md shadow mb-4'
                  value={newRecommendedFats}
                  onChange={(e) => setNewRecommendedFats(e.target.value)}
                />
                <label className='block text-sm font-medium text-gray-700'>
                  Proteins (g):
                </label>
                <input
                  type='number'
                  className='mt-1 block w-full border-gray-300 rounded-md shadow mb-4'
                  value={newRecommendedProteins}
                  onChange={(e) => setNewRecommendedProteins(e.target.value)}
                />
              </div>
              <div className='items-center px-4 py-3'>
                <button
                  id='ok-btn'
                  className='px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300'
                  onClick={handleSaveNewIntakes}
                >
                  Save
                </button>
              </div>
              <div className='items-center px-4 py-3'>
                <button
                  id='cancel-btn'
                  className='px-4 py-2 bg-white text-base font-medium rounded-md w-full shadow focus:outline-none focus:ring-2'
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
 
{/* TABLE */}

      <br></br>
      <div className='mt-4 overflow-x-auto'>
        <table className='min-w-full bg-white'>

{/* TABLE HEADER */}

          <thead>
            <tr className='w-full h-16 border-gray-300 border-b py-8'>
              <th className='text-left pl-2 pr-8 text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Meal
              </th>
              <th className='text-left pl-2 pr-2 text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Calories
              </th>
              <th className='text-left pl-2 pr-2 text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Fats (g)
              </th>
              <th className='text-left pl-2 pr-2 text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Proteins (g)
              </th>
            </tr>
          </thead>


{/* TABLE BODY */} 

          <tbody className='text-sm font-normal text-gray-700'>
            {Array.isArray(dateNutrients.meals) &&
              dateNutrients.meals.map((meal, index) => {
                let mealDate =
                  meal.timestamp instanceof Date
                    ? meal.timestamp
                    : new Date(meal.timestamp);
                return (
                  <>
                    <tr
                      key={meal.id}
                      onClick={() => toggleMealImageDisplay(meal.id)}
                      className='hover:bg-gray-100 border-b border-gray-200 py-10 cursor-pointer'
                    >
                      <td className='pl-2 pr-2'>{meal.description}</td>
                      <td className='pl-2 pr-2'>{meal.calories}</td>
                      <td className='pl-2 pr-2'>{meal.fats}</td>
                      <td className='pl-2 pr-2'>{meal.proteins}</td>
                    </tr>
                    {expandedMealId === meal.id && meal.image && (
                      <tr>
                        <td colSpan='4'>
                          <img
                            src={meal.image}
                            alt={`Meal ${meal.description}`}
                            className='w-full h-auto'
                          />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
          </tbody>

{/* TABLE FOOTER - TOTAL MACROS */}

          <tfoot className='text-sm font-normal text-gray-700'>
            <tr>
              <td className='pl-2 pr-2 pt-2 font-bold'>Total</td>
              <td className='pl-2 pr-2 pt-2 font-bold'>{totalCalories}</td>
              <td className='pl-2 pr-2 pt-2 font-bold'>{totalFats}</td>
              <td className='pl-2 pr-2 pt-2 font-bold'>{totalProteins}</td>
            </tr>
          </tfoot>
        </table>
      </div>

{/* ADD MEAL BUTTON */}

      <div className='flex justify-center mt-4'>
      <button
        onClick={toggleAddMealModal}
        className='bg-white text-lg px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-green-700 text-black'
      >
        Add Meal +
      </button>
      </div>

{/* ADD MEAL MODAL */}

      {isAddMealModalOpen && (
        <div
          className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full'
          id='add-meal-modal'
        >
          <div className='relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white'>
            {/* Modal content */}
            <div className='modal-content'>
              <span
                className='close absolute top-0 right-0 text-2xl font-bold p-2 cursor-pointer'
                onClick={toggleAddMealModal}
              >
                &times;
              </span>
              <div className='mb-12'>
                <label
                  htmlFor='meal-description'
                  className='block text-lg font-medium text-gray-700'
                >
                  Meal Description:
                </label>
                <input
                  type='text'
                  id='meal-description'
                  className='mt-1 text-md font-semibold cursor-pointer appearance-none bg-white pr-10 pl-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-green-500 w-full'
                  value={mealDescription}
                  onChange={(e) => setMealDescription(e.target.value)}
                />
              </div>
              {imagePreviewUrl && (
                <div className='relative inline-block'>
                  <img
                    src={imagePreviewUrl}
                    alt='Meal preview'
                    className='h-40 w-40 object-cover'
                  />
                  <button
                    onClick={removeImage}
                    className='absolute top-0 right-0 flex items-center justify-center bg-red-500 text-white rounded-full'
                    style={{
                      transform: "translate(50%, -50%)",
                      width: "30px",
                      height: "30px",
                    }}
                  >
                    X
                  </button>
                </div>
              )}
              {!imagePreviewUrl && (
                <ImageUpload onImageUpload={onImageUpload} />
              )}<br></br><br></br>
              <div className='flex justify-center mt-4'>
                <button
                  disabled={isProcessing}
                  className={`text-lg bg-green-50 px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-green-500  text-center ${
                    isProcessing ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={addMealWithImage}
                >
                  {isProcessing ? "Processing..." : "Add Meal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <br></br>
      <br></br>
      <br></br>
    </div>
  );
};

export default NutritionSummary;
