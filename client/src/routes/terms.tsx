import { createFileRoute } from "@tanstack/react-router";
import { InfoPageLayout } from "@/components/InfoPageLayout";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
  return (
    <InfoPageLayout>
      <h1 className="mb-2 text-3xl font-bold tracking-wide uppercase">
        Terms of Service
      </h1>
      <p className="text-muted-foreground mb-12">Last Updated: January 2026</p>

      <div className="space-y-10">
        <section>
          <h2 className="mb-4 text-xl font-semibold">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing or using Miso, you agree to be bound by these Terms of
            Service. If you do not agree to these terms, please do not use the
            service.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">2. Service Description</h2>
          <p className="text-muted-foreground leading-relaxed">
            Miso is an AI-powered assistant that helps users decide what to eat.
            We provide food suggestions, recipes, and restaurant recommendations
            based on your preferences and conversations with our AI personas.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">3. Acceptable Use</h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            You agree not to:
          </p>
          <ul className="text-muted-foreground list-disc space-y-2 pl-6">
            <li>Use the service for any illegal purpose</li>
            <li>Attempt to bypass rate limits or abuse the service</li>
            <li>Share harmful, offensive, or inappropriate content</li>
            <li>Attempt to reverse engineer or exploit the service</li>
            <li>Impersonate others or misrepresent your affiliation</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">4. Disclaimers</h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            Miso provides suggestions for informational purposes only. We are
            not responsible for:
          </p>
          <ul className="text-muted-foreground list-disc space-y-2 pl-6">
            <li>
              Allergic reactions - always verify ingredients match your dietary
              needs
            </li>
            <li>
              Restaurant information accuracy - details may change without
              notice
            </li>
            <li>Recipe outcomes - results may vary based on execution</li>
            <li>
              Nutritional information - consult professionals for dietary advice
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">
            5. Limitation of Liability
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            To the maximum extent permitted by law, Miso shall not be liable for
            any indirect, incidental, special, consequential, or punitive
            damages resulting from your use of the service.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">6. Changes to Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update these terms from time to time. Continued use of Miso
            after changes constitutes acceptance of the new terms. We will
            notify users of significant changes.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">7. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            Questions about these terms? Contact us at{" "}
            <span className="text-primary">hello.miso.app@gmail.com</span>
          </p>
        </section>
      </div>
    </InfoPageLayout>
  );
}
