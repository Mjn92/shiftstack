import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

export const metadata = {
  title: "ShiftStack Admin Dashboard",
  description: "Admin dashboard for ShiftStack time tracking",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
