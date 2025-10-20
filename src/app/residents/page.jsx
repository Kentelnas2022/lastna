"use client";

import { useState, useEffect } from "react";
import Navbar from "../components-residents/Navbar";
import GreetingCard from "../components-residents/GreetingCard";
import ScheduleAndEducationSection from "../components-residents/ScheduleAndEducationSection";
import ReportModal from "../components-residents/ReportModal";
import FeedbackModal from "../components-residents/FeedbackModal";
import { supabase } from "@/supabaseClient";

export default function ResidentsPage() {
  const [view, setView] = useState("schedule");
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [user, setUser] = useState(null);
  const [resolvedReport, setResolvedReport] = useState(null);
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

        const { data: reports, error } = await supabase
          .from("report_status")
          .select(`
            id,
            status,
            official_response,
            updated_at,
            report_id,
            reports!inner (title, user_id)
          `)
          .eq("reports.user_id", user.id)
          .eq("status", "Resolved")
          .order("updated_at", { ascending: false })
          .limit(1);

        if (error) {
          console.error("Error fetching resolved reports:", error);
          return;
        }

        if (reports && reports.length > 0) {
          const latestResolved = reports[0];

          const { data: existingRating, error: ratingError } = await supabase
            .from("ratings")
            .select("id")
            .eq("user_id", latestResolved.reports.user_id)
            .eq("report_id", latestResolved.report_id)
            .maybeSingle();

          if (ratingError && ratingError.message) {
            console.error("Error checking rating:", ratingError.message);
            return;
          }

          const ratingExists =
            existingRating && Object.keys(existingRating).length > 0;

          if (!ratingExists) {
            setResolvedReport(latestResolved);
            setShowFeedback(true);
          }
        }
      } catch (err) {
        console.error("Error checking resolved reports:", err);
      } finally {
        setLoading(false);
      }
    };

    checkResolvedReports();
  }, []);

  // 🌐 Facebook-style skeleton shimmer loading screen
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="space-y-6 w-[360px] p-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm space-y-4"
            >
              {/* Profile Row */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gray-300 shimmer"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 bg-gray-300 rounded shimmer"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded shimmer"></div>
                </div>
              </div>

              {/* Content Placeholder */}
              <div className="space-y-3">
                <div className="h-3 w-full bg-gray-300 rounded shimmer"></div>
                <div className="h-3 w-5/6 bg-gray-200 rounded shimmer"></div>
                <div className="h-3 w-3/4 bg-gray-300 rounded shimmer"></div>
              </div>

              {/* Image Placeholder */}
              <div className="w-full h-48 bg-gray-300 rounded-xl shimmer"></div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-gray-500 font-medium">Loading...</p>

        <style jsx>{`
          .shimmer {
            position: relative;
            overflow: hidden;
          }
          .shimmer::before {
            content: "";
            position: absolute;
            top: 0;
            left: -150%;
            width: 150%;
            height: 100%;
            background: linear-gradient(
              90deg,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.5) 50%,
              rgba(255, 255, 255, 0) 100%
            );
            animation: shimmer 1.5s infinite;
          }
          @keyframes shimmer {
            100% {
              left: 150%;
            }
          }
        `}</style>
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

      {showFeedback && resolvedReport && (
        <FeedbackModal
          isOpen={showFeedback}
          onClose={() => setShowFeedback(false)}
          reportId={resolvedReport.report_id}
          userId={resolvedReport.reports.user_id}
        />
      )}

      {console.log("Passing to FeedbackModal:", {
        user_id: resolvedReport?.reports?.user_id,
        report_id: resolvedReport?.report_id,
      })}

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
