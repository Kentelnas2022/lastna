"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient"; // ✅ Make sure this import path is correct

export default function GreetingCard() {
  const [greeting, setGreeting] = useState("");
  const [userName, setUserName] = useState("Resident"); // Default fallback name

  // ✅ Determine greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  // ✅ Fetch current user and their name from Supabase
  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Try to fetch from "profiles" table
      const { data: profileData } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();

      // Set userName with priority order
      setUserName(
        profileData?.name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "Resident"
      );
    };

    fetchUserData();
  }, []);

  return (
    <div
      className="
        bg-white
        text-[#3b0a0a]
        rounded-xl
        p-5 sm:p-6
        shadow-md
        transition-all
        duration-300
        hover:shadow-lg
        border border-gray-200
      "
    >
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 text-[#8B0000]">
        {greeting}, {userName}!
      </h2>
      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-md">
        Here’s your updated waste collection schedule. Stay organized and help
        keep Tambacan clean!
      </p>
    </div>
  );
}
