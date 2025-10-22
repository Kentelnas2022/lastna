"use client";

import { useState, useEffect } from "react";
import Navbar from "../components-residents/Navbar";
import GreetingCard from "../components-residents/GreetingCard";
import ScheduleAndEducationSection from "../components-residents/ScheduleAndEducationSection";
import ReportModal from "../components-residents/ReportModal";
import { motion } from "framer-motion";
import { supabase } from "@/supabaseClient";

export default function ResidentsPage() {
  const [view, setView] = useState("schedule");
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkResolvedReports = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Error getting user:", userError.message);
          return;
        }
        if (!user) return;

        setUser(user);
      } catch (err) {
        console.error("Error checking resolved reports:", err);
      } finally {
        setLoading(false);
      }
    };

    checkResolvedReports();
  }, []);

  // 🌐 Clean White Circle Loader
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <motion.div
          className="w-16 h-16 border-4 border-gray-200 border-t-green-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.p
          className="mt-6 text-gray-600 font-medium text-lg"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          Loading, please wait...
        </motion.p>
      </div>
    );
  }

  // ✅ Main Residents Page Content
  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar
        onOpenReport={() => setIsReportOpen(true)}
        onOpenSchedule={() => setView("schedule")}
      />

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 fade-in">
        <GreetingCard />
        <div id="contentArea">
          <ScheduleAndEducationSection view={view} />
        </div>
      </main>

      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />

      <style jsx global>{`
        .fade-in {
          animation: fadeIn 0.4s ease-in-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
