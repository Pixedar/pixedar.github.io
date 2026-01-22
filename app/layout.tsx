import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import Script from "next/script"


const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Wiktor Tomasik — AI Research & Generative Systems",
  description:
    "I build generative systems and interpretable ML tools — turning emotion, language, and brain dynamics into geometry you can explore.",
  metadataBase: new URL("https://pixedar.github.io"), // change if different

  openGraph: {
    title: "Wiktor Tomasik — AI Research & Generative Systems",
    description:
      "Generative systems, emotional geometry, and ML interpretability — tools that make hidden dynamics readable.",
    url: "https://pixedar.github.io",
    siteName: "Wiktor Tomasik",
    images: ["/preview.png"], // add this image to /public
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Wiktor Tomasik — AI Research & Generative Systems",
    description:
      "Generative systems, emotional geometry, and ML interpretability — tools that make hidden dynamics readable.",
    images: ["/preview.png"],
  },

  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
}



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}

        <Script
  data-goatcounter="https://pixedar.goatcounter.com/count"
  async
  src="//gc.zgo.at/count.js"
/>

        <Script
          id="person-jsonld"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Wiktor Tomasik",
              url: "https://pixedar.github.io",
              sameAs: ["https://github.com/Pixedar", "https://www.linkedin.com/in/pixedar/"],
            }),
          }}
        />

        <Analytics />
      </body>
    </html>
  )
}
