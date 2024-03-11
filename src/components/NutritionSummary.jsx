import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const NutritionSummary = ({ consumedCalories, totalCalories, nutrients }) => {
  const caloriePercentage = (consumedCalories / totalCalories) * 100;

  return (
    <div className="bg-white p-4 rounded shadow space-y-6">
      <h2 className="text-lg font-semibold">Today, 6 Nov 2021</h2>
      <div className="flex justify-between items-center">
        <div>
          <p>Consumed today</p>
          <p className="text-xl font-bold">{consumedCalories} / {totalCalories} Cal</p>
        </div>
        <div style={{ width: 80, height: 80 }}>
          <CircularProgressbar
            value={caloriePercentage}
            text={`${caloriePercentage.toFixed(0)}%`}
            styles={buildStyles({
              textColor: 'green',
              pathColor: 'green',
            })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(nutrients).map(([key, { actual, goal, color }]) => {
          const nutrientPercentage = (actual / goal) * 100;
          return (
            <div key={key} className="flex flex-col items-center">
              <div style={{ width: 60, height: 60 }}>
                <CircularProgressbar
                  value={nutrientPercentage}
                  text={`${actual}g`}
                  styles={buildStyles({
                    textColor: color,
                    pathColor: color,
                  })}
                />
              </div>
              <p className="mt-2">{key}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NutritionSummary;
