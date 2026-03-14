// Dashboard home — placeholder until Phase 3
// Screen 4 (Home) will be built in Phase 3

export default function DashboardPage() {
  return (
    <div className="px-6 md:px-10 py-8">
      <h1 className="text-h1 text-navy mb-2">Good morning 👋</h1>
      <p className="text-body-sm text-text-secondary mb-8">
        Your pets&apos; health records are up to date.
      </p>

      {/* Placeholder for pet cards — Phase 3 */}
      <div className="card p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
        <span className="text-4xl mb-4">🐾</span>
        <h2 className="text-h2 text-navy mb-2">Add your first pet</h2>
        <p className="text-body-sm text-text-secondary max-w-[300px]">
          Start building your pet&apos;s health passport — add their name, photo, and
          basic info.
        </p>
      </div>
    </div>
  );
}
