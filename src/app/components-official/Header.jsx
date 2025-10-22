"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/supabaseClient";
import { useRouter } from "next/navigation";
import { Menu, LogOut, Users, Briefcase, PlusCircle, X, Home } from "lucide-react";

export default function Header() {
  const [time, setTime] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    role: "",
    name: "",
    email: "",
    password: "",
    mobile: "",
    purok: "",
  });
  const menuRef = useRef(null);
  const router = useRouter();

  // 🕐 Live clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // 🧠 Handle clicks outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      const node = menuRef.current;
      if (node && !node.contains(event.target)) {
        setMenuOpen(false);
        setShowAddMenu(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setShowAddMenu(false);
        setShowModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // 🔒 Logout
  const handleLogout = async () => {
    setMenuOpen(false);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error", err);
    } finally {
      router.push("/login");
    }
  };

  // ✅ Open modal for specific role
  const openCreateModal = (role, e) => {
    e?.stopPropagation();
    setNewAccount({
      role,
      name: "",
      email: "",
      password: "",
      mobile: "",
      purok: "",
    });
    setShowAddMenu(false);
    setShowModal(true);
  };

  // ✅ Handle create account for residents, collectors, officials
  const handleCreateAccount = async (e) => {
    e.preventDefault();

    const { role, name, email, password, mobile, purok } = newAccount;

    if (!role || !email || !password || !name) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      // 1️⃣ Create Auth user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw signUpError;

      const user_id = data?.user?.id;
      if (!user_id) throw new Error("User ID not returned from Supabase");

      // 2️⃣ Insert into correct table
      if (role === "resident") {
        const { error: insertError } = await supabase.from("residents").insert([
          {
            user_id,
            name,
            email,
            mobile: mobile || null,
            purok: purok || null,
            auth_id: user_id,
          },
        ]);
        if (insertError) throw insertError;
      } else if (role === "collector") {
        const { error: insertError } = await supabase.from("collectors").insert([
          {
            name,
            email,
            role: "collector",
          },
        ]);
        if (insertError) throw insertError;

        const { error: officialError } = await supabase.from("officials").insert([
          {
            user_id,
            name,
            email,
            role: "collector",
          },
        ]);
        if (officialError) throw officialError;
      } else if (role === "official") {
        const { error: insertError } = await supabase.from("officials").insert([
          {
            user_id,
            name,
            email,
            role,
          },
        ]);
        if (insertError) throw insertError;
      }

      alert(`${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully!`);
      setShowModal(false);
      setNewAccount({
        role: "",
        name: "",
        email: "",
        password: "",
        mobile: "",
        purok: "",
      });
    } catch (error) {
      console.error("Error creating account:", error.message);
      alert("Failed to create account. Check console for details.");
    }
  };

  return (
    <header className="relative overflow-visible shadow-lg w-full z-[100]">
      <div className="absolute inset-0 bg-red-800" aria-hidden />
      <div className="absolute inset-0 bg-black opacity-10" aria-hidden />

      <div className="relative z-20 container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl shadow-md">
            <svg
              className="w-8 h-8 sm:w-9 sm:h-9 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden
            >
              <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4zM3 8a1 1 0 000 2v6a2 2 0 002 2h10a2 2 0 002-2V10a1 1 0 100-2H3zm8 6a1 1 0 11-2 0V9a1 1 0 112 0v5z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
              Barangay Tambacan
            </h1>
            <p className="text-red-100 font-medium text-xs sm:text-sm">
              Smart Waste Management System
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="px-4 py-2 rounded-lg bg-red-700 text-white font-semibold shadow text-sm">
            🕐 {time}
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowAddMenu((v) => !v)}
              className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-900 text-white font-semibold shadow text-sm flex items-center gap-1 transition"
            >
              <PlusCircle className="w-4 h-4" /> Add Accounts
            </button>

            {showAddMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg overflow-hidden z-[200]">
                <button
                  onClick={(e) => openCreateModal("official", e)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Users className="w-4 h-4 text-gray-500" /> Add Official
                </button>
                <button
                  onClick={(e) => openCreateModal("collector", e)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Briefcase className="w-4 h-4 text-gray-500" /> Add Collector
                </button>
                <button
                  onClick={(e) => openCreateModal("resident", e)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Home className="w-4 h-4 text-gray-500" /> Add Resident
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-900 text-white font-semibold shadow text-sm flex items-center gap-1 transition"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        {/* Mobile Menu */}
        <div className="sm:hidden relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2 rounded-md bg-white/20 text-white hover:bg-white/30 transition"
          >
            <Menu className="w-5 h-5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg overflow-hidden z-[200] animate-fade-in">
              <div className="px-4 py-2 text-gray-700 font-semibold border-b text-center">
                🕐 {time}
              </div>
              <button
                onClick={(e) => openCreateModal("official", e)}
                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-gray-500" /> Add Official
              </button>
              <button
                onClick={(e) => openCreateModal("collector", e)}
                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Briefcase className="w-4 h-4 text-gray-500" /> Add Collector
              </button>
              <button
                onClick={(e) => openCreateModal("resident", e)}
                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Home className="w-4 h-4 text-gray-500" /> Add Resident
              </button>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4 text-gray-500" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal with background blur */}
      {showModal && (
        <div className="fixed inset-0 flex justify-center items-center z-[300] backdrop-blur-sm bg-black/30 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative animate-fade-in">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-red-800 mb-4">
              Add {newAccount.role.charAt(0).toUpperCase() + newAccount.role.slice(1)} Account
            </h2>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={newAccount.name}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={newAccount.email}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, email: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Password</label>
                <input
                  type="password"
                  value={newAccount.password}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, password: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-600"
                  required
                />
              </div>

              {/* Only show mobile & purok if resident */}
              {newAccount.role === "resident" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Mobile</label>
                    <input
                      type="text"
                      value={newAccount.mobile}
                      onChange={(e) =>
                        setNewAccount({ ...newAccount, mobile: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Purok</label>
                    <input
                      type="text"
                      value={newAccount.purok}
                      onChange={(e) =>
                        setNewAccount({ ...newAccount, purok: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-900 text-white font-semibold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 200ms ease-out; }
      `}</style>
    </header>
  );
}
