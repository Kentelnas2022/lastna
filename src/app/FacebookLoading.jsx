"use client";
import React from "react";

export default function FacebookLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="w-[360px] p-4 rounded-xl bg-white border border-gray-200 shadow-sm space-y-4">
        {/* Profile row */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gray-300 shimmer"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 bg-gray-300 rounded shimmer"></div>
            <div className="h-3 w-24 bg-gray-200 rounded shimmer"></div>
          </div>
        </div>

        {/* Post content placeholder */}
        <div className="space-y-3">
          <div className="h-3 w-full bg-gray-300 rounded shimmer"></div>
          <div className="h-3 w-5/6 bg-gray-200 rounded shimmer"></div>
          <div className="h-3 w-3/4 bg-gray-300 rounded shimmer"></div>
        </div>

        {/* Image placeholder */}
        <div className="w-full h-48 bg-gray-300 rounded-xl shimmer"></div>
      </div>

      {/* Label */}
      <p className="mt-6 text-gray-500 font-medium">Loading...</p>

      {/* Inline shimmer animation */}
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
