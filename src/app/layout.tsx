import type { Metadata } from "next";
import "./globals.css";
import Wrapper from "./components/modules/Wrapper";

export const metadata: Metadata = {
  title: "Dhäwu",
  description: "Wanhaŋuru nhe marrtjina? Nhäkurru nhe ga marrtji?",
  metadataBase: new URL("https://dhawu.emancipa.xyz"),
  twitter: {
    card: "summary_large_image",
    creator: "@emmajane1313",
    title: "Dhäwu",
    description: "Wanhaŋuru nhe marrtjina? Nhäkurru nhe ga marrtji?",
  },
  openGraph: {
    title: "Dhäwu",
    description: "Wanhaŋuru nhe marrtjina? Nhäkurru nhe ga marrtji?",
  },
  robots: {
    googleBot: {
      index: true,
      follow: true,
    },
  },
  creator: "Emma-Jane MacKinnon-Lee",
  publisher: "Emma-Jane MacKinnon-Lee",
  keywords: [
    "Web3",
    "Web3 Fashion",
    "Moda Web3",
    "Open Source",
    "CC0",
    "djambarrpuyŋu",
    "gupapuyŋuwu",
    "yolŋu matha",
    "yolŋu",
    "Emma-Jane MacKinnon-Lee",
    "Open Source LLMs",
    "DIGITALAX",
    "F3Manifesto",
    "www.digitalax.xyz",
    "www.f3manifesto.xyz",
    "Women",
    "Life",
    "Freedom",
  ],
  pinterest: {
    richPin: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body>
        <Wrapper children={children}></Wrapper>
      </body>
    </html>
  );
}
