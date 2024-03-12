import React, { useState, useEffect, useContext, useRef } from "react";
import DatePicker from "react-datepicker";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
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
    const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY; // This should be set in your .env file

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
      };

      // Update Firestore document with the new meal
      await updateDoc(docRef, {
        meals: arrayUnion(newMeal),
        recommendedCalories: Number(dateNutrients.recommendedCalories),
      });

      // // Add the new meal to the local state to update the UI immediately
      // setDateNutrients((prevDateNutrients) => ({
      //   ...prevDateNutrients,
      //   meals: [...prevDateNutrients.meals, newMeal],
      // }));
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
  });
  const [mealDescription, setMealDescription] = useState("");
  const [mealCalories, setMealCalories] = useState("");

  // Helper function to calculate total consumed calories
  const totalConsumedCalories = Array.isArray(dateNutrients.meals)
    ? dateNutrients.meals.reduce((total, meal) => total + meal.calories, 0)
    : 0;

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
        setDateNutrients({ meals: [], recommendedCalories: 2000 });
      }
    });

    return () => unsubscribe();
  }, [selectedDate, user]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };


  const caloriePercentage = dateNutrients.recommendedCalories
    ? (totalConsumedCalories / dateNutrients.recommendedCalories) * 100
    : 0;

  return (
    <div className='bg-white p-4 rounded shadow space-y-6'>
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
            {/* Tailwind's responsive class for larger screens */}
            <ChevronDownIcon className='h-5 w-5 text-gray-400 sm:h-6 sm:w-6' />
          </div>
        </div>
      </div>
      {/* <div style={{ width: 500, height: 80 }}> */}{" "}
      <p className='text-sm font-medium text-gray-700'>Consumed today:</p>
      <p className='text-lg font-medium text-gray-700'>
        {totalConsumedCalories} / {dateNutrients.recommendedCalories} Cal
      </p>
      <div className='w-full bg-gray-200 rounded-full h-6 dark:bg-gray-700'>
        <div
          className='bg-green-500 h-6 rounded-full'
          style={{ width: `${Math.min(caloriePercentage, 100)}%` }}
        ></div>
      </div>
      <br></br>
      <label className='mr-2'>Set Daily Calories: </label>
      <br></br>
      <input
        type='number'
        className='text-lg font-semibold cursor-pointer appearance-none bg-white pr-10 pl-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-green-500 w-full max-w-xs'
        value={dateNutrients.recommendedCalories}
        onChange={(e) =>
          setDateNutrients({
            ...dateNutrients,
            recommendedCalories: e.target.value,
          })
        }
      />
      {/* </div> */}
      {/* Label and Input for meal description */}
      <br></br>
      <br></br>
      <div>
        <label>Meal Description: </label>
        <input
          type='text'
          className='text-md font-semibold cursor-pointer appearance-none bg-white pr-10 pl-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-green-500 w-full max-w-xs'
          value={mealDescription}
          onChange={(e) => setMealDescription(e.target.value)}
        />{" "}
      </div>
      {/* Label and Input for adding meal calories */}
      {/* <div>
        {" "}
        <label>Meal Calories: </label>
        <input
          type='number'
          // placeholder="Meal calories"
          className='text-md font-semibold cursor-pointer appearance-none bg-white pr-10 pl-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-green-500 w-full max-w-xs'
          value={mealCalories}
          onChange={(e) => setMealCalories(e.target.value)}
        />
      </div> */}
      {/* Label and Input for setting recommended calories */}
      {/* Image upload section */}
      {imagePreviewUrl && (
        <img
          src={imagePreviewUrl}
          alt='Meal preview'
          className='h-40 w-40 object-cover'
        />
      )}
      {!imagePreviewUrl && <ImageUpload onImageUpload={onImageUpload} />}
      {/* Replace your existing Add Meal button with this one */}
      <button
        disabled={isProcessing} // Disable button while processing
        className={`btn btn-green bg-green-500 hover:bg-green-600 focus:ring-2 focus:ring-green-500 ${
          isProcessing ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={addMealWithImage}
      >
        {isProcessing ? "Processing..." : "Add Meal"}
      </button>
      {/* Display all meal entries in a table */}
      <div className='mt-4 overflow-x-auto'>
        <table className='min-w-full bg-white'>
          <thead>
            <tr className='w-full h-16 border-gray-300 border-b py-8'>
              <th className='text-left pl-14 pr-6 text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Meal Description
              </th>
              <th className='text-left pl-14 pr-6 text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Calories
              </th>
              <th className='text-left pl-14 pr-6 text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Fats (g)
              </th>
              <th className='text-left pl-14 pr-6 text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Proteins (g)
              </th>
            </tr>
          </thead>
          <tbody className='text-sm font-normal text-gray-700'>
            {Array.isArray(dateNutrients.meals) &&
              dateNutrients.meals.map((meal, index) => {
                let mealDate =
                  meal.timestamp instanceof Date
                    ? meal.timestamp
                    : new Date(meal.timestamp);
                return (
                  <tr
                    key={index}
                    className='hover:bg-gray-100 border-b border-gray-200 py-10'
                  >
                    <td className='pl-14 pr-6'>{meal.description}</td>
                    <td className='pl-14 pr-6'>{meal.calories}</td>
                    <td className='pl-14 pr-6'>{meal.fats}</td>
                    <td className='pl-14 pr-6'>{meal.proteins}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NutritionSummary;
