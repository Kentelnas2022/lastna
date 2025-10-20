"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/supabaseClient";
import {
  CalendarDays,
  Recycle,
  Bell,
  Leaf,
  LogIn,
  UserCog,
  Truck,
} from "lucide-react";

// 🌀 Onboarding content for Residents
const onboardingScreens = [
  {
    icon: <CalendarDays size={80} className="text-[#d94f4f] drop-shadow-md" />,
    title: "Know Your Schedule",
    subtitle: "Easily check your barangay’s waste collection schedule.",
  },
  {
    icon: <Recycle size={80} className="text-[#d94f4f] drop-shadow-md" />,
    title: "Segregate Properly",
    subtitle:
      "Learn how to separate biodegradable and non-biodegradable waste.",
  },
  {
    icon: <Bell size={80} className="text-[#d94f4f] drop-shadow-md" />,
    title: "Get Collection Reminders",
    subtitle: "Receive timely notifications before the collection day.",
  },
  {
    icon: <Leaf size={80} className="text-[#d94f4f] drop-shadow-md" />,
    title: "Keep Tambacan Clean",
    subtitle:
      "Join the community in maintaining a cleaner, greener barangay.",
  },
];

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const skipOnboarding = searchParams.get("skipOnboarding") === "true";

  // 👇 Determine device type
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Login state
  const [started, setStarted] = useState(skipOnboarding);
  const [step, setStep] = useState(
    skipOnboarding ? onboardingScreens.length + 1 : 0
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // ✨ Typing animation
  const messages = ["Welcome!", "Hello There!", "Log In to Start!"];
  const [displayedText, setDisplayedText] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!started) return;
    const speed = isDeleting ? 50 : 120;
    const timeout = setTimeout(() => {
      const currentMessage = messages[messageIndex];
      if (!isDeleting) {
        setDisplayedText(currentMessage.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
        if (charIndex + 1 === currentMessage.length) {
          setTimeout(() => setIsDeleting(true), 1000);
        }
      } else {
        setDisplayedText(currentMessage.slice(0, charIndex - 1));
        setCharIndex(charIndex - 1);
        if (charIndex - 1 === 0) {
          setIsDeleting(false);
          setMessageIndex((messageIndex + 1) % messages.length);
        }
      }
    }, speed);
    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, messageIndex, started]);

  // 🔐 Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    const user = data.user;
    if (!user) return;

    const adminEmail = "tristandominicparajes.202200583@gmail.com"; // official
    const collectorEmail = "parajestristan4@gmail.com"; // collector

    if (user.email === adminEmail) {
      router.push("/");
    } else if (user.email === collectorEmail) {
      router.push("/collector");
    } else {
      router.push("/residents");
    }
  };

  // 🧭 Official First Page (Desktop View)
  if (!isMobile && !started) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* 🌐 Navbar with Login */}
        <header className="w-full bg-white shadow-sm py-4 px-12 flex justify-between items-center fixed top-0 left-0 z-10">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-[#b33b3b]">
              Waste Collection Portal
            </h1>
          </div>

          {/* 🔐 Inline Login Form */}
          <form onSubmit={handleLogin} className="flex items-center space-x-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b33b3b]/50 placeholder-gray-400"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b33b3b]/50 placeholder-gray-400"
            />
            <button
              type="submit"
              className="bg-[#b33b3b] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#d94f4f] transition"
            >
              Login
            </button>
          </form>
        </header>

        {/* 📰 Hero Section */}
        <section className="flex flex-col md:flex-row items-center justify-between px-12 mt-32 md:mt-40">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-xl"
          >
            <h2 className="text-5xl font-bold text-[#b33b3b] leading-tight mb-4">
              Tambacan Waste Collection
            </h2>
            <p className="text-gray-600 text-lg mb-10">
              Stay informed about collection days, manage community waste
              reports, and promote cleaner surroundings through our easy-to-use
              dashboard. Join the movement to make Tambacan a model of proper
              waste management and sustainability.
            </p>
          </motion.div>

          <motion.img
            src="/earths.png"
            alt="Official Waste Management"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full md:w-[480px] mt-10 md:mt-0 drop-shadow-lg"
          />
        </section>

        {/* ♻️ Proper Segregation Tips */}
        <section className="px-12 mt-24 mb-20">
          <h3 className="text-3xl font-bold text-[#b33b3b] mb-8">
            Proper Waste Segregation Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition"
            >
              <div className="h-48 bg-green-100 flex items-center justify-center">
                <Leaf size={60} className="text-green-600" />
              </div>
              <div className="p-6 text-left">
                <h4 className="text-xl font-semibold mb-2 text-[#b33b3b]">
                  Biodegradable Waste
                </h4>
                <p className="text-gray-600 text-sm">
                  Includes food scraps, garden waste, and paper products. Use a
                  green bin for these items — they can be composted or used as
                  fertilizer.
                </p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition"
            >
              <div className="h-48 bg-blue-100 flex items-center justify-center">
                <Recycle size={60} className="text-blue-600" />
              </div>
              <div className="p-6 text-left">
                <h4 className="text-xl font-semibold mb-2 text-[#b33b3b]">
                  Recyclable Waste
                </h4>
                <p className="text-gray-600 text-sm">
                  Includes bottles, cans, plastics, and metals. Make sure to
                  clean and dry them before disposal — place them in a blue bin.
                </p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition"
            >
              <div className="h-48 bg-yellow-100 flex items-center justify-center">
                <CalendarDays size={60} className="text-yellow-600" />
              </div>
              <div className="p-6 text-left">
                <h4 className="text-xl font-semibold mb-2 text-[#b33b3b]">
                  Residual Waste
                </h4>
                <p className="text-gray-600 text-sm">
                  Waste that can’t be recycled or composted — like styrofoam,
                  diapers, and ceramics. These belong in a yellow bin for proper
                  disposal.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ☎️ Contact Us Section */}
        <section className="bg-[#f9f9f9] py-16 px-12 text-center border-t">
          <h3 className="text-3xl font-bold text-[#b33b3b] mb-4">Contact Us</h3>
          <p className="text-gray-700 mb-2">
            Barangay Tambacan WasteSmart Office
          </p>
          <p className="text-gray-700">📞 (0926) 321-5432</p>
          <p className="text-gray-700">✉️ wastesmart.tambacan@gmail.com</p>
        </section>

        {/* 🌱 Footer */}
        <footer className="bg-[#b33b3b] text-white py-6 text-center">
          <p>© 2025 WasteSmart Official Portal | Barangay Tambacan</p>
        </footer>
      </div>
    );
  }

  // 🚛 Collector First Page (Mobile)
  if (
    isMobile &&
    !started &&
    step === 0 &&
    searchParams.get("role") === "collector"
  ) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#b33b3b] to-[#d94f4f] text-white px-6">
        <Truck size={100} className="mb-6 drop-shadow-md" />
        <h1 className="text-3xl font-bold mb-3">Collector Dashboard</h1>
        <p className="text-sm text-center mb-8 max-w-xs">
          View collection routes, schedules, and progress reports for the day.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setStarted(true)}
          className="bg-white text-[#b33b3b] font-semibold px-8 py-3 rounded-full shadow-md hover:bg-gray-200 transition"
        >
          Let’s Get Started
        </motion.button>
      </div>
    );
  }

  // 🌿 Residents First Page (existing flow)
  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-gray-800 px-6">
      <div className="w-full max-w-md text-center">
        <AnimatePresence mode="wait">
          {!started ? (
            step === 0 ? (
              // 🌱 Resident Intro
              <motion.div
                key="get-started"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center"
              >
                <div className="mb-6">
                  <Leaf size={100} className="text-[#d94f4f] drop-shadow-md" />
                </div>
                <h1 className="text-3xl font-bold mb-2 text-[#b33b3b]">
                  Waste Collection Schedule
                </h1>
                <p className="text-sm text-gray-600 mb-8">
                  Keep your barangay clean and organized. Stay updated with your
                  waste pickup days.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep(1)}
                  className="bg-[#d94f4f] text-white font-semibold px-8 py-3 rounded-full shadow-md hover:bg-[#e06060] transition"
                >
                  Let’s Get Started
                </motion.button>
              </motion.div>
            ) : (
              // 💫 Onboarding Slides
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex flex-col items-center space-y-6">
                  {onboardingScreens[step - 1].icon}
                  <h2 className="text-2xl font-bold text-[#b33b3b]">
                    {onboardingScreens[step - 1].title}
                  </h2>
                  <p className="text-gray-600 text-sm max-w-xs">
                    {onboardingScreens[step - 1].subtitle}
                  </p>

                  <div className="flex space-x-2 mt-4">
                    {onboardingScreens.map((_, index) => (
                      <div
                        key={index}
                        className={`w-3 h-3 rounded-full transition ${
                          index + 1 === step
                            ? "bg-[#d94f4f]"
                            : "bg-[#d94f4f]/40"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex justify-between w-full mt-6 text-sm px-4">
                    <button
                      onClick={() => setStarted(true)}
                      className="text-gray-500 hover:underline"
                    >
                      Skip
                    </button>
                    <button
                      onClick={() =>
                        step < onboardingScreens.length
                          ? setStep(step + 1)
                          : setStarted(true)
                      }
                      className="font-semibold text-[#d94f4f] hover:underline"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          ) : (
            // ✅ Enhanced Login Screen
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="relative bg-gradient-to-br from-green-50 via-white to-green-100 text-gray-800 rounded-3xl shadow-2xl p-10 w-full max-w-sm mx-auto overflow-hidden"
            >
              {/* Decorative abstract circles */}
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-green-200/40 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#d94f4f]/30 rounded-full blur-2xl" />

              <div className="relative z-10 flex flex-col items-center">
                <LogIn size={65} className="text-[#d94f4f] drop-shadow-md mb-4" />
                <h1 className="text-3xl font-extrabold mb-3 text-[#b33b3b] animate-blink-cursor">
                  {displayedText}
                </h1>
                <p className="text-sm text-gray-600 mb-6 text-center">
                  Log in to continue exploring your dashboard.
                </p>

                <form onSubmit={handleLogin} className="w-full">
                  {error && (
                    <p className="text-red-500 text-sm mb-3 text-center">
                      {error}
                    </p>
                  )}

                  <div className="space-y-4">
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/80 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#d94f4f]/60 placeholder-gray-400 transition"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/80 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#d94f4f]/60 placeholder-gray-400 transition"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full mt-6 bg-[#d94f4f] text-white font-semibold py-3 rounded-xl shadow-lg hover:bg-[#e06060] transition"
                  >
                    Login
                  </motion.button>

                  <p className="mt-6 text-sm text-center text-gray-600">
                    Don’t have an account?{" "}
                    <a
                      href="/register"
                      className="text-blue-600 font-medium hover:underline"
                    >
                      Sign Up
                    </a>
                  </p>
                </form>
              </div>

              <style jsx>{`
                .animate-blink-cursor {
                  animation: blink 0.7s infinite;
                  border-right: 4px solid #b33b3b;
                }
                @keyframes blink {
                  0%,
                  100% {
                    border-color: transparent;
                  }
                  50% {
                    border-color: #b33b3b;
                  }
                }
              `}</style>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
