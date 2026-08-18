
import { useQuery } from '@tanstack/react-query';
import { useAuth } from "../lib/useAuth";
import Modal from "./Modal.tsx";
import "../index.css";

type VolunteerMatchesProps = {
    isOpen: boolean;
    closeModal: () => void;
    id: number
}

const VolunteerMatches = ({isOpen = false, closeModal, id }:VolunteerMatchesProps) => {
    
    const { token } = useAuth();

    type MatchedVolunteers = {
        matches: {
            opportunity: {
                id: number;
                fName: string;
                lName: string;
                email: string;
            }
        }[];
    }

    const { data, isPending, isError, error } = useQuery({
    queryKey: ["volunteerMatch", id],
    queryFn: async (): Promise<MatchedVolunteers> => {

      const res = await fetch(`http://localhost:3000/opportunities/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load Volunteer Matches");
      return res.json();
    },
  });

  let content;
  if (isPending) content = <p>Loading Matches...</p>;
  if (isError) content = <p>{error.message}</p>;
  if (data?.matches.length > 0) content = (
    <table>
        <thead>
            <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email</th>
            </tr>
        </thead>
        <tbody>
        {data?.matches.map((match) => {
            return (
                <tr key={match.opportunity.id}>
                    <td>{match.opportunity.fName}</td>
                    <td>{match.opportunity.lName}</td>
                    <td>{match.opportunity.email}</td>
                </tr>
            );
        })}
        </tbody>
    </table>
  )
  else content = <p>This opportunity is not matched with any volunteers...</p>

    return (
        <>
            <Modal isOpen={isOpen} closeModal={closeModal} title="Volunteer Matches">
                {content}
            </Modal>
        </>
        )
}

export default VolunteerMatches;