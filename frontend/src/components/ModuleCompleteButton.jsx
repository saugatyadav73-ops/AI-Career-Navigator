import React from "react";
import { useNavigate } from "react-router-dom";

import {
  completeModule,
  isModuleCompleted,
} from "../utils/progress";

const ModuleCompleteButton = ({
  moduleKey,
  nextPath,
  children = "Complete Module",
}) => {
  const navigate = useNavigate();

  const completed = isModuleCompleted(moduleKey);

  const handleComplete = () => {
    completeModule(moduleKey);

    if (nextPath) {
      navigate(nextPath);
    }
  };

  return (
    <button
      type="button"
      onClick={handleComplete}
      style={{
        marginTop: "25px",
        padding: "14px 28px",
        background: completed ? "#16a34a" : "#2563eb",
        color: "#ffffff",
        border: "none",
        borderRadius: "8px",
        fontSize: "16px",
        fontWeight: "600",
        cursor: "pointer",
      }}
    >
      {completed ? "Completed ✓" : children}
    </button>
  );
};

export default ModuleCompleteButton;