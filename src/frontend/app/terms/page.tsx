import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen relative p-4">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1599045118108-bf9954418b76?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
        }}
      />
      {/* Black overlay */}
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Header: centered title/subtitle with left-positioned back button */}
        <div className="relative mb-8">
          <Link href="/register" className="absolute left-0 top-1/2 -translate-y-1/2">
            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Registration
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Terms and Conditions</h1>
            <p className="text-white">NHS TMIS Authentication System</p>
          </div>
        </div>

        {/* Glass card: translucent, blurred, subtle border and rounded corners */}
        <Card className="w-full bg-white/8 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-8">
          <CardHeader>
            <CardTitle className="text-white">NHS TMIS Terms of Service</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-white max-w-none bg-transparent">
            <div className="space-y-6">
              <section>
                <h3 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h3>
                <p>
                  By accessing and using the NHS TMIS (Trust Management Information System) authentication platform, you
                  agree to be bound by these Terms and Conditions and all applicable laws and regulations.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-3">2. Security and Authentication</h3>
                <p>
                  Our system employs Elliptic Curve Cryptography (ECC) for secure authentication. You are responsible
                  for maintaining the confidentiality of your private key and for all activities that occur under your
                  account.
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-white">
                  <li>Keep your private key secure and never share it with others</li>
                  <li>Report any suspected unauthorized access immediately</li>
                  <li>Use strong passwords and enable multi-factor authentication when required</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-3">3. Data Protection and Privacy</h3>
                <p>
                  We are committed to protecting your personal information in accordance with UK data protection laws,
                  including the Data Protection Act 2018 and UK GDPR.
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-white">
                  <li>Personal data is processed lawfully and transparently</li>
                  <li>Data is collected for specified, explicit, and legitimate purposes</li>
                  <li>We implement appropriate technical and organizational security measures</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-3">4. Acceptable Use</h3>
                <p>You agree to use the NHS TMIS system only for authorized healthcare purposes and will not:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-white">
                  <li>Attempt to gain unauthorized access to any part of the system</li>
                  <li>Use the system for any unlawful or prohibited purpose</li>
                  <li>Interfere with or disrupt the system's operation</li>
                  <li>Share your authentication credentials with unauthorized persons</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-3">5. System Availability</h3>
                <p>
                  While we strive to maintain system availability, we cannot guarantee uninterrupted access. Scheduled
                  maintenance and emergency updates may temporarily affect system availability.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-3">6. Compliance</h3>
                <p>
                  This system complies with NHS Digital security standards and healthcare data protection requirements.
                  Users must adhere to all applicable NHS policies and procedures.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-3">7. Contact Information</h3>
                <p>For questions about these terms or the NHS TMIS system, please contact:</p>
                <div className="bg-white/6 p-4 rounded-lg mt-2">
                  <p>
                    <strong className="text-white font-semibold">NHS TMIS Support</strong>
                  </p>
                  <p className="text-white">Email: support@nhs-tmis.uk</p>
                  <p className="text-white">Phone: 0300 123 4567</p>
                  <p className="text-white">Available: Monday-Friday, 8:00 AM - 6:00 PM</p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-3">8. Updates to Terms</h3>
                <p>
                  These terms may be updated periodically. Users will be notified of significant changes and continued
                  use of the system constitutes acceptance of updated terms.
                </p>
              </section>

              <div className="mt-8 p-4 bg-white/6 rounded-lg">
                <p className="text-sm text-white">
                  <strong>Last Updated:</strong> {new Date().toLocaleDateString("en-GB")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
