import React from "react";
import { Link, useLocation } from "react-router-dom";

import DrinkFilled from '../assets/DrinkFilled.svg';
import Drink from '../assets/Drink.svg';
import LeaderboardFilled from '../assets/LeaderboardFilled.svg';
import Leaderboard from '../assets/Leaderboard.svg';
import SendFilled from '../assets/SendFilled.svg';
import Send from '../assets/Send.svg';
import MapFilled from '../assets/MapIconFilled.svg'; // Add Map icons
import MapIcon from '../assets/MapIcon.svg';
import MenuIcon from '../assets/MenuIcon.svg';

const BottomMenu = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white shadow-lg flex justify-around py-2 z-50">
      <Link to="/home" className="flex flex-col items-center mb-2">
        <img src={location.pathname === '/home' ? DrinkFilled : Drink} alt="Home" className="h-6 w-6" />
        <span className="text-xs text-gray-600">Home</span>
      </Link>
      <Link to="/score" className="flex flex-col items-center mb-2">
        <img src={location.pathname === '/score' ? LeaderboardFilled : Leaderboard} alt="Score" className="h-6 w-6" />
        <span className="text-xs text-gray-600">Score</span>
      </Link>
      <Link to="/hub" className="flex flex-col items-center mb-2">
        <img src={location.pathname === '/hub' ? SendFilled : Send} alt="Sladesh" className="h-6 w-6" />
        <span className="text-xs text-gray-600">Sladesh</span>
      </Link>
      <Link to="/map" className="flex flex-col items-center mb-2">
        <img src={location.pathname === '/map' ? MapFilled : MapIcon} alt="Map" className="h-6 w-6" />
        <span className="text-xs text-gray-600">Map</span>
      </Link>
      <Link to="/more" className="flex flex-col items-center mb-2">
        <img src={MenuIcon} alt="More" className="h-6 w-6" />
        <span className="text-xs text-gray-600">More</span>
      </Link>
    </nav>
  );
};

export default BottomMenu;
