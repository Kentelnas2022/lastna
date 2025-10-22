import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Tambacan Waste App",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-pink-50 to-red-100">
        {children}
      </body>
    </html>
  );
}
