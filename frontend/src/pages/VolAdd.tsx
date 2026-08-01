import { useMutation } from "@tanstack/react-query";
import React from "react";
import { useState } from "react";
import { WithContext as ReactTags, SEPARATORS, type Tag} from 'react-tag-input';

const VolAdd = () => {

    // Handling the skills tagfield 
    const [skills, setSkills] = React.useState<Array<Tag>>([]);
    const handleDelete = (index: number) => {
        setSkills(skills.filter((_, i) => i !== index));
    };
    const onTagUpdate = (index: number, newTag: Tag) => {
        const updatedTags = [...skills];
        updatedTags.splice(index, 1, newTag);
        setSkills(updatedTags);
        console.log("onTagUpdate HAS BEEN TRIGGERED")
    };
    const handleAddition = (tag: Tag) => {
        setSkills((prevTags) => {
            return [...prevTags, tag];
        });
        console.log("current tags: "+JSON.stringify(skills))
    };

    // all the rest of the vars
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [pass1, setPass1] = useState("");
    const [pass2, setPass2] = useState("");
    const [availability, setAvailability] = useState("");
    const [address, setAddress] = useState("");
    const [cellNum, setCellNum] = useState("");
    const [homeNum, setHomeNum] = useState("");
    const [workNum, setWorkNum] = useState("");
    const [email, setEmail] = useState("");
    const [eduHis, setEduHis] = useState("");
    const [licenses, setLicenses] = useState("");
    const [ecName, setECName] = useState("");
    const [ecHomeNum, setECHomeNum] = useState("");
    const [ecWorkNum, setECWorkNum] = useState("");
    const [ecEmail, setECEmail] = useState("");
    const [ecAddress, setECAddress] = useState("");
    const [drivers, setDrivers] = useState<boolean>(false);
    const [socialSec, setSocialSec] = useState<boolean>(false);
    const [approval, setApproval] = useState("");

  return <div className="w-full flex justify-center items-center py-16 px-4">
        <form
            noValidate
            className="w-full max-w-smx2 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-8 shadow-sm"
        >
            <p className="justify-center"><b>Add a Volunteer</b></p>
            <div className="flex">
                <div className="flex-1 w-md px-3 border-e border-gray-300 space-y-4">
                    Essentials
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    <p>First Name <span className="text-red-500">*</span></p>
                    <input
                        type="text"
                        name="firstname"
                        autoComplete="firstname"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Jane"
                        required
                        autoFocus
                        className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                    />
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    <p>Last Name <span className="text-red-500">*</span></p>
                    <input
                        type="text"
                        name="lastname"
                        autoComplete="lastname"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        required
                        autoFocus
                        className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                    />
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    <p>Username <span className="text-red-500">*</span></p>
                    <input
                        type="text"
                        name="username"
                        autoComplete="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Volunteer77"
                        required
                        autoFocus
                        className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                    />
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    <p>Password <span className="text-red-500">*</span></p>
                    <input
                        type="password"
                        name="pass1"
                        autoComplete="pass1"
                        value={pass1}
                        onChange={(e) => setPass1(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoFocus
                        className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                    />
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    <p>Confirm Password <span className="text-red-500">*</span></p>
                    <input
                        type="password"
                        name="pass2"
                        autoComplete="pass2"
                        value={pass2}
                        onChange={(e) => setPass2(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoFocus
                        className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                    />
                    </label>

                    Volunteering Information
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        Skills and Interests (this needs to get replaced with something custom)
                        <ReactTags
                            id="skills"
                            separators={[SEPARATORS.ENTER]}
                            handleDelete={handleDelete}
                            handleAddition={handleAddition}
                            onTagUpdate={onTagUpdate}
                            inputFieldPosition="top"
                            placeholder="Press enter to submit"
                            editable
                            maxTags={8}
                        />
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Highest Level of Education
                    <input
                        type="text"
                        name="eduhis"
                        autoComplete="eduhis"
                        value={eduHis}
                        onChange={(e) => setEduHis(e.target.value)}
                        placeholder="B.S. Nursing, UNF"
                        required
                        autoFocus
                        className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                    />
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Current Licenses
                    <input
                        type="text"
                        name="licenses"
                        autoComplete="licenses"
                        value={licenses}
                        onChange={(e) => setLicenses(e.target.value)}
                        placeholder="RN (FL), CPR certified"
                        required
                        autoFocus
                        className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                    />
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Is there a driver's license on record for this volunteer?
                    <input
                        type="checkbox"
                        id="drivers"
                        name="drivers"
                        onClick={(e) => setDrivers(!drivers)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                    />
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Is there a social security number on record for this volunteer?
                    <input
                        type="checkbox"
                        id="socialSec"
                        name="socialSec"
                        onClick={(e) => setSocialSec(!socialSec)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                    />
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Approval Status
                    <select
                        name="approval"
                        id="approval"
                        value={approval}
                        onChange={(e) => setApproval(e.target.value)}
                        className="bg-gray-100"
                    >
                        <option value="APPROVED">Approved</option>
                        <option value="PENDING">Pending</option>
                        <option value="DISAPPROVED">Disapproved</option>
                        <option value="INACTIVE">Inactive</option>
                    </select>
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Availability
                    <input
                        type="text"
                        name="availability"
                        autoComplete="availability"
                        value={availability}
                        onChange={(e) => setAvailability(e.target.value)}
                        placeholder="Weekday evenings, Saturday mornings"
                        required
                        autoFocus
                        className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                    />
                    </label>
                </div>

                <div className="flex-1 w-md px-3 space-y-4">
                    Contact Information
                    
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Cell Phone Number
                    <input
                        type="text"
                        name="cellnum"
                        autoComplete="cellnum"
                        value={cellNum}
                        onChange={(e) => setCellNum(e.target.value)}
                        placeholder="888-123-4567"
                        required
                        autoFocus
                        className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                    />
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Home Phone Number
                    <input
                        type="text"
                        name="homenum"
                        autoComplete="cellnum"
                        value={homeNum}
                        onChange={(e) => setHomeNum(e.target.value)}
                        placeholder="888-123-4567"
                        required
                        autoFocus
                        className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                    />
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Work Phone Number
                    <input
                        type="text"
                        name="worknum"
                        autoComplete="worknum"
                        value={workNum}
                        onChange={(e) => setWorkNum(e.target.value)}
                        placeholder="888-123-4567"
                        required
                        autoFocus
                        className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                    />
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Email (Check Format)
                    <input
                        type="text"
                        name="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="JaneDoe16@Email.com"
                        required
                        autoFocus
                        className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                    />
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Address
                    <input
                        type="text"
                        name="address"
                        autoComplete="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="123 Easy Str."
                        required
                        autoFocus
                        className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                    />
                    </label>

                    Emergency Contact Information
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Emergency Contact Name
                    <input
                        type="text"
                        name="ecName"
                        autoComplete="ecName"
                        value={ecName}
                        onChange={(e) => setECName(e.target.value)}
                        placeholder="John Doe"
                        required
                        autoFocus
                        className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                    />
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Emergency Contact Home Phone Number (force format)
                    <input
                        type="text"
                        name="echomenum"
                        autoComplete="echomenum"
                        value={ecHomeNum}
                        onChange={(e) => setECHomeNum(e.target.value)}
                        placeholder="888-123-4567"
                        required
                        autoFocus
                        className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                    />
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Emergency Contact Work Phone Number (force format)
                    <input
                        type="text"
                        name="ecworknum"
                        autoComplete="ecworknum"
                        value={ecWorkNum}
                        onChange={(e) => setECWorkNum(e.target.value)}
                        placeholder="888-123-4567"
                        required
                        autoFocus
                        className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                    />
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Emergency Contact Email (Force Format)
                    <input
                        type="text"
                        name="ecemail"
                        autoComplete="ecemail"
                        value={ecEmail}
                        onChange={(e) => setECEmail(e.target.value)}
                        placeholder="JohnDoe88@Email.com"
                        required
                        autoFocus
                        className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                    />
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                    Emergency Contact Address
                    <input
                        type="text"
                        name="ecaddress"
                        autoComplete="ecaddress"
                        value={ecAddress}
                        onChange={(e) => setECAddress(e.target.value)}
                        placeholder="123 Easy Str."
                        required
                        autoFocus
                        className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                    />
                    </label>
                </div>
            </div>

            <div className="flex">
                <button
                    type="reset"
                    className="m-2 flex-1 mt-2 rounded-lg bg-red-700 px-4 py-2.5 text-base font-medium text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                Clear Form
                </button>
                <button
                    type="submit"
                    className="m-2 flex-1 mt-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-base font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                Add Volunteer
                </button>
            </div>

        </form>
    </div>;
};

export default VolAdd;
