import { faRightFromBracket, faRightToBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/useAuth";

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const activeNavClass = ({ isActive }: { isActive: boolean }) => (isActive ? "text-emerald-300" : "");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="bg-emerald-800 w-full flex flex-row p-5 text-white text-2xl">
      {isAuthenticated ? (
        <>
          <div className={"gap-4 flex flex-row"}>
            <NavLink to="/volunteers" className={activeNavClass}>
              Volunteers
            </NavLink>
            <NavLink to="/opportunities" className={activeNavClass}>
              Opportunities
            </NavLink>
          </div>
          <div className={"ml-auto"}>
            <button className="cursor-pointer" onClick={handleLogout}>
              Log Out <FontAwesomeIcon icon={faRightFromBracket} className="relative top-px" />
            </button>
          </div>
        </>
      ) : (
        <div className={"ml-auto"}>
          <NavLink to="/login">
            Login <FontAwesomeIcon icon={faRightToBracket} className="relative top-px" />
          </NavLink>
        </div>
      )}
    </div>
  );
};

export default Navbar;
