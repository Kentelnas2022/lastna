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
  const [respondedIds, setRespondedIds] = useState([]);
  const [user, setUser] = useState(null);
  const [official, setOfficial] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setUser(session.user);
    };
    fetchUser();
  }, []);

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

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data: reportsData, error } = await supabase
        .from("reports")
        .select("id, title, description, file_urls, user_id, location, status, official_response, created_at")
        .order("created_at", { ascending: false });

      if (error || !reportsData) {
        setReports([]);
        setLoading(false);
        return;
      }

      const reportIds = reportsData.map((r) => r.id);

      const { data: statuses } = await supabase
        .from("report_status")
        .select("id, report_id, status, official_response, updated_at, location, updated_by")
        .in("report_id", reportIds)
        .order("updated_at", { ascending: true });

      const latest = {};
      (statuses || []).forEach((s) => (latest[s.report_id] = s));

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
      console.error(err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedReports = async () => {
    try {
      const { data } = await supabase
        .from("archive")
        .select("*")
        .order("archived_at", { ascending: false });
      setArchived((data || []).map(normalizeReport));
    } catch (err) {
      console.error(err);
      setArchived([]);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchArchivedReports();

    const channel = supabase
      .channel("realtime-report-status-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "report_status" }, () => {
        setRefreshKey((k) => k + 1);
      })
      .subscribe();

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
  }, []);

  useEffect(() => {
    fetchReports();
    fetchArchivedReports();
  }, [refreshKey]);

  const handleRespond = async (report, resolve = false) => {
    const responseText = report.draftResponse || "";
    const nextStatus = resolve ? "Resolved" : "In Progress";

    setProcessingIds((prev) => [...prev, report.id]);

    try {
      const payload = {
        report_id: report.id,
        status: nextStatus,
        official_response: responseText,
        updated_by: official?.user_id || null,
        location: report.location || null,
        updated_at: new Date().toISOString(),
      };

      const { data: upserted, error: upsertError } = await supabase
        .from("report_status")
        .upsert(payload, { onConflict: "report_id" })
        .select();

      if (upsertError) throw upsertError;

      const { error: updateError } = await supabase
        .from("reports")
        .update({
          status: nextStatus,
          official_response: responseText,
        })
        .eq("id", report.id);

      if (updateError) throw updateError;

      Swal.fire({
        icon: "success",
        title: resolve ? "Resolved!" : "Response Saved!",
        text: resolve ? "Report marked as resolved." : "Your response has been saved.",
        timer: 1600,
        showConfirmButton: false,
      });

      if (!resolve) setRespondedIds((prev) => [...prev, report.id]);

      fetchReports();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err.message || "Failed to save response.",
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
      console.error(error);
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
      console.error(error);
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
                    (report.latest_status || report.status || "pending") === "Pending"
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

              {official && report.status !== "Resolved" && (
                <div className="mt-3">
                  {!respondedIds.includes(report.id) && (
                    <textarea
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Type your response here..."
                      value={report.draftResponse || ""}
                      onChange={(e) => {
                        const newVal = e.target.value;
                        setReports((prev) =>
                          prev.map((r) => (r.id === report.id ? { ...r, draftResponse: newVal } : r))
                        );
                      }}
                    />
                  )}
                  <div className="mt-2 flex gap-2">
                    {!respondedIds.includes(report.id) && (
                      <button
                        onClick={() => handleRespond(report, false)}
                        disabled={processingIds.includes(report.id)}
                        className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                      >
                        <MessageSquare size={16} /> Respond
                      </button>
                    )}
                    {report.latest_status !== "Resolved" && (
                      <button
                        onClick={() => handleRespond(report, true)}
                        disabled={processingIds.includes(report.id)}
                        className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                      >
                        <CheckCircle size={16} /> Mark Resolved
                      </button>
                    )}
                  </div>
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
