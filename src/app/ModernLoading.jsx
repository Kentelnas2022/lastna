"use client";
import React from "react";
import { motion } from "framer-motion";

export default function ModernLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 overflow-hidden relative">
      {/* Background pulse effect */}
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#60a5fa_0%,_transparent_70%)] opacity-30"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Circular loader */}
      <motion.div
        className="relative w-24 h-24 border-8 border-blue-200 border-t-blue-500 rounded-full shadow-lg"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      >
        <motion.div
          className="absolute inset-0 rounded-full border-8 border-transparent border-t-indigo-400"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {/* Glow pulse */}
      <motion.div
        className="absolute w-40 h-40 rounded-full bg-blue-400 opacity-20 blur-3xl"
        animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Text */}
      <motion.p
        className="mt-10 text-gray-600 font-semibold text-lg tracking-wide"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        Loading, please wait...
      </motion.p>
    </div>
  );
}
