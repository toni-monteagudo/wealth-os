import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/i18n/I18nContext";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
    title: "Wealth OS - Mission Control",
    description: "Personal Finance & Business ERP",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className={inter.variable}>
            <body className="antialiased selection:bg-accent selection:text-white pb-20">
                <I18nProvider>
                    <Header />
                    {children}
                </I18nProvider>
            </body>
        </html>
    );
}
