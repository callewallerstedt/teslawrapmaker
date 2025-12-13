import Navigation from '@/components/Navigation'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-[#ededed]">
      <Navigation currentPath="/privacy" />

      <main className="max-w-4xl mx-auto px-3 sm:px-5 lg:px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-[#a0a0a0]">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section>
            <h2 className="text-xl font-semibold mb-4">Information We Collect</h2>
            <p>We collect minimal information necessary to provide our service:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-[#a0a0a0]">
              <li>IP addresses for like functionality (stored temporarily)</li>
              <li>Usernames (optional, provided by users)</li>
              <li>Wrap designs and images uploaded by users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">How We Use Your Information</h2>
            <ul className="list-disc list-inside mt-2 space-y-1 text-[#a0a0a0]">
              <li>To display user-generated content on our platform</li>
              <li>To provide like/voting functionality</li>
              <li>To improve our service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Data Storage</h2>
            <p className="text-[#a0a0a0]">
              All user data is stored securely using Supabase. We retain user-generated content until it is deleted by the user or our service terminates.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Contact</h2>
            <p className="text-[#a0a0a0]">
              For privacy concerns, please contact us at contact.wallerstedt@gmail.com.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
