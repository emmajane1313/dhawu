import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.dhawu.emancipa.xyz"),
  title: "Dhäwu",
  description: "Ŋarra ga dhäwu",
  twitter: {
    card: "summary_large_image",
    images: "https://thedial.infura-ipfs.io/ipfs/QmSkVX4ZK9DLeRvHwmRTDYZz81ecaztx7eBsmcug93y9Sc",
    title: "Dhäwu",
    description: "Ŋarra ga dhäwu",
  },
  openGraph: {
    images: "https://thedial.infura-ipfs.io/ipfs/QmSkVX4ZK9DLeRvHwmRTDYZz81ecaztx7eBsmcug93y9Sc",
    title: "Dhäwu",
    description: "Ŋarra ga dhäwu.",
  },
  robots: {
    googleBot: {
      index: true,
      follow: true,
    },
  },
  keywords:
    "Web3, Web3 Fashion, Moda Web3, Open Source, CC0, Emma-Jane MacKinnon-Lee, Open Source LLMs, DIGITALAX, F3Manifesto, www.digitalax.xyz, www.f3manifesto.xyz, Women, Life, Freedom.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
