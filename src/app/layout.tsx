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
    "digitalax",
    "f3manifesto",
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              "@id": "https://emmajanemackinnonlee.com/#person",
              name: "Emma-Jane MacKinnon-Lee",
              url: "https://emmajanemackinnonlee.com/",
              mainEntityOfPage: {
                "@type": "WebPage",
                "@id": "https://emmajanemackinnonlee.com/",
              },
              sameAs: [
                "https://emmajanemackinnonlee.com/",
                "https://emmajanemackinnon.com/",
                "https://janefuture.com/",
                "https://emmajanemackinnonlee.xyz/",
                "https://emmajanemackinnonlee.net/",
                "https://emmajanemackinnonlee.ai/",
                "https://emmajanemackinnonlee.org/",
                "https://emmajanemackinnonlee-f3manifesto.com/",
                "https://emmajanemackinnonlee-cc0.com/",
                "https://emmajanemackinnonlee-digitalax.com/",
                "https://emmajanemackinnonlee-runway.com/",
                "https://icoinedweb3fashion.com/",
                "https://syntheticfutures.xyz/",
                "https://web3fashion.xyz/",
                "https://emancipa.xyz/",
                "https://highlangu.com/",
                "https://digitalax.xyz/",
                "https://cc0web3fashion.com/",
                "https://cc0web3.com/",
                "https://cuntism.net/",
                "https://dhawu.com/",
                "https://casadeespejos.com/",
                "https://emancipa.net/",
                "https://dhawu.emancipa.xyz/",
                "https://highlangu.emancipa.xyz/",
                "https://twitter.com/emmajane1313",
                "https://medium.com/@casadeespejos",
                "https://www.flickr.com/photos/emmajanemackinnonlee/",
              ],
            }),
          }}
        />
      </head>
      <body>
        <Wrapper>{children}</Wrapper>
      </body>
    </html>
  );
}
