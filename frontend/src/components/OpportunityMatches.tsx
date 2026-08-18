
import { useQuery } from '@tanstack/react-query';
import { useAuth } from "../lib/useAuth";
import Modal from "./Modal.tsx";
import "../index.css";

type OpportunityMatchesProps = {
    isOpen: boolean;
    closeModal: () => void;
    id: number
}

const OpportunityMatches = ({isOpen = false, closeModal, id }:OpportunityMatchesProps) => {
  
  
const { token } = useAuth();

    type MatchedOpportunities = {
        matches: {
            opportunity: {
                id: number;
                title: string;
                center: string;
                createdAt: string;
            }
        }[];
    }

    const { data, isPending, isError, error } = useQuery({
    queryKey: ["opportunityMatch", id],
    queryFn: async (): Promise<MatchedOpportunities> => {

      const res = await fetch(`http://localhost:3000/volunteers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load Opportunity Matches");
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
                <th>Title</th>
                <th>Center</th>
                <th>Created At...</th>
            </tr>
        </thead>
        <tbody>
        {data?.matches.map((match) => {
            return (
                <tr key={match.opportunity.id}>
                    <td>{match.opportunity.title}</td>
                    <td>{match.opportunity.center}</td>
                    <td>{match.opportunity.createdAt}</td>
                </tr>
            );
        })}
        </tbody>
    </table>
  )
  else content = <p>This volunteer is not matched with any opportunities...</p>
    return (
        <>
            <Modal isOpen={isOpen} closeModal={closeModal} title="Opportunity Matches">
                {content}
            </Modal>
        </>
        )
}

export default OpportunityMatches;