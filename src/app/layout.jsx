import { Nunito } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";

const nunitoFont = Nunito({
  subsets: ["latin"],
  display: "swap",
});

const RootLayout = ({ children }) => {
  return (
    <html lang="en" className={nunitoFont.className}>
      <body className="antialiased">{children}</body>
    </html>
  );
};

export const metadata = {
  title: "Birthcare Management System",
  description: "Register and manage birthcare facilities with ease",
};

export default RootLayout;
