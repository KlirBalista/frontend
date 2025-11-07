import { Nunito } from "next/font/google";
import { SWRConfig } from "swr";
import "./globals.css";
import "leaflet/dist/leaflet.css";

const nunitoFont = Nunito({
  subsets: ["latin"],
  display: "swap",
});

const RootLayout = ({ children }) => {
  return (
    <html lang="en" className={nunitoFont.className}>
      <body className="antialiased">
        <SWRConfig
          value={{
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 5000,
          }}
        >
          {children}
        </SWRConfig>
      </body>
    </html>
  );
};

export const metadata = {
  title: "Birthcare Management System",
  description: "Register and manage birthcare facilities with ease",
};

export default RootLayout;
