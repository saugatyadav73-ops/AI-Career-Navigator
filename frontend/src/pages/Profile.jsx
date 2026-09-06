import React, { useState } from "react";
import { completeModule, MODULE_KEYS } from "../utils/progress";
import ModuleCompleteButton from "../components/ModuleCompleteButton";
import {
  getStudentData,
  saveStudentData,
} from "../utils/studentStorage";

function Profile() {
  const savedProfile = getStudentData("studentProfile", null);

  const [profile, setProfile] = useState(
    savedProfile || {
      fullName: "",
      email: "",
      phone: "",
      college: "",
      education: "",
      skills: "",
      interests: "",
      careerInterest: "",
      projects: "",
      experience: "",
    }
  );

  const [profileSaved, setProfileSaved] = useState(
    !!savedProfile
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));

    setProfileSaved(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    saveStudentData("studentProfile", profile);

    completeModule(MODULE_KEYS.PROFILE);

    setProfileSaved(true);

    alert("Profile saved successfully!");
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Student Profile</h1>

        <p style={styles.subtitle}>
          Tell us about yourself to get personalized
          career recommendations.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={styles.section}>
            <h2>Personal Information</h2>

            <label style={styles.label}>Full Name</label>

            <input
              style={styles.input}
              type="text"
              name="fullName"
              placeholder="Enter your full name"
              value={profile.fullName}
              onChange={handleChange}
              required
            />

            <label style={styles.label}>Email</label>

            <input
              style={styles.input}
              type="email"
              name="email"
              placeholder="Enter your email"
              value={profile.email}
              onChange={handleChange}
              required
            />

            <label style={styles.label}>
              Phone Number
            </label>

            <input
              style={styles.input}
              type="tel"
              name="phone"
              placeholder="Enter your phone number"
              value={profile.phone}
              onChange={handleChange}
            />
          </div>

          <div style={styles.section}>
            <h2>Education</h2>

            <label style={styles.label}>
              College / University
            </label>

            <input
              style={styles.input}
              type="text"
              name="college"
              placeholder="Enter your college or university"
              value={profile.college}
              onChange={handleChange}
            />

            <label style={styles.label}>
              Education Level
            </label>

            <select
              style={styles.select}
              name="education"
              value={profile.education}
              onChange={handleChange}
            >
              <option value="">
                Select education level
              </option>

              <option value="Diploma">Diploma</option>
              <option value="Bachelor">Bachelor</option>
              <option value="Master">Master</option>
              <option value="PhD">PhD</option>
            </select>
          </div>

          <div style={styles.section}>
            <h2>Skills</h2>

            <label style={styles.label}>
              Technical Skills
            </label>

            <textarea
              style={styles.textarea}
              name="skills"
              placeholder="Example: Java, Python, C, HTML, CSS, JavaScript, React"
              value={profile.skills}
              onChange={handleChange}
              rows="4"
            />
          </div>

          <div style={styles.section}>
            <h2>Interests</h2>

            <label style={styles.label}>
              Your Interests
            </label>

            <textarea
              style={styles.textarea}
              name="interests"
              placeholder="Example: Artificial Intelligence, Web Development, Cyber Security"
              value={profile.interests}
              onChange={handleChange}
              rows="4"
            />

            <label style={styles.label}>
              Career Interest
            </label>

            <select
              style={styles.select}
              name="careerInterest"
              value={profile.careerInterest}
              onChange={handleChange}
            >
              <option value="">
                Select career interest
              </option>

              <option value="AI/ML Engineer">
                AI/ML Engineer
              </option>

              <option value="Software Developer">
                Software Developer
              </option>

              <option value="Web Developer">
                Web Developer
              </option>

              <option value="Data Scientist">
                Data Scientist
              </option>

              <option value="Cyber Security Engineer">
                Cyber Security Engineer
              </option>

              <option value="Cloud Engineer">
                Cloud Engineer
              </option>

              <option value="UI/UX Designer">
                UI/UX Designer
              </option>
            </select>
          </div>

          <div style={styles.section}>
            <h2>Projects & Experience</h2>

            <label style={styles.label}>
              Projects
            </label>

            <textarea
              style={styles.textarea}
              name="projects"
              placeholder="Describe your projects"
              value={profile.projects}
              onChange={handleChange}
              rows="4"
            />

            <label style={styles.label}>
              Experience / Knowledge Level
            </label>

            <select
              style={styles.select}
              name="experience"
              value={profile.experience}
              onChange={handleChange}
            >
              <option value="">
                Select level
              </option>

              <option value="Beginner">
                Beginner
              </option>

              <option value="Intermediate">
                Intermediate
              </option>

              <option value="Advanced">
                Advanced
              </option>
            </select>
          </div>

          {!profileSaved && (
            <button
              type="submit"
              style={styles.button}
            >
              Save Profile
            </button>
          )}
        </form>

        {profileSaved && (
          <div style={styles.continueContainer}>
            <p style={styles.successMessage}>
              ✓ Profile saved successfully!
            </p>

            <ModuleCompleteButton
              moduleKey={MODULE_KEYS.PROFILE}
              nextPath="/skill-assessment"
            >
              Complete Profile & Continue
            </ModuleCompleteButton>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f7fb",
    padding: "40px 20px",
  },

  container: {
    maxWidth: "800px",
    margin: "0 auto",
    background: "#ffffff",
    padding: "35px",
    borderRadius: "15px",
    boxShadow: "0 5px 25px rgba(0,0,0,0.08)",
  },

  title: {
    textAlign: "center",
    marginBottom: "10px",
    color: "#1e293b",
  },

  subtitle: {
    textAlign: "center",
    color: "#64748b",
    marginBottom: "30px",
  },

  section: {
    marginBottom: "30px",
    padding: "20px",
    background: "#f8fafc",
    borderRadius: "10px",
  },

  label: {
    display: "block",
    marginTop: "15px",
    marginBottom: "7px",
    fontWeight: "600",
    color: "#334155",
  },

  input: {
    width: "100%",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    fontSize: "15px",
    boxSizing: "border-box",
  },

  textarea: {
    width: "100%",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    fontSize: "15px",
    boxSizing: "border-box",
    resize: "vertical",
  },

  select: {
    width: "100%",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    fontSize: "15px",
    boxSizing: "border-box",
    background: "#ffffff",
  },

  button: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
  },

  continueContainer: {
    marginTop: "10px",
    textAlign: "center",
  },

  successMessage: {
    color: "#16a34a",
    fontWeight: "600",
    fontSize: "16px",
    marginBottom: "5px",
  },
};

export default Profile;