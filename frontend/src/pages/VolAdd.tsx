import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { WithContext as ReactTags, SEPARATORS, type Tag } from "react-tag-input";
import { volunteerCreateSchema, type VolunteerCreateInput } from "../schemas/volunteer.schema.ts";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../lib/useAuth.ts";
import { useNavigate } from "react-router-dom";
import { ApiError, createVolunteer } from "../lib/api.ts";

//zod work (thanks logan!)
const volunteerFormSchema = volunteerCreateSchema
  .omit({ skills: true })
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type VolunteerFormInput = z.input<typeof volunteerFormSchema>;
type VolunteerFormOutput = z.output<typeof volunteerFormSchema>;

const VolAdd = () => {
  // Handling the skills tagfield
  const [skills, setSkills] = useState<Array<Tag>>([]);

  const handleDelete = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const onTagUpdate = (index: number, newTag: Tag) => {
    const updatedTags = [...skills];
    updatedTags.splice(index, 1, newTag);
    setSkills(updatedTags);
  };

  const handleAddition = (tag: Tag) => {
    setSkills((prevTags) => {
      return [...prevTags, tag];
    });
    //console.log("current tags: " + JSON.stringify(skills));
  };

  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<VolunteerFormInput, unknown, VolunteerFormOutput>({
    resolver: zodResolver(volunteerFormSchema),
    mode: "onBlur",
  });

  const volAddMutation = useMutation<unknown, Error, VolunteerCreateInput>({
    mutationFn: (volunteer) => createVolunteer(volunteer, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      navigate("/volunteers");
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        navigate("/login", { replace: true });
      }
    },
  });

  const error =
    volAddMutation.error &&
    (volAddMutation.error instanceof ApiError
      ? volAddMutation.error.message
      : "Something went wrong. Please try again.");

  //css class stuff
  const labelClass = "flex flex-col gap-1 text-sm font-medium text-gray-700";
  const inputClass =
    "rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200";
  const errorClass = "text-sm text-red-800";

  return (
    <div className="w-full flex justify-center items-center py-16 px-4">
      <form
        noValidate
        onSubmit={handleSubmit(({ confirmPassword, ...volunteer }) => {
          volAddMutation.mutate({ ...volunteer, skills: skills.map((skill) => skill.text) });
        })}
        className="w-full max-w-smx2 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        {error && (
          <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <p className="justify-center">
          <b>Add a Volunteer</b>
        </p>
        <div className="flex">
          <div className="flex-1 w-md px-3 border-e border-gray-300 space-y-4">
            Essentials
            <label className={labelClass}>
              <p>
                First Name <span className="text-red-500">*</span>
              </p>
              <input
                type="text"
                autoComplete="firstName"
                placeholder="Jane"
                required
                className={inputClass}
                {...register("firstName")}
              />
              {errors.firstName && <p className={errorClass}>{errors.firstName.message}</p>}
            </label>
            <label className={labelClass}>
              <p>
                Last Name <span className="text-red-500">*</span>
              </p>
              <input
                type="text"
                autoComplete="lastName"
                placeholder="Doe"
                required
                className={inputClass}
                {...register("lastName")}
              />
              {errors.lastName && <p className={errorClass}>{errors.lastName.message}</p>}
            </label>
            <label className={labelClass}>
              <p>
                Username <span className="text-red-500">*</span>
              </p>
              <input
                type="text"
                autoComplete="username"
                placeholder="Volunteer77"
                required
                className={inputClass}
                {...register("username")}
              />
              {errors.username && <p className={errorClass}>{errors.username.message}</p>}
            </label>
            <label className={labelClass}>
              <p>
                Password<span className="text-red-500">*</span>
              </p>
              <input type="password" placeholder="••••••••" required className={inputClass} {...register("password")} />
              {errors.password && <p className={errorClass}>{errors.password.message}</p>}
            </label>
            <label className={labelClass}>
              <p>
                Confirm Password<span className="text-red-500">*</span>
              </p>
              <input
                type="password"
                placeholder="••••••••"
                required
                className={inputClass}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && <p className={errorClass}>{errors.confirmPassword.message}</p>}
            </label>
            Volunteering Information
            <label className={labelClass}>
              Skills and Interests
              <ReactTags
                tags={skills}
                id="skills"
                separators={[SEPARATORS.ENTER]}
                handleDelete={handleDelete}
                handleAddition={handleAddition}
                onTagUpdate={onTagUpdate}
                inputFieldPosition="top"
                placeholder="Press enter to submit"
                maxTags={8}
                classNames={{
                  tag: "rounded-lg bg-emerald-400 border-green-600 px-2 py-0 mx-1 ",
                  tagInputField:
                    "rounded-lg border border-gray-300 px-3 py-2 mb-1 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200",
                  remove: "pl-1",
                }}
              />
            </label>
            <label className={labelClass}>
              Highest Level of Education
              <input
                type="text"
                placeholder="B.S. Nursing, UNF"
                className={inputClass}
                {...register("educationalBackground")}
              />
            </label>
            <label className={labelClass}>
              Current Licenses
              <input
                type="text"
                autoComplete="licenses"
                placeholder="RN (FL), CPR certified"
                className={inputClass}
                {...register("currentLicenses")}
              />
            </label>
            <label className={labelClass}>
              Is there a driver's license on record for this volunteer?
              <input
                type="checkbox"
                id="driversLicenseOnFile"
                className={inputClass}
                {...register("driversLicenseOnFile")}
              />
            </label>
            <label className={labelClass}>
              Is there a social security number on record for this volunteer?
              <input
                type="checkbox"
                id="socialSecurityOnFIle"
                className={inputClass}
                {...register("socialSecurityOnFile")}
              />
            </label>
            <label className={labelClass}>
              Approval Status
              <select id="approvalStatus" className="bg-gray-100" {...register("approvalStatus")}>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="DISAPPROVED">Disapproved</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>
            <label className={labelClass}>
              Availability
              <input
                type="text"
                autoComplete="availability"
                placeholder="Weekday evenings, Saturday mornings"
                className={inputClass}
                {...register("availability")}
              />
            </label>
          </div>

          <div className="flex-1 w-md px-3 space-y-4">
            Contact Information
            <label className={labelClass}>
              <p>
                Email <span className="text-red-500">*</span>
              </p>
              <input
                type="text"
                autoComplete="email"
                placeholder="JaneDoe16@Email.com"
                required
                className={inputClass}
                {...register("email")}
              />
              {errors.email && <p className={errorClass}>{errors.email.message}</p>}
            </label>
            <label className={labelClass}>
              Cell Phone Number
              <input
                type="number"
                autoComplete="cellnum"
                placeholder="8881234567"
                className={inputClass}
                {...register("cellPhone")}
              />
              {errors.cellPhone && <p className={errorClass}>{errors.cellPhone.message}</p>}
            </label>
            <label className={labelClass}>
              Home Phone Number
              <input
                type="number"
                autoComplete="cellnum"
                placeholder="8881234567"
                className={inputClass}
                {...register("homePhone")}
              />
              {errors.homePhone && <p className={errorClass}>{errors.homePhone.message}</p>}
            </label>
            <label className={labelClass}>
              Work Phone Number
              <input
                type="number"
                autoComplete="worknum"
                placeholder="8881234567"
                className={inputClass}
                {...register("workPhone")}
              />
              {errors.workPhone && <p className={errorClass}>{errors.workPhone.message}</p>}
            </label>
            <label className={labelClass}>
              Address
              <input
                type="text"
                autoComplete="address"
                placeholder="123 Easy Str."
                className={inputClass}
                {...register("address")}
              />
            </label>
            Emergency Contact Information
            <label className={labelClass}>
              Emergency Contact Name
              <input
                type="text"
                autoComplete="ecName"
                placeholder="John Doe"
                className={inputClass}
                {...register("emergencyName")}
              />
            </label>
            <label className={labelClass}>
              Emergency Contact Home Phone Number
              <input
                type="number"
                autoComplete="echomenum"
                placeholder="8881234567"
                className={inputClass}
                {...register("emergencyHomePhone")}
              />
              {errors.emergencyHomePhone && <p className={errorClass}>{errors.emergencyHomePhone.message}</p>}
            </label>
            <label className={labelClass}>
              Emergency Contact Work Phone Number
              <input
                type="number"
                autoComplete="ecworknum"
                placeholder="8881234567"
                className={inputClass}
                {...register("emergencyWorkPhone")}
              />
              {errors.emergencyWorkPhone && <p className={errorClass}>{errors.emergencyWorkPhone.message}</p>}
            </label>
            <label className={labelClass}>
              Emergency Contact Email
              <input
                type="text"
                autoComplete="ecemail"
                placeholder="JohnDoe88@Email.com"
                className={inputClass}
                {...register("emergencyEmail")}
              />
              {errors.emergencyEmail && <p className={errorClass}>{errors.emergencyEmail.message}</p>}
            </label>
            <label className={labelClass}>
              Emergency Contact Address
              <input
                type="text"
                autoComplete="ecaddress"
                placeholder="123 Easy Str."
                className={inputClass}
                {...register("emergencyAddress")}
              />
            </label>
          </div>
        </div>

        <div className="flex">
          <button
            type="button"
            onClick={() => {
              reset();
              setSkills([]);
            }}
            className="m-2 flex-1 mt-2 rounded-lg bg-red-700 px-4 py-2.5 text-base font-medium text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60">
            Clear Form
          </button>
          <button
            type="submit"
            disabled={volAddMutation.isPending}
            className="m-2 flex-1 mt-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-base font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
            {volAddMutation.isPending ? "Adding Volunteer…" : "Add Volunteer"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VolAdd;
