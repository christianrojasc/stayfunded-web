// Login layout — no sidebar, no nav, full screen centered
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f1219]">
      {children}
    </div>
  )
}
