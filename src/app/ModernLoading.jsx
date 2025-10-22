"use client";
import React from "react";
import { motion } from "framer-motion";

export default function ModernLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 overflow-hidden relative">
      {/* Animated Gradient Background */}
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#60a5fa_0%,_transparent_70%)] opacity-30"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Animated Icon Pulse */}
      <motion.div
        className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-indigo-400 rounded-3xl shadow-lg flex items-center justify-center relative"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 10, -10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <motion.div
          className="absolute inset-0 rounded-3xl bg-white/10 blur-md"
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          className="text-white text-3xl font-bold"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ⚡
        </motion.span>
      </motion.div>

      {/* Text */}
      <motion.p
        className="mt-8 text-gray-600 font-semibold text-lg tracking-wide"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        Loading, please wait...
      </motion.p>

      {/* Shimmer Line */}
      <motion.div
        className="mt-6 w-40 h-1.5 rounded-full bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400"
        animate={{ backgroundPosition: ["0%", "200%"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{ backgroundSize: "200% 100%" }}
      />
    </div>
  );
}
