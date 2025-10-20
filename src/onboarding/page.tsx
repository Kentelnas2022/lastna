"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";

const slides = [
  {
    image: "/images/trash-disposal.svg",
    title: "Know Your Schedule",
    subtitle: "Easily check your barangay’s waste collection schedule.",
  },
  {
    image: "/images/sorting-bins.svg",
    title: "Segregate Properly",
    subtitle: "Learn how to separate biodegradable and non-biodegradable waste.",
  },
  {
    image: "/images/notification.svg",
    title: "Get Collection Reminders",
    subtitle: "Receive timely notifications before the collection day.",
  },
  {
    image: "/images/clean-community.svg",
    title: "Keep Tambacan Clean",
    subtitle: "Join the community in maintaining a cleaner, greener barangay.",
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(-1); // -1 = intro, 0–3 = slides
  const router = useRouter();

  const nextSlide = () => {
    if (step < slides.length - 1) setStep(step + 1);
    else router.push("/login");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#6A1B1A] to-[#8B2E2E] text-white px-6">
      <AnimatePresence mode="wait">
        {step === -1 ? (
          // 🚀 Intro Screen
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="flex flex-col items-center text-center space-y-8"
          >
            <Image
              src="/logo.png"
              alt="Barangay Tambacan Logo"
              width={120}
              height={120}
              className="rounded-full"
            />
            <div>
              <h1 className="text-2xl font-bold mb-2">Waste Collection Schedule</h1>
              <p className="text-sm text-gray-200">
                Keep your barangay clean and organized. Stay updated with your waste pickup days.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep(0)}
              className="bg-white text-[#6A1B1A] font-semibold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              Let’s Get Started
            </motion.button>
          </motion.div>
        ) : (
          // 🌀 Onboarding Slides
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center text-center space-y-8"
          >
            <Image
              src={slides[step].image}
              alt={slides[step].title}
              width={250}
              height={250}
              className="rounded-lg"
            />
            <div>
              <h2 className="text-xl font-semibold mb-2">{slides[step].title}</h2>
              <p className="text-sm text-gray-200">{slides[step].subtitle}</p>
            </div>

            {/* Pagination Dots */}
            <div className="flex space-x-2">
              {slides.map((_, i) => (
                <span
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i === step ? "bg-white" : "bg-gray-500"
                  }`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex justify-between w-full max-w-xs">
              <button
                onClick={() => router.push("/login")}
                className="text-sm text-gray-300 hover:text-white"
              >
                Skip
              </button>
              <button
                onClick={nextSlide}
                className="bg-white text-[#6A1B1A] px-6 py-2 rounded-full font-medium shadow hover:shadow-md transition-all"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
