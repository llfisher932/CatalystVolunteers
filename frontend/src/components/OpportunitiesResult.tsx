import { Link } from "react-router-dom";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type OpportunitiesResultProps = {
  id: number;
  title: string;
  description: string | null;
  center: string;
  createdAt: string;
  updatedAt: string;
};

const OpportunitiesResult = ({ id, title, description, center, createdAt, updatedAt }: OpportunitiesResultProps) => {
  return (
    <>
      <td>{title}</td>
      <td>{description}</td>
      <td>{center}</td>
      <td>{new Date(createdAt).toLocaleDateString("en-US")}</td>
      <td>{new Date(updatedAt).toLocaleDateString("en-US")}</td>
      {/* Reroute to edit page here*/}
      <td>
        <Link to="/">
          {" "}
          <FontAwesomeIcon icon={faPenToSquare} className="relative top-px" />
        </Link>
      </td>
    </>
  );
};

export default OpportunitiesResult;
