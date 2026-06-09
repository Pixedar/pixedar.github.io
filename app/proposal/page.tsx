import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Hidden State Safety - Wiktor Tomasik",
  description: "Redirecting to Hidden State Safety.",
}

export default function LegacyRedirectPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F4EE] px-6 text-center text-[#252922]">
      <meta httpEquiv="refresh" content="0; url=../hidden-state-safety/" />
      <script
        dangerouslySetInnerHTML={{
          __html: 'window.location.replace("../hidden-state-safety/")',
        }}
      />
      <a className="text-lg font-semibold underline underline-offset-4" href="../hidden-state-safety/">
        Hidden State Safety
      </a>
    </main>
  )
}
