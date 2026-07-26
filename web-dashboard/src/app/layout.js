import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

export const metadata = {
  title: {
    default: "ShiftStack",
    template: "%s | ShiftStack",
  },
  description:
    "ShiftStack workforce time tracking, employee management, and reporting.",
  applicationName: "ShiftStack",
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
