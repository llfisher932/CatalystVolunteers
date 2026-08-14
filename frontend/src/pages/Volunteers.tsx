import "../index.css";
import { useState, useEffect, type ChangeEvent, type MouseEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../lib/useAuth";
import VolunteerResult from "../components/VolunteerResult";


const Volunteers = () => {

  const { token } = useAuth();

  type VolunteerSummary = {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    approvalStatus: string;
  };

  type PageSummary = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  const [activeFilter, setActiveFilter] = useState("DEFAULT"); /* filter auto set to APPROVED/PENDING */

  const changeFilter = (event: ChangeEvent<HTMLInputElement>) => {
    setActiveFilter(event.target.value);
    setResultsPage(1);
  };

  const [currentResultsPage, setResultsPage] = useState(1); /* the current results page is auto set to page 1 */

  const changeResultsPage = (event: MouseEvent<HTMLButtonElement>) => {
    setResultsPage(parseInt(event.currentTarget.value));
  };

  /* Search: what the user is typing vs. the debounced term we actually query on.
     Debouncing avoids firing a request on every keystroke. */
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setResultsPage(1); /* a new search starts back at page 1 */
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["volunteers", activeFilter, searchTerm, currentResultsPage],
    queryFn: async (): Promise<{ data: VolunteerSummary[], pagination: PageSummary }> => {
      const params = new URLSearchParams();

        if(activeFilter !== "DEFAULT")
        {
          params.append("status", activeFilter);
        }
        if(searchTerm !== "")
        {
          params.append("q", searchTerm);
        }
        if(currentResultsPage !== 1)
        {
          params.append("page", currentResultsPage.toString());
        }

      const res = await fetch(`http://localhost:3000/volunteers?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load volunteers");
      return res.json();
    },
  });

  if (isPending) return <p>Loading...</p>;
  if (isError) return <p>{error.message}</p>;

  return (
    <>
      <div>
        <div className="page-flexbox-main">
          <h1 className="page-header">Manage Volunteers</h1>
          <div className="page-flexbox-column">
            {/* Search bar: searches across name, username, email, and skills */}
            <input type="text" placeholder="Search by name, username, email, or skill" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200">
            </input>

            {/* Filter options are here */}
            <h2>Filters</h2>
            <div className="page-flexbox-row">
              <label>Approved/Pending Approval: <input type="radio" name="volunteerFilter" value="DEFAULT" checked={activeFilter==="DEFAULT"} onChange={changeFilter}></input></label>
              <label>Approved: <input type="radio" name="volunteerFilter" value="APPROVED" checked={activeFilter==="APPROVED"} onChange={changeFilter}></input></label>
              <label>Pending Approval: <input type="radio" name="volunteerFilter" value="PENDING" checked={activeFilter==="PENDING"} onChange={changeFilter}></input></label>
              <label>Disapproved: <input type="radio" name="volunteerFilter" value="DISAPPROVED" checked={activeFilter==="DISAPPROVED"} onChange={changeFilter}></input></label>
              <label>Inactive: <input type="radio" name="volunteerFilter" value="INACTIVE" checked={activeFilter==="INACTIVE"} onChange={changeFilter}></input></label>
              <label>All: <input type="radio" name="volunteerFilter" value="ALL" checked={activeFilter==="ALL"} onChange={changeFilter}></input></label>
            </div>

            <h2>Volunteer List</h2>
            <div className="page-flexbox-column">
              <table>
                <thead>
                  <tr>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Email</th>
                    <th>Approval Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Volunteer info is delivered here */}
                    {data?.data.map((volunteer) => {
                      return (
                        <tr key={volunteer.id}>
                          <VolunteerResult fName={volunteer.firstName} lName={volunteer.lastName} email={volunteer.email} approvalStatus={volunteer.approvalStatus} id={volunteer.id}/>
                        </tr>
                        
                      );
                    })}
                </tbody>
              </table>
              {/* Volunteer Not Found flow: an empty result set is a success, not an error */}
              {data?.data.length === 0 && (
                <p>No volunteers matched your search.</p>
              )}
            </div>
            {/* Page options */}
            <div className="page-flexbox-row">
              <button className="link-button" value={currentResultsPage - 1} disabled={currentResultsPage === 1} onClick={changeResultsPage}>Prev</button>
              <p>Page {currentResultsPage} of {data?.pagination.totalPages}</p>
              <button className="link-button" value={currentResultsPage + 1} disabled={currentResultsPage === data?.pagination.totalPages || data?.pagination.totalPages === 0} onClick={changeResultsPage}>Next</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Volunteers;
