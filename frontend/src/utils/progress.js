// src/utils/progress.js

import {
  getStudentData,
  saveStudentData,
} from "./studentStorage";

// ------------------------------------
// Module Keys
// ------------------------------------

export const MODULE_KEYS = {
  PROFILE: "profile",
  ASSESSMENT: "assessment",
  INTEREST: "interest",
  CAREER: "career",
  SKILL_GAP: "skillGap",
  ROADMAP: "roadmap",
  PROJECTS: "projects",
  READINESS: "readiness",
  RESUME: "resume",
  JOB_PREPARATION: "jobPreparation",
};

// ------------------------------------
// Module Information
// ------------------------------------

export const MODULES = [
  {
    key: MODULE_KEYS.PROFILE,
    name: "Student Profile",
    path: "/profile",
  },
  {
    key: MODULE_KEYS.ASSESSMENT,
    name: "Skill Assessment",
    path: "/skill-assessment",
  },
  {
    key: MODULE_KEYS.INTEREST,
    name: "Interest Assessment",
    path: "/interests",
  },
  {
    key: MODULE_KEYS.CAREER,
    name: "Career Analysis",
    path: "/careers",
  },
  {
    key: MODULE_KEYS.SKILL_GAP,
    name: "Skill Gap",
    path: "/skill-gap",
  },
  {
    key: MODULE_KEYS.ROADMAP,
    name: "Learning Roadmap",
    path: "/roadmap",
  },
  {
    key: MODULE_KEYS.PROJECTS,
    name: "Projects",
    path: "/projects",
  },
  {
    key: MODULE_KEYS.READINESS,
    name: "Career Readiness",
    path: "/readiness",
  },
  {
    key: MODULE_KEYS.RESUME,
    name: "Resume",
    path: "/resume",
  },
  {
    key: MODULE_KEYS.JOB_PREPARATION,
    name: "Job Preparation",
    path: "/job-preparation",
  },
];

// ------------------------------------
// Default Progress
// ------------------------------------

const DEFAULT_PROGRESS = {
  profile: false,
  assessment: false,
  interest: false,
  career: false,
  skillGap: false,
  roadmap: false,
  projects: false,
  readiness: false,
  resume: false,
  jobPreparation: false,
};

// ------------------------------------
// Get Progress
// ------------------------------------

export const getProgress = () => {
  try {
    const savedProgress = getStudentData(
      "moduleProgress",
      null
    );

    if (!savedProgress) {
      return { ...DEFAULT_PROGRESS };
    }

    return {
      ...DEFAULT_PROGRESS,
      ...savedProgress,
    };
  } catch (error) {
    console.error(
      "Error reading module progress:",
      error
    );

    return { ...DEFAULT_PROGRESS };
  }
};

// ------------------------------------
// Save Progress
// ------------------------------------

export const saveProgress = (progress) => {
  try {
    saveStudentData(
      "moduleProgress",
      progress
    );

    window.dispatchEvent(
      new Event("careerProgressUpdated")
    );
  } catch (error) {
    console.error(
      "Error saving module progress:",
      error
    );
  }
};

// ------------------------------------
// Complete Module
// ------------------------------------

export const completeModule = (moduleKey) => {
  const progress = getProgress();

  progress[moduleKey] = true;

  saveProgress(progress);

  return progress;
};

// ------------------------------------
// Check Module Completion
// ------------------------------------

export const isModuleCompleted = (moduleKey) => {
  const progress = getProgress();

  return progress[moduleKey] === true;
};

// ------------------------------------
// Check Module Unlock
// ------------------------------------

export const isModuleUnlocked = (moduleKey) => {
  const moduleIndex = MODULES.findIndex(
    (module) => module.key === moduleKey
  );

  // Invalid module
  if (moduleIndex === -1) {
    return false;
  }

  // First module is always unlocked
  if (moduleIndex === 0) {
    return true;
  }

  const previousModule =
    MODULES[moduleIndex - 1];

  return isModuleCompleted(
    previousModule.key
  );
};

// ------------------------------------
// Get Completed Modules
// ------------------------------------

export const getCompletedModules = () => {
  const progress = getProgress();

  return MODULES.filter(
    (module) =>
      progress[module.key] === true
  );
};

// ------------------------------------
// Get Progress Percentage
// ------------------------------------

export const getProgressPercentage = () => {
  const completedModules =
    getCompletedModules();

  const percentage =
    (completedModules.length /
      MODULES.length) *
    100;

  return Math.round(percentage);
};

// ------------------------------------
// Reset Progress
// ------------------------------------

export const resetProgress = () => {
  saveProgress({
    ...DEFAULT_PROGRESS,
  });
};