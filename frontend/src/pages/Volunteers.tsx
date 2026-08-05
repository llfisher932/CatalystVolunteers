import "../index.css";
import { useEffect, useState } from "react";
import { useAuth } from "../lib/useAuth";
import VolunteerResult from "../components/VolunteerResult";


const Volunteers = () => {

  const [volunteers, setVolunteers] = useState<VolunteerSummary[]>([]);
  const { token } = useAuth();
  type VolunteerSummary = {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    approvalStatus: string;
  };

  /* Filter Code */
  const [activeFilter, setActiveFilter] = useState("DEFAULT"); /* filter auto set to APPROVED/PENDING */

  const changeFilter = (event: any) => {
    setActiveFilter(event.target.value)
  };

  useEffect(() => {
    async function getData() {
      try 
      {
        let url = `http://localhost:3000/volunteers?`;
        if(activeFilter !== "DEFAULT")
        {
          url += `status=${activeFilter}`;
        }
        /* Search functionality can be added here */

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const json = await response.json();
        setVolunteers(json.data);
      } 
      catch (err: any) 
      {
        if (err.name !== "AbortError") {
          console.log(err);
        }
      }
    }

    getData();
  }, [activeFilter]);


  return (
    <>
      <div>
        <div className="page-flexbox-main">
          <h1 className="page-header">Manage Volunteers</h1>
          <div className="page-flexbox-column">
            {/* Search bar placeholder here */}
            <input type="text" placeholder="Search... (does not work yet lol)" className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200">
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
                <tr>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Email</th>
                  <th>Approval Status</th>
                  <th>Edit</th>
                </tr>
                {/* Volunteer info is delivered here */}
                  {volunteers.map((volunteer) => {
                    return (
                      <tr key={volunteer.id}>
                        <VolunteerResult fName={volunteer.firstName} lName={volunteer.lastName} email={volunteer.email} approvalStatus={volunteer.approvalStatus}/>
                      </tr>
                    );
                  })}
                
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Volunteers;
