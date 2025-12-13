import Navigation from '@/components/Navigation'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-[#ededed]">
      <Navigation currentPath="/terms" />

      <main className="max-w-4xl mx-auto px-3 sm:px-5 lg:px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-[#a0a0a0]">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section>
            <h2 className="text-xl font-semibold mb-4">Acceptance of Terms</h2>
            <p className="text-[#a0a0a0]">
              By accessing and using EvWrapStudio, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">User-Generated Content</h2>
            <p className="text-[#a0a0a0] mb-2">
              You are responsible for content you upload:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-[#a0a0a0]">
              <li>You must own or have rights to use uploaded images</li>
              <li>Content must not violate intellectual property rights</li>
              <li>No offensive, harmful, or illegal content allowed</li>
              <li>We reserve the right to remove inappropriate content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Service Availability</h2>
            <p className="text-[#a0a0a0]">
              This service is provided "as is" and may be discontinued at any time. We are not liable for service interruptions or data loss.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Intellectual Property</h2>
            <p className="text-[#a0a0a0]">
              EvWrapStudio and its original content are protected by copyright. User-generated content remains the property of the user, but by uploading, you grant us a license to display and distribute it on our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Contact</h2>
            <p className="text-[#a0a0a0]">
              For questions about these terms, please contact us at contact.wallerstedt@gmail.com.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
