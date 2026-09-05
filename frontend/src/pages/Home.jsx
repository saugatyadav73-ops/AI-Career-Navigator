import { Link } from "react-router-dom";

function Home() {
  return (
    <div>
      <h1>AI Career Navigator</h1>
      <p>Discover the right career based on your skills and interests.</p>

      <Link to="/skill-assessment">Skill Assessment</Link>
    </div>
  );
}

export default Home;