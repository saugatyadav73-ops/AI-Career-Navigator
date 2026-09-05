import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Layout from "./components/Layout";

import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import SkillAssessment from "./pages/SkillAssessment";
import Careers from "./pages/Careers";
import SkillGap from "./pages/SkillGap";
import Roadmap from "./pages/Roadmap";
import Projects from "./pages/Projects";
import Readiness from "./pages/Readiness";
import Resume from "./pages/Resume";
import JobPreparation from "./pages/JobPreparation";
import MockInterview from "./pages/MockInterview";
import Interests from "./pages/Interests";

function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f4f7fb",
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      <div
        style={{
          textAlign: "center",
          background: "white",
          padding: "50px",
          borderRadius: "20px",
          boxShadow:
            "0 5px 20px rgba(0,0,0,0.08)",
        }}
      >
        <h1>
          🚀 AI Career Navigator
        </h1>

        <p
          style={{
            color: "#64748b",
            marginBottom:
              "25px",
          }}
        >
          Discover your career,
          skills and learning roadmap.
        </p>

        <button
          type="button"
          onClick={() => {
            window.location.href =
              "/dashboard";
          }}
          style={{
            padding:
              "14px 30px",
            background:
              "#2563eb",
            color: "white",
            border: "none",
            borderRadius:
              "8px",
            fontWeight:
              "bold",
            cursor:
              "pointer",
          }}
        >
          Go to Dashboard →
        </button>
      </div>
    </div>
  );
}

function About() {
  return (
    <div
      style={{
        padding: "50px",
        textAlign: "center",
      }}
    >
      <h1>
        About AI Career Navigator
      </h1>

      <p>
        AI Career Navigator helps students
        discover suitable careers based on
        their skills, interests and goals.
      </p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* HOME */}

        <Route
          path="/"
          element={<Home />}
        />

        {/* ABOUT */}

        <Route
          path="/about"
          element={<About />}
        />

        {/* DASHBOARD */}

        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />

        {/* PROFILE */}

        <Route
          path="/profile"
          element={
            <Layout>
              <Profile />
            </Layout>
          }
        />

        {/* SKILL ASSESSMENT */}

        <Route
          path="/skill-assessment"
          element={
            <Layout>
              <SkillAssessment />
            </Layout>
          }
        />
        <Route
  path="/interests"
  element={
    <Layout>
      <Interests />
    </Layout>
  }
/>

        {/* CAREERS */}

        <Route
          path="/careers"
          element={
            <Layout>
              <Careers />
            </Layout>
          }
        />

        {/* SKILL GAP */}

        <Route
          path="/skill-gap"
          element={
            <Layout>
              <SkillGap />
            </Layout>
          }
        />

        {/* ROADMAP */}

        <Route
          path="/roadmap"
          element={
            <Layout>
              <Roadmap />
            </Layout>
          }
        />

        {/* PROJECTS */}

        <Route
          path="/projects"
          element={
            <Layout>
              <Projects />
            </Layout>
          }
        />

        {/* READINESS */}

        <Route
          path="/readiness"
          element={
            <Layout>
              <Readiness />
            </Layout>
          }
        />

        {/* RESUME */}

        <Route
          path="/resume"
          element={
            <Layout>
              <Resume />
            </Layout>
          }
        />

        {/* JOB PREPARATION */}

        <Route
          path="/job-preparation"
          element={
            <Layout>
              <JobPreparation />
            </Layout>
          }
        />

        {/* MOCK INTERVIEW */}

        <Route
          path="/mock-interview"
          element={
            <Layout>
              <MockInterview />
            </Layout>
          }
        />


      </Routes>
    </BrowserRouter>
  );
}

export default App;