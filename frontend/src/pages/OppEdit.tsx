import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../lib/useAuth.ts";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError, editOpportunity, getOpportunity } from "../lib/api.ts";
import { opportunityUpdateSchema, type OpportunityUpdateInput } from "../schemas/opportunity.schema.ts";

const opportunityFormSchema = opportunityUpdateSchema;

type OpportunityFormInput = z.input<typeof opportunityFormSchema>;
type OpportunityFormOutput = z.output<typeof opportunityFormSchema>;

const OppEdit = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const queryClient = useQueryClient();

  //Existence checking
  const { id } = useParams();
  const { data, isPending, isError } = useQuery({
    queryKey: [id],
    queryFn: () => getOpportunity(id!, token),
    retry: false,
  });

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<OpportunityFormInput, unknown, OpportunityFormOutput>({
    resolver: zodResolver(opportunityFormSchema),
    mode: "onBlur",
  });

  useEffect(() => {
    if (data) {
      reset(data);
    }
  }, [data]);

  const oppEditMutation = useMutation<unknown, Error, OpportunityUpdateInput>({
    mutationFn: (opportunity) => editOpportunity(opportunity, id!, token),
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
    oppEditMutation.error &&
    (oppEditMutation.error instanceof ApiError
      ? oppEditMutation.error.message
      : "Something went wrong. Please try again.");

  //css class stuff
  const labelClass = "flex flex-col gap-1 text-sm font-medium text-gray-700";
  const inputClass =
    "rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200";
  const errorClass = "text-sm text-red-800";

  useEffect(() => {
    if (isError) {
      navigate("/opportunities");
    }
  }, [isError, navigate]);

  if (isPending) return <p>Loading...</p>;
  if (isError) return null;

  return (
    <div className="w-full flex justify-center items-center py-16 px-4">
      <form
        noValidate
        onSubmit={handleSubmit((opportunity) => {
          oppEditMutation.mutate(opportunity);
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
          <div className="flex-1 w-md px-3 border-e border-gray-300 space-y-4">
            <label className={labelClass}>
              <p>
                Title <span className="text-red-500">*</span>
              </p>
              <input type="text" className={inputClass} {...register("title")} />
              {errors.title && <p className={errorClass}>{errors.title.message}</p>}
            </label>
            <label className={labelClass}>
              <p>Description</p>
              <textarea rows={5} className={inputClass} {...register("description")} />
            </label>
            <label className={labelClass}>
              <p>Center</p>
              <input type="text" className={inputClass} {...register("center")} />
              {errors.center && <p className={errorClass}>{errors.center.message}</p>}
            </label>
          </div>
        </div>

        <div className="flex">
          <button
            type="button"
            onClick={() => {
              navigate("/opportunities");
            }}
            className="m-2 flex-1 mt-2 rounded-lg bg-red-700 px-4 py-2.5 text-base font-medium text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60">
            Cancel Edit & Return
          </button>
          <button
            type="submit"
            disabled={oppEditMutation.isPending}
            className="m-2 flex-1 mt-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-base font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
            {oppEditMutation.isPending ? "Editing Opportunity…" : "Edit Opportunity"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OppEdit;
