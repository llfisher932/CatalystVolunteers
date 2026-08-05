import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { z } from "zod";
import { useAuth } from "../lib/useAuth";
import { volunteerCreateSchema, APPROVAL_STATUSES } from "../schemas/volunteer.schema";

/**
 * The array fields are entered as comma-separated text, so the form's shape
 * differs from the API's. We validate against this, then convert on submit.
 */
const volunteerFormSchema = volunteerCreateSchema.extend({
  skills: z.string().optional(),
  preferredCenters: z.string().optional(),
});

type VolunteerFormInput = z.infer<typeof volunteerFormSchema>;

const splitList = (value: string | undefined): string[] =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

/** Empty inputs arrive as "", which would be stored instead of leaving the column null. */
const blankToUndefined = (data: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value === "" ? undefined : value]));

const inputClass = "w-full rounded-md border border-gray-300 px-3 py-2 focus:border-emerald-600 focus:outline-none";
const labelClass = "block text-sm font-medium text-gray-700";
const errorClass = "mt-1 text-sm text-red-600";
const sectionClass = "space-y-4 border-t border-gray-200 pt-6";
const sectionHeadingClass = "text-lg font-medium text-gray-900";

const VolunteerForm = () => {
  const { token } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  type VolunteerFormInput = z.input<typeof volunteerFormSchema>;
  type VolunteerFormOutput = z.output<typeof volunteerFormSchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VolunteerFormInput, any, VolunteerFormOutput>({
    resolver: zodResolver(volunteerFormSchema),
    defaultValues: {
      driversLicenseOnFile: false,
      socialSecurityOnFile: false,
      approvalStatus: "PENDING",
    },
    mode: "onBlur",
  });

  const submitForm = async (data: VolunteerFormInput) => {
    setSubmitError(null);
    setSuccess(false);

    const payload = {
      ...blankToUndefined(data),
      skills: splitList(data.skills),
      preferredCenters: splitList(data.preferredCenters),
    };

    const res = await fetch("http://localhost:3000/volunteers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      // The server catches what the client can't know, like a taken username.
      const body = await res.json();
      setSubmitError(body.message ?? "Something went wrong");
      return;
    }

    setSuccess(true);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(submitForm)} className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Add a Volunteer</h1>

      {submitError && <p className="rounded bg-red-50 p-3 text-red-700">{submitError}</p>}
      {success && <p className="rounded bg-emerald-50 p-3 text-emerald-700">Volunteer created.</p>}

      <div className="space-y-4">
        <h2 className={sectionHeadingClass}>Account</h2>

        <div>
          <label className={labelClass} htmlFor="firstName">
            First name
          </label>
          <input id="firstName" className={inputClass} {...register("firstName")} />
          {errors.firstName && <p className={errorClass}>{errors.firstName.message}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="lastName">
            Last name
          </label>
          <input id="lastName" className={inputClass} {...register("lastName")} />
          {errors.lastName && <p className={errorClass}>{errors.lastName.message}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="username">
            Username
          </label>
          <input id="username" className={inputClass} {...register("username")} />
          {errors.username && <p className={errorClass}>{errors.username.message}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="password">
            Password
          </label>
          <input id="password" type="password" className={inputClass} {...register("password")} />
          {errors.password && <p className={errorClass}>{errors.password.message}</p>}
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionHeadingClass}>Contact</h2>

        <div>
          <label className={labelClass} htmlFor="email">
            Email
          </label>
          <input id="email" type="email" className={inputClass} {...register("email")} />
          {errors.email && <p className={errorClass}>{errors.email.message}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="address">
            Address
          </label>
          <input id="address" className={inputClass} {...register("address")} />
          {errors.address && <p className={errorClass}>{errors.address.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass} htmlFor="homePhone">
              Home phone
            </label>
            <input id="homePhone" className={inputClass} {...register("homePhone")} />
          </div>
          <div>
            <label className={labelClass} htmlFor="workPhone">
              Work phone
            </label>
            <input id="workPhone" className={inputClass} {...register("workPhone")} />
          </div>
          <div>
            <label className={labelClass} htmlFor="cellPhone">
              Cell phone
            </label>
            <input id="cellPhone" className={inputClass} {...register("cellPhone")} />
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionHeadingClass}>Volunteering</h2>

        <div>
          <label className={labelClass} htmlFor="skills">
            Skills / interests
          </label>
          <input id="skills" className={inputClass} placeholder="tutoring, food service" {...register("skills")} />
          <p className="mt-1 text-sm text-gray-500">Separate with commas.</p>
        </div>

        <div>
          <label className={labelClass} htmlFor="preferredCenters">
            Preferred centers
          </label>
          <input
            id="preferredCenters"
            className={inputClass}
            placeholder="Downtown, Northside"
            {...register("preferredCenters")}
          />
          <p className="mt-1 text-sm text-gray-500">Separate with commas.</p>
        </div>

        <div>
          <label className={labelClass} htmlFor="availability">
            Availability
          </label>
          <input
            id="availability"
            className={inputClass}
            placeholder="Weekday evenings, Saturday mornings"
            {...register("availability")}
          />
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionHeadingClass}>Background</h2>

        <div>
          <label className={labelClass} htmlFor="educationalBackground">
            Educational background
          </label>
          <input id="educationalBackground" className={inputClass} {...register("educationalBackground")} />
        </div>

        <div>
          <label className={labelClass} htmlFor="currentLicenses">
            Current licenses
          </label>
          <input id="currentLicenses" className={inputClass} {...register("currentLicenses")} />
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionHeadingClass}>Emergency contact</h2>

        <div>
          <label className={labelClass} htmlFor="emergencyName">
            Name
          </label>
          <input id="emergencyName" className={inputClass} {...register("emergencyName")} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="emergencyHomePhone">
              Home phone
            </label>
            <input id="emergencyHomePhone" className={inputClass} {...register("emergencyHomePhone")} />
          </div>
          <div>
            <label className={labelClass} htmlFor="emergencyWorkPhone">
              Work phone
            </label>
            <input id="emergencyWorkPhone" className={inputClass} {...register("emergencyWorkPhone")} />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="emergencyEmail">
            Email
          </label>
          <input id="emergencyEmail" type="email" className={inputClass} {...register("emergencyEmail")} />
          {errors.emergencyEmail && <p className={errorClass}>{errors.emergencyEmail.message}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="emergencyAddress">
            Address
          </label>
          <input id="emergencyAddress" className={inputClass} {...register("emergencyAddress")} />
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionHeadingClass}>Status</h2>

        <label className="flex items-center gap-2">
          <input type="checkbox" {...register("driversLicenseOnFile")} />
          <span className="text-sm text-gray-700">Driver's license on file</span>
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" {...register("socialSecurityOnFile")} />
          <span className="text-sm text-gray-700">Social security card on file</span>
        </label>

        <div>
          <label className={labelClass} htmlFor="approvalStatus">
            Approval status
          </label>
          <select id="approvalStatus" className={inputClass} {...register("approvalStatus")}>
            {APPROVAL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-emerald-700 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
        {isSubmitting ? "Creating..." : "Create Volunteer"}
      </button>
    </form>
  );
};

export default VolunteerForm;
