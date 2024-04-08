import { ChevronDownIcon } from "@heroicons/react/20/solid";
import axios from "axios";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import "react-circular-progressbar/dist/styles.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import ImageUpload from "../components/ImageUpload";
import { AuthContext } from "../contexts/AuthContext";
import app from "../firebaseApp";

const db = getFirestore(app);

const NutritionSummary = () => {
  const [mealImage, setMealImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const onImageUpload = (file) => {
    setMealImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const fetchMealExplanation = async (file) => {
    const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

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
                text: "Please provide a simple description of the food in the picture, and how it is healthy/unhealthy. Respond with only 100 words or less.",
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
        const explainString = response.data.choices[0].message.content;
        console.log(explainString);

        return explainString;
      }
    } catch (error) {
      console.error("Error calling OpenAI Vision API:", error);
    }
  };

  const processImage = async (file) => {
    const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

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
                text: "Please provide an estimated nutritional breakdown of the meal shown in the image. Respond with a simple JSON object with estimated values for 'calories', 'carbs', 'fats', and 'proteins' in grams. Avoid explanatory text, just provide the values in JSON format.",
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

        console.log(macronutrients);
        return macronutrients;
      }
    } catch (error) {
      console.error("Error calling OpenAI Vision API:", error);
    }
  };

  const [expandedMealId, setExpandedMealId] = useState(null);

  const removeImage = () => {
    setMealImage(null);
    setImagePreviewUrl("");
  };

  const toggleMealImageDisplay = (mealId) => {
    setExpandedMealId((prevId) => (prevId === mealId ? null : mealId));
  };

  const addMealWithImage = async () => {
    setIsProcessing(true);

    try {
      const { calories, carbs, fats, proteins } = await processImage(mealImage);
      const explanation = await fetchMealExplanation(mealImage);
      const dateString = selectedDate.toISOString().split("T")[0];
      const mealsCollectionRef = collection(
        db,
        "users",
        user.uid,
        "nutritionSummaries",
        dateString,
        "meals"
      );
      const newMealId = doc(mealsCollectionRef).id;
      const newMeal = {
        id: newMealId, description: mealDescription,
        calories,
        carbs,
        fats,
        proteins,
        explanation,
        timestamp: new Date(),
        image: imagePreviewUrl,
      };

      const docRef = doc(
        db,
        "users",
        user.uid,
        "nutritionSummaries",
        dateString
      );

      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          meals: arrayUnion(newMeal),
        });
      } else {
        await setDoc(docRef, {
          meals: [newMeal],
        });
      }

      setMealDescription("");
      removeImage();
      setIsAddMealModalOpen(false);
    } catch (error) {
      console.error("Error adding new meal:", error);
    }

    setIsProcessing(false);
  };

  const { user } = useContext(AuthContext);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateNutrients, setDateNutrients] = useState({
    meals: [],
    recommendedCalories: 2000,
    recommendedCarbs: 300,
    recommendedFats: 70, recommendedProteins: 60,
  });
  const totalCalories =
    dateNutrients.meals && Array.isArray(dateNutrients.meals)
      ? dateNutrients.meals.reduce((acc, meal) => acc + meal.calories, 0)
      : 0;
  const totalCarbs =
    dateNutrients.meals && Array.isArray(dateNutrients.meals)
      ? dateNutrients.meals.reduce((acc, meal) => acc + meal.carbs, 0)
      : 0;
  const totalFats =
    dateNutrients.meals && Array.isArray(dateNutrients.meals)
      ? dateNutrients.meals.reduce((acc, meal) => acc + meal.fats, 0)
      : 0;
  const totalProteins =
    dateNutrients.meals && Array.isArray(dateNutrients.meals)
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
          recommendedCarbs: 300,
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

  const carbsPercentage = dateNutrients.recommendedCarbs
    ? (totalCalories / dateNutrients.recommendedCarbs) * 100
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

  const [newRecommendedCarbs, setNewRecommendedCarbs] = useState(
    dateNutrients.recommendedCarbs
  );

  const [newRecommendedFats, setNewRecommendedFats] = useState(
    dateNutrients.recommendedFats
  );
  const [newRecommendedProteins, setNewRecommendedProteins] = useState(
    dateNutrients.recommendedProteins
  );

  const handleSaveNewIntakes = async () => {
    const dateString = selectedDate.toISOString().split("T")[0];
    const docRef = doc(db, "users", user.uid, "nutritionSummaries", dateString);

    const updatedValues = {
      recommendedCalories: newRecommendedCalories,
      recommendedCarbs: newRecommendedCarbs,
      recommendedFats: newRecommendedFats,
      recommendedProteins: newRecommendedProteins,
    };

    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await updateDoc(docRef, updatedValues);
    } else {
      await setDoc(docRef, updatedValues);
    }

    setDateNutrients((prevState) => ({
      ...prevState,
      ...updatedValues,
    }));

    setEditModalOpen(false);
  };

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
        const data = docSnapshot.data();
        setDateNutrients(data);
      } else {
      }
    });

    return () => unsubscribe();
  }, [selectedDate, user]);

  const toggleAddMealModal = () => {
    setIsAddMealModalOpen(!isAddMealModalOpen);
  };

  const handleRemoveMeal = async (mealId) => {
    const dateString = selectedDate.toISOString().split("T")[0];
    const docRef = doc(db, "users", user.uid, "nutritionSummaries", dateString);

    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const currentMeals = docSnap.data().meals;
      const updatedMeals = currentMeals.filter((meal) => meal.id !== mealId);

      await updateDoc(docRef, {
        meals: updatedMeals,
      });

      setDateNutrients((prevState) => ({
        ...prevState,
        meals: updatedMeals,
      }));
    }
  };

  const [isEditMealModalOpen, setIsEditMealModalOpen] = useState(false);
  const [currentMealBeingEdited, setCurrentMealBeingEdited] = useState(null);

  const handleEditMeal = (mealId) => {
    const mealToEdit = dateNutrients.meals.find((meal) => meal.id === mealId);
    setCurrentMealBeingEdited(mealToEdit);
    setIsEditMealModalOpen(true);
  };

  const handleSubmitEditMeal = async (e) => {
    e.preventDefault();
    const dateString = selectedDate.toISOString().split("T")[0];
    const docRef = doc(db, "users", user.uid, "nutritionSummaries", dateString);

    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const currentMeals = docSnap.data().meals;
      const updatedMeals = currentMeals.map((meal) => {
        if (meal.id === currentMealBeingEdited.id) {
          return currentMealBeingEdited;
        }
        return meal;
      });

      await updateDoc(docRef, {
        meals: updatedMeals,
      });

      setDateNutrients((prevState) => ({
        ...prevState,
        meals: updatedMeals,
      }));
    } else {
      console.error("Document does not exist");
    }

    setIsEditMealModalOpen(false);
  };

  const handleImageChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentMealBeingEdited((prev) => ({
          ...prev,
          image: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className='bg-green-50 p-4 rounded-lg shadow'>
      {/* DATE */}
      <div className='flex justify-between items-center'>
        <div className='relative mt-2'>
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
            src='src/assets/editicon.png'
            alt='Edit'
            className='h-6 w-6'
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

        <p className='text-sm  text-gray-700 mb-4'>Carbs 🍞</p>
        <div className='text-3xl flex items-center space-x-1 mb-4'>
          <p className='font-medium text-green-700'>{totalCarbs} </p>
          <p className='font-medium text-gray-700'>
            / {dateNutrients.recommendedCarbs} g
          </p>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-6 dark:bg-gray-700 mb-8'>
          <div
            className='bg-green-700 h-6 rounded-full'
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
          <div className='relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white'>
            <span
              className='close absolute top-0 right-0 text-2xl font-bold p-2 cursor-pointer'
              onClick={() => setEditModalOpen(false)}
            >
              &times;
            </span>
            <div className='mt-3 '>
              <h3 className='text-lg text-center leading-6 font-medium text-gray-900'>
                Edit Daily Intakes
              </h3>
              <div className='mt-2 px-7 py-3'>
                <label className='mt-6 block text-sm font-medium text-gray-700'>
                  Calories:
                </label>
                <input
                  type='number'
                  className='mt-2 text-md font-semibold cursor-pointer appearance-none bg-white pr-10 pl-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-green-500 w-full'
                  value={newRecommendedCalories}
                  onChange={(e) => setNewRecommendedCalories(e.target.value)}
                />
                <label className='mt-6 block text-sm font-medium text-gray-700'>
                  Carbs:
                </label>
                <input
                  type='number'
                  className='mt-2 text-md font-semibold cursor-pointer appearance-none bg-white pr-10 pl-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-green-500 w-full'
                  value={newRecommendedCarbs}
                  onChange={(e) => setNewRecommendedCarbs(e.target.value)}
                />
                <label className='mt-6 block text-sm font-medium text-gray-700'>
                  Fats (g):
                </label>
                <input
                  type='number'
                  className='mt-2 text-md font-semibold cursor-pointer appearance-none bg-white pr-10 pl-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-green-500 w-full'
                  value={newRecommendedFats}
                  onChange={(e) => setNewRecommendedFats(e.target.value)}
                />
                <label className=' mt-6 block text-sm font-medium text-gray-700'>
                  Proteins (g):
                </label>
                <input
                  type='number'
                  className='mt-2 text-md font-semibold cursor-pointer appearance-none bg-white pr-10 pl-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-green-500 w-full'
                  value={newRecommendedProteins}
                  onChange={(e) => setNewRecommendedProteins(e.target.value)}
                />
              </div>
              <div className='mt-8 flex justify-end space-x-2'>
                <button
                  id='ok-btn'
                  className='bg-green-600 text-white px-4 py-2 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                  onClick={handleSaveNewIntakes}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TABLE */}

      <br></br>
      <div className='mt-4 overflow-x-auto'>
        <table
          className='min-w-full rounded-lg'
          style={{ backgroundColor: "#d0e7ca" }}
        >
          {/* TABLE HEADER */}

          <thead>
            <tr
              className='w-full h-16 border-b py-8'
              style={{ borderColor: "rgba(106, 165, 129, 1)" }}
            >
              <th className='text-left pl-4 pr-10 text-xs font-medium text-gray-500 uppercase '>
                Meal
              </th>
              <th className='text-left pl-2 pr-2 text-xs font-medium text-gray-500 uppercase'>
                Calories
              </th>
              <th className='text-left pl-2 pr-2 text-xs font-medium text-gray-500 uppercase '>
                Carbs
              </th>
              <th className='text-left pl-2 pr-2 text-xs font-medium text-gray-500 uppercase '>
                Fats
              </th>
              <th className='text-left pl-2 pr-2 text-xs font-medium text-gray-500 uppercase '>
                Proteins
              </th>
            </tr>
          </thead>

          {/* TABLE BODY */}

          <tbody className='text-sm font-normal text-gray-700'>
            {Array.isArray(dateNutrients.meals) &&
              dateNutrients.meals.map((meal, index) => {
                return (
                  <>
                    <tr
                      key={meal.id}
                      className='hover:bg-gray-300 border-b py-10 cursor-pointer'
                      style={{ borderColor: "rgba(106, 165, 129, 0.3)" }}
                    >
                      <td className='pl-4 pr-2'>{meal.description}</td>
                      <td className='pl-2 pr-2'>{meal.calories}</td>
                      <td className='pl-2 pr-2'>{meal.carbs}</td>
                      <td className='pl-2 pr-2'>{meal.fats}</td>
                      <td className='pl-2 pr-2'>{meal.proteins}</td>
                      <td>
                        <button onClick={() => toggleMealImageDisplay(meal.id)}>
                          <ChevronDownIcon className='h-5 w-5 text-gray-400 sm:h-6 sm:w-6' />
                        </button>
                      </td>
                    </tr>
                    {expandedMealId === meal.id && (
                      <tr>
                        <td colSpan='5' className='relative'>
                          <img
                            src={meal.image}
                            alt={`Meal ${meal.description}`}
                            className='w-20 h-20 object-cover rounded-lg mt-6 ml-2 mb-6'
                          />
                          <p>{meal.explanation}</p>
                          <div className='absolute right-0 top-0 flex items-center'>
                            {" "}
                            {/* Container for icons */}
                            <button
                              onClick={() => handleEditMeal(meal.id)}
                              className='p-1 mt-2'
                            >
                              <img
                                src='src/assets/editicon.png'
                                alt='Edit'
                                className='h-6 w-6'
                              />
                            </button>
                            <button
                              onClick={() => handleRemoveMeal(meal.id)}
                              className='p-1 ml-2 mr-3 mt-2'
                            >
                              <img
                                src='src/assets/deleteicon.png'
                                alt='Delete'
                                className='h-6 w-6'
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {isEditMealModalOpen && (
                      <div
                        className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full'
                        id='edit-meal-modal'
                      >
                        <div className='relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white'>
                          <div className='modal-content'>
                            <span
                              className='close absolute top-0 right-0 text-2xl font-bold p-2 cursor-pointer'
                              onClick={() => setIsEditMealModalOpen(false)}
                            >
                              &times;
                            </span>
                            <h3 className='text-lg text-center leading-6 font-medium text-gray-900 mb-4'>
                              Edit Meal
                            </h3>
                            <form
                              onSubmit={handleSubmitEditMeal}
                              className='space-y-4'
                            >
                              <div>
                                <label
                                  htmlFor='meal-description'
                                  className='mt-10 mb-2 block text-sm font-medium text-gray-700'
                                >
                                  Meal Description:
                                </label>
                                <input
                                  type='text'
                                  id='meal-description'
                                  className='mt-1 mb-8 text-md font-semibold cursor-pointer appearance-none bg-white pr-10 pl-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-green-500 w-full'
                                  value={
                                    currentMealBeingEdited?.description || ""
                                  }
                                  onChange={(e) =>
                                    setCurrentMealBeingEdited((prev) => ({
                                      ...prev,
                                      description: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div className='flex justify-center items-center flex-col'>
                                {currentMealBeingEdited?.image && (
                                  <img
                                    src={currentMealBeingEdited.image}
                                    alt='Meal'
                                    className='mb-4 max-h-40 rounded-lg '
                                  />
                                )}
                                <button
                                  type='button'
                                  className='bg-blue-500 mt-3 mb-10 text-white px-4 py-2 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                  onClick={() =>
                                    document
                                      .getElementById("image-upload")
                                      .click()
                                  }
                                >
                                  Replace Image
                                </button>
                                <input
                                  type='file'
                                  id='image-upload'
                                  className='hidden'
                                  onChange={handleImageChange}
                                />
                              </div>
                              <div className='flex justify-end space-x-2'>
                                <button
                                  type='submit'
                                  className='bg-green-600 text-white px-4 py-2 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                                >
                                  Save Changes
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })}
          </tbody>

          {/* TABLE FOOTER - TOTAL MACROS */}

          <tfoot className='text-sm font-normal text-gray-700 mb-10'>
            <br></br>
            <tr>
              <td className='pl-4 pr-2 pt-2 font-bold'>Total</td>
              <td className='pl-2 pr-2 pt-2 font-bold'>{totalCalories}</td>
              <td className='pl-2 pr-2 pt-2 font-bold'>{totalCarbs}</td>
              <td className='pl-2 pr-2 pt-2 font-bold'>{totalFats}</td>
              <td className='pl-2 pr-2 pt-2 font-bold'>{totalProteins}</td>
            </tr>
            <br></br>
          </tfoot>
        </table>
      </div>

      {/* ADD MEAL BUTTON */}

      <div className='flex justify-center mt-8'>
        <button
          onClick={toggleAddMealModal}
          className='bg-white text-lg px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-green-700 text-black'
        >
          + Add Meal
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

              <h3 className='text-lg text-center leading-6 font-medium text-gray-900 mb-4'>
                Add Meal
              </h3>

              <div className='mb-12 mt-10'>
                <label
                  htmlFor='meal-description'
                  className='mb-2 block text-sm font-medium text-gray-700'
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
              )}
              <br></br>
              <br></br>
              <div className='mt-8 flex justify-end space-x-2'>
                <button
                  disabled={isProcessing}
                  className={`bg-green-600 text-white px-4 py-2 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${isProcessing ? "opacity-50 cursor-not-allowed" : ""
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
