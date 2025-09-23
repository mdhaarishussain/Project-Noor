export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-lg mb-6">
          Last updated: {new Date().toLocaleDateString()}
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Information We Collect</h2>
        <p>
          Bondhu collects information you provide directly to us, such as when you create an account, 
          complete your personality assessment, or interact with our AI companion.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">How We Use Your Information</h2>
        <p>
          We use the information we collect to provide, maintain, and improve our services, 
          including personalizing your experience with our AI mental health companion.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Information Sharing</h2>
        <p>
          We do not sell, trade, or otherwise transfer your personal information to third parties 
          without your consent, except as described in this privacy policy.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at privacy@bondhu.ai
        </p>
      </div>
    </div>
  )
}