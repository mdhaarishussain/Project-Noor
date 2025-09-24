export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-lg mb-6">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Acceptance of Terms</h2>
        <p>
          By accessing and using Bondhu, you accept and agree to be bound by the terms
          and provision of this agreement.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Use License</h2>
        <p>
          Permission is granted to temporarily use Bondhu for personal, non-commercial
          transitory viewing only. This is the grant of a license, not a transfer of title.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Service Description</h2>
        <p>
          Bondhu is an AI-powered mental health companion designed to provide support,
          guidance, and personalized recommendations for mental wellness.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">User Responsibilities</h2>
        <p>
          Users are responsible for maintaining the confidentiality of their account
          information and for all activities that occur under their account.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Limitation of Liability</h2>
        <p>
          Bondhu is not a substitute for professional medical advice, diagnosis, or treatment.
          Always seek the advice of qualified health providers.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Information</h2>
        <p>
          Questions about the Terms of Service should be sent to us at terms@bondhu.ai
        </p>
      </div>
    </div>
  )
}