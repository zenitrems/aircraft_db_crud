import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIRCRAFT.DB",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            try {
              var storedTheme = window.localStorage.getItem("aircraft-theme");
              var theme = storedTheme === "dark" || storedTheme === "light"
                ? storedTheme
                : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
              document.documentElement.dataset.theme = theme;
              document.documentElement.style.colorScheme = theme;
            } catch (_) {}
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
