import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIRCRAFT.DB",
  description: "Registro de aeronaves, contactos no identificados y analitica de cobertura.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            try {
              var storedTheme = window.localStorage.getItem("aircraft-theme");
              var theme = storedTheme === "light" ? "light" : "dark";
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
