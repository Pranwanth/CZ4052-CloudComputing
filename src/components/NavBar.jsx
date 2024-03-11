import { Link } from 'react-router-dom';
import { useState } from 'react';
import { UserCircleIcon } from '@heroicons/react/20/solid'; // Assuming you're using Heroicons

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-white-500 border-b-2 border-green-600 shadow-sm py-3 px-5 relative">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img src="src/assets/Logo.png" alt="Meal Macro Insights Logo" className="h-12 mr-3" />
            <span className="text-xl font-serif font-bold text-green-900">Meal Macro Insights</span>
          </Link>
        </div>
        <div className="lg:hidden">
          <button onClick={toggleMenu} className="text-green-500 focus:outline-none">
            {isOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          </button>
          {isOpen && (
            <div className="absolute top-full right-0 bg-green border border-green-600 shadow-md py-2 px-4 rounded-md z-10">
              <Link to="/login" className="flex items-center text-green-700 hover:text-green-900 transition-colors duration-200">
                <UserCircleIcon className="h-6 w-6 mr-2" />
                Login
              </Link>
              <Link to="/register" className="block text-green-700 hover:text-green-900 transition-colors duration-200">Register</Link>
            </div>
          )}
        </div>
        <div className="hidden lg:flex lg:items-center lg:space-x-6">
          <Link to="/login" className="flex items-center text-green-700 hover:text-green-900 transition-colors duration-200">
            <UserCircleIcon className="h-6 w-6 mr-2" />
            Login
          </Link>
          <Link to="/register" className="text-green-700 hover:text-green-900 transition-colors duration-200">Register</Link>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
