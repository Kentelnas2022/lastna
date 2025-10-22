"use client";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { supabase } from "@/supabaseClient";
import {
  Paperclip,
  MessageSquare,
  CheckCircle,
  MapPin,
  Archive,
  RotateCcw,
} from "lucide-react";

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [archived, setArchived] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState([]);
  const [user, setUser] = useState(null);
  const [official, setOfficial] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Get session user
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) setUser(session.user);
    };
    fetchUser();
  }, []);

  // Verify official (if you store official metadata in 'officials' table)
  useEffect(() => {
    const verifyOfficial = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("officials")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!error && data) setOfficial(data);
    };
    verifyOfficial();
  }, [user]);

  // Normalize file_urls (handles text or JSON string)
  const normalizeReport = (r) => {
    let file_urls = r.file_urls;
    if (!file_urls) file_urls = [];
    if (typeof file_urls === "string") {
      try {
        file_urls = JSON.parse(file_urls);
      } catch {
        file_urls = [file_urls];
      }
    }
    return { ...r, file_urls };
  };

  // Fetch reports and their latest status (report_status)
  const fetchReports = async () => {
    setLoading(true);
    try {
      // 1) fetch reports with resident relation (attempt)
      const { data: reportsData, error } = await supabase
        .from("reports")
        .select("id, title, description, file_urls, user_id, location, status, official_response, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fetch reports error:", error);
        setReports([]);
        setLoading(false);
        return;
      }

      if (!reportsData || reportsData.length === 0) {
        setReports([]);
        setLoading(false);
        return;
      }

      const reportIds = reportsData.map((r) => r.id);

      // 2) fetch report_status rows for these reports ordered by updated_at ascending => we'll take the latest per report
      const { data: statuses, error: statusErr } = await supabase
        .from("report_status")
        .select("id, report_id, status, official_response, updated_at, location, updated_by")
        .in("report_id", reportIds)
        .order("updated_at", { ascending: true });

      if (statusErr) {
        console.error("Error fetching report_status:", statusErr.message);
      }

      // build latest map
      const latest = {};
      (statuses || []).forEach((s) => (latest[s.report_id] = s)); // ascending so last wins

      const enriched = reportsData.map((r) => {
        const last = latest[r.id];
        return normalizeReport({
          ...r,
          latest_status: last?.status || r.status || "Pending",
          latest_status_row: last || null,
        });
      });

      setReports(enriched);
    } catch (err) {
      console.error("Unexpected error fetching reports:", err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch archived reports (from archive table)
  const fetchArchivedReports = async () => {
    try {
      const { data, error } = await supabase
        .from("archive")
        .select("*")
        .order("archived_at", { ascending: false });

      if (error) {
        console.error("Fetch archived error:", error);
        setArchived([]);
        return;
      }
      setArchived((data || []).map(normalizeReport));
    } catch (err) {
      console.error("Unexpected archive fetch error:", err);
      setArchived([]);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchArchivedReports();

    // Realtime subscription: when report_status changes, refresh list
    const channel = supabase
      .channel("realtime-report-status-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "report_status" }, () => {
        // small debounce: change refreshKey to trigger fetch
        setRefreshKey((k) => k + 1);
      })
      .subscribe();

    // also subscribe to reports changes (creation, deletion)
    const channel2 = supabase
      .channel("realtime-reports")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => {
        setRefreshKey((k) => k + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(channel2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // re-fetch when refreshKey changes
  useEffect(() => {
    fetchReports();
    fetchArchivedReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // Respond to a report: insert to report_status and update reports table for convenience
  const handleRespond = async (report, resolve = false) => {
    // report.draftResponse assumed to be set elsewhere in UI; fallback to empty string
    const responseText = report.draftResponse || "";

    // determine nextStatus
    const nextStatus = resolve ? "Resolved" : "In Progress";

    setProcessingIds((prev) => [...prev, report.id]);

    try {
      // insert into report_status
      const insertPayload = {
        report_id: report.id,
        status: nextStatus,
        official_response: responseText,
        updated_by: (official && official.user_id) || null,
        location: report.location || null,
        // updated_at will default to now() in DB
      };

      const { error: insertError } = await supabase.from("report_status").insert([insertPayload]);
      if (insertError) throw insertError;

      // update reports table for convenience / quick reads
      const { error: updateError } = await supabase
        .from("reports")
        .update({ status: nextStatus, official_response: responseText })
        .eq("id", report.id);
      if (updateError) console.warn("Warning: could not update reports.status:", updateError.message);

      // success UX
      Swal.fire({
        icon: "success",
        title: resolve ? "Marked Resolved" : "Responded",
        text: resolve ? "Report marked as resolved" : "Response saved",
        timer: 1600,
        showConfirmButton: false,
      });

      // refresh
      fetchReports();
    } catch (err) {
      console.error("Error responding to report:", err);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to save response. Try again.",
      });
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== report.id));
    }
  };

  const archiveReport = async (report) => {
    try {
      const insertData = {
        report_id: report.id,
        title: report.title,
        description: report.description,
        status: report.latest_status || report.status,
        file_urls: report.file_urls || [],
        official_response: report.official_response || "",
        created_at: report.created_at,
        archived_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase.from("archive").insert([insertData]);
      if (insertError) throw insertError;

      await supabase.from("reports").delete().eq("id", report.id);

      fetchReports();
      fetchArchivedReports();

      Swal.fire({
        icon: "success",
        title: "Archived!",
        text: `The report "${report.title}" has been archived successfully.`,
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (error) {
      console.error("Archive error:", error.message);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong while archiving the report!",
      });
    }
  };

  const restoreReport = async (report) => {
    try {
      const restoreData = {
        title: report.title,
        description: report.description,
        status: "Pending",
        file_urls: report.file_urls || [],
        official_response: report.official_response,
        location: report.location || "Unknown",
        created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase.from("reports").insert([restoreData]);
      if (insertError) throw insertError;

      await supabase.from("archive").delete().eq("id", report.id);

      fetchReports();
      fetchArchivedReports();

      Swal.fire({
        icon: "success",
        title: "Restored!",
        text: `The report "${report.title}" has been restored successfully.`,
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (error) {
      console.error("Restore error:", error.message);
      Swal.fire({
        icon: "error",
        title: "Restore Failed",
        text: "Something went wrong while restoring the report.",
      });
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading reports...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {showArchived ? "Archived Reports" : "Citizen Reports"}
        </h2>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white shadow-sm hover:bg-gray-50 text-gray-700"
        >
          {showArchived ? (
            <>
              <RotateCcw size={18} className="text-green-600" /> Back
            </>
          ) : (
            <>
              <Archive size={18} className="text-gray-500" /> Archived
            </>
          )}
        </button>
      </div>

      {!showArchived ? (
        reports.length === 0 ? (
          <div className="text-center text-gray-500">No reports found.</div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Submitted: {new Date(report.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <MapPin size={14} className="text-red-500" />
                    {report.location || "No location"}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    (report.latest_status || report.status || "pending") === "Pending" ||
                    (report.latest_status || report.status || "pending").toLowerCase() === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : (report.latest_status || report.status || "pending").toLowerCase() === "in progress"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {(report.latest_status || report.status || "Pending").toString()}
                </span>
              </div>

              <p className="mt-3 text-sm text-gray-700">{report.description}</p>

              {report.file_urls?.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Paperclip size={14} /> Attachments:
                  </p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {report.file_urls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm hover:underline"
                      >
                        Attachment {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {report.official_response && (
                <div className="mt-3 bg-gray-50 border-l-4 border-blue-500 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Response:</strong> {report.official_response}
                  </p>
                </div>
              )}

              <div className="mt-4 flex gap-3 flex-wrap">
                <button
                  onClick={() => archiveReport(report)}
                  className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-gray-500 text-white hover:bg-gray-600"
                >
                  <Archive size={16} />
                  Archive
                </button>
                <button
                  onClick={() => handleRespond(report, true)}
                  disabled={processingIds.includes(report.id)}
                  className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  Mark Resolved
                </button>
              </div>
            </div>
          ))
        )
      ) : archived.length === 0 ? (
        <div className="text-center text-gray-500">No archived reports.</div>
      ) : (
        archived.map((report) => (
          <div key={report.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Archived on {new Date(report.archived_at).toLocaleString()}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {report.status}
              </span>
            </div>

            <p className="mt-3 text-sm text-gray-700">{report.description}</p>

            {report.file_urls?.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Paperclip size={14} /> Attachments:
                </p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {report.file_urls.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm hover:underline"
                    >
                      Attachment {idx + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => restoreReport(report)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-700 text-white text-sm hover:bg-red-800"
              >
                <RotateCcw size={16} />
                Restore
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
