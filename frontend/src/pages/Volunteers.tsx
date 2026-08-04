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

  useEffect(() => {
    async function getData() {
      try 
      {
        const response = await fetch("http://localhost:3000/volunteers", {
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
        console.log(json.data);
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
  }, []);

  /* Filter Code */
  const [activeFilter, setActiveFilter] = useState("5"); /* filter auto set to All */

  const changeFilter = (event: any) => {
    setActiveFilter(event.target.value)
  };

  const filterVolunteerStatus = (approvalStatus: string): boolean => {
    /* renders volunteer list based on filters */

    switch(activeFilter) {
      case "0": /* Approved/Pending Approval */
        return approvalStatus === "APPROVED" || approvalStatus === "PENDING";
        
      case "1": /* Approved */
        return approvalStatus === "APPROVED";
        
      case "2": /* Pending Approval */
        return approvalStatus === "PENDING";
        
      case "3": /* Disapproved */
        return approvalStatus === "DISAPPROVED";
        
      case "4": /* Inactive */
        return approvalStatus === "INACTIVE";
        
      default: /* All */
         return true;

    }
  };

  return (
    <>
      <div>
        <div className="page-flexbox-main">
          <h1 className="page-header">Manage Volunteers</h1>
          <div className="page-flexbox-column">
            {/* Search bar placeholder here */}
            <input type="text" placeholder="Search... (does not work yet lol)" className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200">
            </input>
            <h2>Filters</h2>
            {/* Filter options are here */}
            <div className="page-flexbox-row">
              <label>All: <input type="radio" name="volunteerFilter" value="5" checked={activeFilter==="5"} onChange={changeFilter}></input></label>
              <label>Approved/Pending Approval: <input type="radio" name="volunteerFilter" value="0" checked={activeFilter==="0"} onChange={changeFilter}></input></label>
              <label>Approved: <input type="radio" name="volunteerFilter" value="1" checked={activeFilter==="1"} onChange={changeFilter}></input></label>
              <label>Pending Approval: <input type="radio" name="volunteerFilter" value="2" checked={activeFilter==="2"} onChange={changeFilter}></input></label>
              <label>Disapproved: <input type="radio" name="volunteerFilter" value="3" checked={activeFilter==="3"} onChange={changeFilter}></input></label>
              <label>Inactive: <input type="radio" name="volunteerFilter" value="4" checked={activeFilter==="4"} onChange={changeFilter}></input></label>
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

                        {filterVolunteerStatus(volunteer.approvalStatus) ? 
                          <VolunteerResult fName={volunteer.firstName} lName={volunteer.lastName} email={volunteer.email} approvalStatus={volunteer.approvalStatus}/> : 
                          <></>
                        }
                      
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
