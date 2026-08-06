import { Link } from "react-router-dom";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type VolunteerResultProps = {
    fName: string;
    lName: string;
    email: string;
    approvalStatus: string;
}

const VolunteerResult = ({fName, lName, email, approvalStatus}:VolunteerResultProps) => {
    return(
        <>
            <td>{fName}</td>
            <td>{lName}</td>
            <td>{email}</td>
            <td>{approvalStatus}</td>
            {/* Reroute to edit page here (routes to home page for now)*/}
            <td><Link to="/"> <FontAwesomeIcon icon={faPenToSquare} className="relative top-px" /></Link></td>
        </>
    );
}

export default VolunteerResult;