"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabaseClient";
import { UserPlus } from "lucide-react";
import { motion } from "framer-motion";

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    purok: "",
    mobile: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Step 1: Create user in Auth with email verification
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            name: form.name,
            purok: form.purok,
            mobile: form.mobile,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (signUpError) throw signUpError;

      // Step 2: Insert into residents table
      if (data.user) {
        const { error: insertError } = await supabase.from("residents").insert([
          {
            user_id: data.user.id,
            name: form.name,
            purok: form.purok,
            mobile: form.mobile,
            email: form.email,
          },
        ]);

        if (insertError) throw insertError;
      }

      alert("✅ Registration successful! Please check your email to verify your account.");
      router.push("/login");
    } catch (err: any) {
      console.error("Database error saving new user:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-gray-800 px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white text-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md mx-auto"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <UserPlus size={60} className="text-[#d94f4f]" />
        </div>

        {/* Header */}
        <h1 className="text-3xl font-bold mb-2 text-center text-[#b33b3b]">
          Create an Account
        </h1>
        <p className="text-sm text-gray-600 mb-6 text-center">
          Register now to start managing your waste collection schedule.
        </p>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Full Name */}
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d94f4f]/50 placeholder-gray-400"
          />

          {/* Purok Dropdown */}
          <select
            name="purok"
            value={form.purok}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d94f4f]/50 text-gray-700"
          >
            <option value="">Select Purok</option>
            {Array.from({ length: 11 }, (_, i) => (
              <option key={i + 1} value={`Purok ${i + 1}`}>
                Purok {i + 1}
              </option>
            ))}
          </select>

          {/* Mobile Number */}
          <input
            type="text"
            name="mobile"
            placeholder="Mobile Number"
            value={form.mobile}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d94f4f]/50 placeholder-gray-400"
          />

          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d94f4f]/50 placeholder-gray-400"
          />

          {/* Password */}
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d94f4f]/50 placeholder-gray-400"
          />

          {/* Error Message */}
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="w-full bg-[#d94f4f] text-white font-semibold py-3 rounded-xl shadow-lg hover:bg-[#e06060] transition disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register"}
          </motion.button>
        </form>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-600 mt-6">
  Already have an account?{" "}
  <a href="/login?skipOnboarding=true" className="text-[#d94f4f] hover:underline">
    Login here
  </a>
</p>

      </motion.div>

      <style jsx>{`
        @media (max-width: 640px) {
          div {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
