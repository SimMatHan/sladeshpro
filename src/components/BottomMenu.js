import React from "react";
import { Link, useLocation } from "react-router-dom";

import DrinkFilled from '../assets/HomeFilled.svg';
import Drink from '../assets/Home.svg';
import LeaderboardFilled from '../assets/LeaderboardFilled.svg';
import Leaderboard from '../assets/Leaderboard.svg';
import SendFilled from '../assets/SendFilled.svg';
import Send from '../assets/Send.svg';
import MapFilled from '../assets/MapIconFilled.svg';
import MapIcon from '../assets/MapIcon.svg';
import MenuIcon from '../assets/MenuIcon.svg';
import MenuIconFilled from '../assets/MenuFilled.svg';

const menuItems = [
  { path: "/home", icon: Drink, iconFilled: DrinkFilled, label: "Home" },
  { path: "/score", icon: Leaderboard, iconFilled: LeaderboardFilled, label: "Score" },
  { path: "/hub", icon: Send, iconFilled: SendFilled, label: "Sladesh" },
  { path: "/map", icon: MapIcon, iconFilled: MapFilled, label: "Map" },
  { path: "/more", icon: MenuIcon, iconFilled: MenuIconFilled, label: "More" },
];

const BottomMenu = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-[var(--bg-color)] shadow-light flex justify-around py-3 z-50 bottom-menu">
      {menuItems.map(({ path, icon, iconFilled, label }) => (
        <Link
          to={path}
          key={path}
          className={`flex flex-col items-center mb-2 ${
            location.pathname === path ? "menu-item-active" : ""
          }`}
        >
          <img
            src={location.pathname === path && iconFilled ? iconFilled : icon}
            alt={label}
            className="h-7 w-7"
          />
          <span
            className={`text-xs ${
              location.pathname === path
                ? 'text-[var(--highlight)] font-semibold'
                : 'text-[var(--text-muted)]'
            }`}
          >
            {label}
          </span>
        </Link>
      ))}
    </nav>
  );
};

export default BottomMenu;
