import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../lib/useAuth.ts";
import { useNavigate } from "react-router-dom";
import { ApiError, createOpportunity } from "../lib/api.ts";
import { opportunityCreateSchema, type OpportunityCreateInput } from "../schemas/opportunity.schema.ts";

const opportunityFormSchema = opportunityCreateSchema;

type OpportunityFormInput = z.input<typeof opportunityFormSchema>;
type OpportunityFormOutput = z.output<typeof opportunityFormSchema>;

const OppAdd = () => {

  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<OpportunityFormInput, unknown, OpportunityFormOutput>({
    resolver: zodResolver(opportunityFormSchema),
    mode: "onBlur",
  });

  const oppAddMutation = useMutation<unknown, Error, OpportunityCreateInput>({
    mutationFn: (opportunity) => createOpportunity(opportunity, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      navigate("/opportunities");
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        navigate("/login", { replace: true });
      }
    },
  });

  const error =
    oppAddMutation.error &&
    (oppAddMutation.error instanceof ApiError
      ? oppAddMutation.error.message
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
        onSubmit={handleSubmit((opportunity) => {
          oppAddMutation.mutate(opportunity);
        })}
        className="w-full max-w-sm flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        {error && (
          <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <p className="justify-center">
          <b>Add an Opportunity</b>
        </p>
        <div className="flex">
          <div className="flex-1 w-md px-3 space-y-4">
            <label className={labelClass}>
              <p>
                Title <span className="text-red-500">*</span>
              </p>
              <input
                type="text"
                placeholder="John Doe's Event"
                required
                autoFocus
                className={inputClass}
                {...register("title")}
              />
              {errors.title && <p className={errorClass}>{errors.title.message}</p>}
            </label>
            <label className={labelClass}>
              <p>
                Description
              </p>
              <textarea
                placeholder="What, when, where..."
                rows={5}
                className={inputClass}
                {...register("description")}
              />
            </label>
            <label className={labelClass}>
              <p>
                Center <span className="text-red-500">*</span>
              </p>
              <input
                type="text"
                placeholder="Northside"
                required
                className={inputClass}
                {...register("center")}
              />
              {errors.center && <p className={errorClass}>{errors.center.message}</p>}
            </label>
          </div>
        </div>

        <div className="flex">
          <button
            type="button"
            onClick={() => {reset();}}
            className="m-2 flex-1 mt-2 rounded-lg bg-red-700 px-4 py-2.5 text-base font-medium text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60">
            Clear Form
          </button>
          <button
            type="submit"
            disabled={oppAddMutation.isPending}
            className="m-2 flex-1 mt-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-base font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
            {oppAddMutation.isPending ? "Adding Opportunity…" : "Add Opportunity"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OppAdd;
