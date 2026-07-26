import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../lib/useAuth";
import { login as loginRequest, ApiError } from "../lib/api";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: (credentials: { username: string; password: string }) =>
      loginRequest(credentials.username, credentials.password),
    onSuccess: (token) => {
      login(token); 
      navigate("/"); 
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username: username.trim(), password });
  };

  // Show the server's message (e.g. "Invalid username or password"), or a
  // generic fallback for anything unexpected.
  const error =
    loginMutation.error &&
    (loginMutation.error instanceof ApiError
      ? loginMutation.error.message
      : "Something went wrong. Please try again.");

  return (
    <div className="w-full flex justify-center items-center py-16 px-4">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-sm flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-8 shadow-sm"
      >
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Admin Login</h1>
          <p className="text-sm text-gray-500">Catalyst Volunteer Management System</p>
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Username
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            required
            autoFocus
            className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
          />
        </label>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="mt-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-base font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loginMutation.isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
};

export default Login;
