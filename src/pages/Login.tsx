import React from "react";
import { Link, useNavigate } from "react-router-dom";

import { loginAdmin } from "../lib/activitiesApi";
import { storeAdminSession } from "../lib/adminSession";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = React.useState({ username: "", password: "" });
  const [message, setMessage] = React.useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    try {
      const session = await loginAdmin(form.username, form.password);
      storeAdminSession(session);
      navigate("/");
    } catch {
      setMessage("Admin login failed.");
    }
  };

  return (
    <main className="min-h-screen flex-grow px-6 py-24 md:px-10">
      <section className="mx-auto grid w-full max-w-xl gap-8 border border-black bg-white p-8">
        <div>
          <h1 className="text-5xl font-black uppercase leading-none tracking-tight text-black">Admin Login</h1>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <label className="grid gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            ID
            <input
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              className="h-12 border border-gray-300 bg-white px-4 text-base font-bold text-black outline-none focus:border-black"
            />
          </label>
          <label className="grid gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className="h-12 border border-gray-300 bg-white px-4 text-base font-bold text-black outline-none focus:border-black"
            />
          </label>

          {message && <p className="text-sm font-bold text-red-600">{message}</p>}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="bg-black px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-neon-green hover:text-black"
            >
              Login
            </button>
            <Link
              to="/"
              className="border border-black bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-black"
            >
              Back Home
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
