import { Link } from "react-router-dom";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type VolunteerResultProps = {
    fName: string;
    lName: string;
    email: string;
    approvalStatus: string;
    id: number
}

const VolunteerResult = ({fName, lName, email, approvalStatus, id}:VolunteerResultProps) => {
    return(
        <>
            <td>{fName}</td>
            <td>{lName}</td>
            <td>{email}</td>
            <td>{approvalStatus}</td>
            {/* Reroute to edit page here*/}
            <td><Link to={"/volunteers/"+id.toString()+"/edit"}> <FontAwesomeIcon icon={faPenToSquare} className="relative top-px" /></Link></td>
        </>
    );
}

export default VolunteerResult;