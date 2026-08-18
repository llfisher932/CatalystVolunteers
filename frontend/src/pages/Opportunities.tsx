import "../index.css";
import { useState, useEffect, type ChangeEvent, type MouseEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../lib/useAuth";
import { Link } from "react-router-dom";
import OpportunitiesResult from "../components/OpportunitiesResult";

const Opportunities = () => {
  const { token } = useAuth();
  const linkClass =
    "mt-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-base font-medium text-white transition hover:bg-emerald-800";

  type OpportunitySummary = {
    id: number;
    title: string;
    description: string | null;
    center: string;
    createdAt: string;
    updatedAt: string;
  };

  type PageSummary = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  const [activeFilter, setActiveFilter] =
    useState("RECENT"); /* filter auto set to RECENT (default)*/

  const changeFilter = (event: ChangeEvent<HTMLInputElement>) => {
    setActiveFilter(event.target.value);
    setResultsPage(1);
  };

  const [selectedCenter, setSelectedCenter] =
    useState(""); /* "" = all centers */

  const changeCenter = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedCenter(event.target.value);
    setResultsPage(1);
  };

  const [currentResultsPage, setResultsPage] =
    useState(1); /* the current results page is auto set to page 1 */

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
    }, 650);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isPending, isError, error } = useQuery({
    queryKey: [
      "opportunities",
      activeFilter,
      selectedCenter,
      searchTerm,
      currentResultsPage,
    ],
    queryFn: async (): Promise<{
      data: OpportunitySummary[];
      pagination: PageSummary;
    }> => {
      const params = new URLSearchParams();

      // "By Center" drops the 60-day window (filter=ALL) and optionally narrows
      // to one center; "Most Recent" is the backend default, so it needs no param.
      if (activeFilter === "CENTER") {
        params.append("filter", "ALL");
        if (selectedCenter !== "") {
          params.append("center", selectedCenter);
        }
      }
      if (searchTerm !== "") {
        params.append("q", searchTerm);
      }
      if (currentResultsPage !== 1) {
        params.append("page", currentResultsPage.toString());
      }

      const res = await fetch(`http://localhost:3000/opportunities?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load opportunities");
      return res.json();
    },
  });

  /* Distinct center names for the "By Center" dropdown. */
  const { data: centers } = useQuery({
    queryKey: ["opportunity-centers"],
    queryFn: async (): Promise<string[]> => {
      const res = await fetch("http://localhost:3000/opportunities/centers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load centers");
      return res.json();
    },
  });

  if (isPending) return <p>Loading...</p>;
  if (isError) return <p>{error.message}</p>;

  return (
    <>
      <div>
        <div className="page-flexbox-main">
          <h1 className="page-header">Manage Opportunities</h1>
          <div className="page-flexbox-column">
            {/* Search bar: searches across title and description */}
            <input
              type="text"
              placeholder="Search by title or description"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
            ></input>

            {/* ADD OPPORTUNITY placeholder */}
            <Link to="/opportunities/add" className={linkClass}>
              {" "}
              Add Opportunity +{" "}
            </Link>
            <br></br>

            {/* Filter options: Most Recent (last 60 days) or By Center */}
            <h2>Filters</h2>
            <div className="page-flexbox-row">
              <label>
                Most Recent (60 days):{" "}
                <input
                  type="radio"
                  name="opportunityFilter"
                  value="RECENT"
                  checked={activeFilter === "RECENT"}
                  onChange={changeFilter}
                ></input>
              </label>
              <label>
                By Center:{" "}
                <input
                  type="radio"
                  name="opportunityFilter"
                  value="CENTER"
                  checked={activeFilter === "CENTER"}
                  onChange={changeFilter}
                ></input>
              </label>
              {activeFilter === "CENTER" && (
                <select
                  value={selectedCenter}
                  onChange={changeCenter}
                  className="rounded-lg border border-gray-300 px-2 py-1 text-base text-gray-900"
                >
                  <option value="">All centers</option>
                  {centers?.map((center) => (
                    <option key={center} value={center}>
                      {center}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <h2>Opportunity List</h2>
            <div className="page-flexbox-column">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Center</th>
                    <th>Created</th>
                    <th>Last Updated</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Opportunity info is delivered here */}
                  {data?.data.map((opportunity) => {
                    return (
                      <tr key={opportunity.id}>
                        <OpportunitiesResult
                          id={opportunity.id}
                          title={opportunity.title}
                          description={opportunity.description}
                          center={opportunity.center}
                          createdAt={opportunity.createdAt}
                          updatedAt={opportunity.updatedAt}
                        />
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Opportunity Not Found flow: an empty result set is a success, not an error */}
              {data?.data.length === 0 && (
                <p>No opportunities matched your search.</p>
              )}
            </div>
            {/* Page options */}
            <div className="page-flexbox-row">
              <button
                className="link-button"
                value={currentResultsPage - 1}
                disabled={currentResultsPage === 1}
                onClick={changeResultsPage}
              >
                Prev
              </button>
              <p>
                Page {currentResultsPage} of {data?.pagination.totalPages}
              </p>
              <button
                className="link-button"
                value={currentResultsPage + 1}
                disabled={
                  currentResultsPage === data?.pagination.totalPages ||
                  data?.pagination.totalPages === 0
                }
                onClick={changeResultsPage}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Opportunities;
