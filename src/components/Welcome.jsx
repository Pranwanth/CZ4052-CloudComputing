import { Link } from 'react-router-dom';

const Welcome = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-cover bg-center bg-no-repeat px-4 sm:px-6 lg:px-8" style={{ backgroundImage: "url('src/assets/Background1.png')" }}>
      <div className="max-w-2xl w-full space-y-10 lg:space-y-14">
        <div>
          <h2 className="font-serif text-center text-4xl font-extrabold text-gray-900 sm:text-5xl lg:text-6xl">
            Meal Macro Insights
          </h2>
          <p className="text-center text-sm text-green-600 sm:text-lg lg:text-xl mt-4 lg:mt-6">
            Simply snap your meals for your macronutrients insights.
          </p>
        </div>
        <div className="bg-white p-10 shadow-lg rounded-lg">
          <div className="space-y-6">
            <Link to="/login" className="w-full">
              <button className="w-full flex justify-center py-3 px-6 border border-transparent text-lg font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                Login
              </button>
            </Link>
            <br></br>
            {/* <div className="text-center">
              <span className="text-md text-gray-600 sm:text-lg">Don't have an account?</span>
            </div> */}
            <Link to="/register" className="w-full">
              <button className="w-full flex justify-center py-3 px-6 border border-transparent text-lg font-medium rounded-md text-green-600 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                Sign Up
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
