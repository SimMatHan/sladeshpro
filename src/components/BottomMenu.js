import React, { useEffect, useState } from "react";
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
  const [prevIndex, setPrevIndex] = useState(menuItems.findIndex(item => item.path === location.pathname));
  const [direction, setDirection] = useState("none");

  useEffect(() => {
    const currentIndex = menuItems.findIndex(item => item.path === location.pathname);
    if (currentIndex > prevIndex) {
      setDirection("forward");
    } else if (currentIndex < prevIndex) {
      setDirection("backward");
    } else {
      setDirection("none");
    }
    setPrevIndex(currentIndex);
  }, [location.pathname, prevIndex]);

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-[var(--bg-color)] shadow-light flex justify-around py-3 z-50 bottom-menu">
      {menuItems.map(({ path, icon, iconFilled, label }, index) => (
        <Link
          to={path}
          key={path}
          className={`flex flex-col items-center mb-2 transition-transform duration-300 ${
            location.pathname === path ? "scale-110" : "scale-100"
          } ${
            direction === "forward" && index === prevIndex + 1
              ? "translate-x-[20%] opacity-50"
              : direction === "backward" && index === prevIndex - 1
              ? "-translate-x-[20%] opacity-50"
              : ""
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