import type { Metadata } from "next";
import { Ubuntu, Open_Sans, JetBrains_Mono } from "next/font/google";
import { SessionProvider } from "@/lib/session-context";
import { WorkspaceProvider } from "@/lib/workspace-context";
import { I18nProvider } from "@/components/I18nProvider";
import "./globals.css";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-ubuntu",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-open-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MDS · Maxinst Developer Scripts",
  description: "Painel de menus do MDS — tarefas do IBM Maximo / MAS sem terminal.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${ubuntu.variable} ${openSans.variable} ${jetbrainsMono.variable}`}>
      <body>
        <I18nProvider>
          <SessionProvider>
            <WorkspaceProvider>{children}</WorkspaceProvider>
          </SessionProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
