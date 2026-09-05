import React from "react";
import { NavLink } from "react-router-dom";

const menuItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: "🏠",
  },
  {
    name: "Student Profile",
    path: "/profile",
    icon: "👤",
  },
  {
    name: "Skill Assessment",
    path: "/skill-assessment",
    icon: "🧠",
  },
  {
    name: "Interest Assessment",
    path: "/interests",
    icon: "❤️",
  },
  {
    name: "Career Analysis",
    path: "/careers",
    icon: "🎯",
  },
  {
    name: "Skill Gap",
    path: "/skill-gap",
    icon: "📊",
  },
  {
    name: "Learning Roadmap",
    path: "/roadmap",
    icon: "🗺️",
  },
  {
    name: "Projects",
    path: "/projects",
    icon: "💻",
  },
  {
    name: "Career Readiness",
    path: "/readiness",
    icon: "🚀",
  },
  {
    name: "Resume Analysis",
    path: "/resume",
    icon: "📄",
  },
  {
    name: "Job Preparation",
    path: "/job-preparation",
    icon: "💼",
  },
];

function Sidebar() {
  return (
    <aside className="sidebar">

      {/* LOGO */}
      <div className="sidebar-logo">

        <div className="logo-icon">
          AI
        </div>

        <div className="logo-text">
          <h2>Career Navigator</h2>
          <span>AI Career Guidance</span>
        </div>

      </div>

      {/* MENU */}
      <nav className="sidebar-nav">

        <p className="menu-title">
          MAIN MENU
        </p>

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <span className="sidebar-icon">
              {item.icon}
            </span>

            <span>
              {item.name}
            </span>
          </NavLink>
        ))}

      </nav>

      {/* BOTTOM */}
      <div className="sidebar-bottom">

        <div className="sidebar-help">

          <div className="help-icon">
            ?
          </div>

          <div>
            <strong>Need Help?</strong>
            <p>
              Explore your career journey
            </p>
          </div>

        </div>

        <div className="sidebar-user">

          <div className="user-avatar">
            SY
          </div>

          <div className="user-info">
            <strong>Saugat Yadav</strong>
            <span>Student</span>
          </div>

        </div>

      </div>

    </aside>
  );
}

export default Sidebar;