import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { WithContext as ReactTags, SEPARATORS, type Tag } from "react-tag-input";
import { volunteerUpdateSchema, type VolunteerUpdateInput } from "../schemas/volunteer.schema.ts";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../lib/useAuth.ts";
import { useNavigate } from "react-router-dom";
import { ApiError, editVolunteer, getVolunteer } from "../lib/api.ts";
import { useParams } from 'react-router-dom'

//zod work (thanks logan!)
const volunteerFormSchema = volunteerUpdateSchema
  .omit({ skills: true })
  .extend({
    confirmPassword: z.string().optional(),
    password: z.union([z.literal(""), z.string().min(8, "Must be at least 8 characters.")]).optional()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type VolunteerFormInput = z.input<typeof volunteerFormSchema>;
type VolunteerFormOutput = z.output<typeof volunteerFormSchema>;

const VolEdit = () => {

  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const queryClient = useQueryClient();

  //Existance checking
  const {id} = useParams()
  const { data, isPending, isError, error} = useQuery({
    queryKey: [id],
    queryFn: () => getVolunteer(id!, token),
  })

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

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<VolunteerFormInput, unknown, VolunteerFormOutput>({
    resolver: zodResolver(volunteerFormSchema),
    mode: "onBlur",
  });

  useEffect(() => {
    if (data) {
      setSkills(data.skills.map((skill: Tag) => ({ id: skill, text: skill, className: ""})))
      reset(data)
    }

  }, [data])

  const volEditMutation = useMutation<unknown, Error, VolunteerUpdateInput>({
    mutationFn: (volunteer) => editVolunteer(volunteer, id!, token),
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

  const error2 =
    volEditMutation.error &&
    (volEditMutation.error instanceof ApiError
      ? volEditMutation.error.message
      : "Something went wrong. Please try again.");

  //css class stuff
  const labelClass = "flex flex-col gap-1 text-sm font-medium text-gray-700";
  const inputClass =
    "rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200";
  const errorClass = "text-sm text-red-800";

  // existance check wrap up
  if (isPending) return <p>Loading...</p>;
  if (isError) {
    navigate("/volunteers");
    //return <p>uh oh! {error.message}</p>
  }

  return (
    <div className="w-full flex justify-center items-center py-16 px-4">
      <form
        noValidate
        onSubmit={handleSubmit(({ confirmPassword, password, ...volunteer }) => {
          volEditMutation.mutate({ ...volunteer, ...(password ? {password} : {}), skills: skills.map((skill) => skill.text)});
        })}
        className="w-full max-w-smx2 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        {error2 && (
          <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error2}
          </p>
        )}
        <p className="justify-center">
          <b>Edit Volunteer {data.firstName} {data.lastName}</b>
        </p>
        <div className="flex">
          <div className="flex-1 w-md px-3 border-e border-gray-300 space-y-4">
            Essentials
            <label className={labelClass}>
              <p>
                First Name
              </p>
              <input
                type="text"
                autoComplete="firstName"
                className={inputClass}
                {...register("firstName")}
              />
              {errors.firstName && <p className={errorClass}>{errors.firstName.message}</p>}
            </label>
            <label className={labelClass}>
              <p>
                Last Name
              </p>
              <input
                type="text"
                autoComplete="lastName"
                className={inputClass}
                {...register("lastName")}
              />
              {errors.lastName && <p className={errorClass}>{errors.lastName.message}</p>}
            </label>
            <label className={labelClass}>
              <p>
                Username
              </p>
              <input
                type="text"
                autoComplete="username"
                className={inputClass}
                {...register("username")}
              />
              {errors.username && <p className={errorClass}>{errors.username.message}</p>}
            </label>
            <label className={labelClass}>
              <p>
                Password
              </p>
              <input type="password" placeholder="••••••••" className={inputClass} {...register("password")} />
              {errors.password && <p className={errorClass}>{errors.password.message}</p>}
            </label>
            <label className={labelClass}>
              <p>
                Confirm Password
              </p>
              <input
                type="password"
                placeholder="••••••••"
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
                autofocus={false}
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
                className={inputClass}
                {...register("educationalBackground")}
              />
            </label>
            <label className={labelClass}>
              Current Licenses
              <input
                type="text"
                autoComplete="licenses"
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
                id="socialSecurityOnFile"
                className={inputClass}
                {...register("socialSecurityOnFile")}
              />
            </label>
            <label className={labelClass}>
              Approval Status
              <select 
                id="approvalStatus" 
                className="bg-gray-100"
                defaultValue={data.approvalStatus}
                {...register("approvalStatus")}
              >
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
                className={inputClass}
                {...register("availability")}
              />
            </label>
          </div>

          <div className="flex-1 w-md px-3 space-y-4">
            Contact Information
            <label className={labelClass}>
              <p>
                Email
              </p>
              <input
                type="text"
                autoComplete="email"
                className={inputClass}
                {...register("email")}
              />
              {errors.email && <p className={errorClass}>{errors.email.message}</p>}
            </label>
            <label className={labelClass}>
              Cell Phone Number
              <input
                type="tel"
                autoComplete="cellnum"
                className={inputClass}
                {...register("cellPhone")}
              />
              {errors.cellPhone && <p className={errorClass}>{errors.cellPhone.message}</p>}
            </label>
            <label className={labelClass}>
              Home Phone Number
              <input
                type="tel"
                autoComplete="cellnum"
                className={inputClass}
                {...register("homePhone")}
              />
              {errors.homePhone && <p className={errorClass}>{errors.homePhone.message}</p>}
            </label>
            <label className={labelClass}>
              Work Phone Number
              <input
                type="tel"
                autoComplete="worknum"
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
                className={inputClass}
                {...register("emergencyName")}
              />
            </label>
            <label className={labelClass}>
              Emergency Contact Home Phone Number
              <input
                type="tel"
                autoComplete="echomenum"
                className={inputClass}
                {...register("emergencyHomePhone")}
              />
              {errors.emergencyHomePhone && <p className={errorClass}>{errors.emergencyHomePhone.message}</p>}
            </label>
            <label className={labelClass}>
              Emergency Contact Work Phone Number
              <input
                type="tel"
                autoComplete="ecworknum"
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
                className={inputClass}
                {...register("emergencyAddress")}
              />
            </label>
          </div>
        </div>

        <div className="flex">
          <button
            type="button"
            onClick={() => {navigate("/volunteers");}}
            className="m-2 flex-1 mt-2 rounded-lg bg-red-700 px-4 py-2.5 text-base font-medium text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60">
            Cancel Edit & Return
          </button>
          <button
            type="submit"
            disabled={volEditMutation.isPending}
            className="m-2 flex-1 mt-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-base font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
            {volEditMutation.isPending ? "Editing Volunteer…" : "Edit Volunteer"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VolEdit;
