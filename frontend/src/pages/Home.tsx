import {useNavigate} from "react-router-dom";
import "../index.css";

const Home = () => {
  const navigate = useNavigate()

  const gotoVolunteers = () => {
    navigate("/volunteers")
  };

  const gotoOpportunities = () => {
    navigate("/opportunities")
  };

  return (
    <>
      <div>
        <div className="page-flexbox-main">
          <h1 className="page-header">Welcome!</h1>
          <br></br>
          <p>Here you can manage, view, edit, and add to our list of volunteers and the opportunities they are assigned to.</p>
          <br></br>
          <div className="page-flexbox-row">
            <button 
            type="button" 
            className="mt-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-base font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={gotoVolunteers}>
                  Manage Volunteers
            </button>
            <button 
            type="button" 
            className="mt-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-base font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={gotoOpportunities}>
                  Manage Opportunites
            </button>
          </div>
        </div>
      </div>
    </>
);

};

export default Home;
