import { createFileRoute } from "@tanstack/react-router";
import { InfoPageLayout } from "@/components/InfoPageLayout";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <InfoPageLayout>
      <h1 className="mb-2 text-3xl font-bold tracking-wide uppercase">
        Privacy Policy
      </h1>
      <p className="text-muted-foreground mb-12">Last Updated: January 2026</p>

      <div className="space-y-10">
        <section>
          <h2 className="mb-4 text-xl font-semibold">1. Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            Miso is committed to protecting your privacy. This privacy policy
            explains how we collect, use, and safeguard your information when
            you use our food decision assistance service.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">
            2. Information We Collect
          </h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            We collect information you provide directly to us:
          </p>
          <ul className="text-muted-foreground list-disc space-y-2 pl-6">
            <li>Chat messages and conversations with our AI assistant</li>
            <li>Food preferences and dietary restrictions you share</li>
            <li>Account information (when authentication is enabled)</li>
            <li>Usage data and analytics to improve the service</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">
            3. How We Use Your Information
          </h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            Your information is used to:
          </p>
          <ul className="text-muted-foreground list-disc space-y-2 pl-6">
            <li>Provide personalized food recommendations</li>
            <li>Improve our AI responses and service quality</li>
            <li>Maintain and secure the application</li>
            <li>Communicate with you about updates or issues</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">
            4. Third-Party Services
          </h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            We use the following third-party services to provide our service:
          </p>
          <ul className="text-muted-foreground list-disc space-y-2 pl-6">
            <li>Anthropic (Claude AI) for chat responses</li>
            <li>Spoonacular API for recipe and restaurant data</li>
          </ul>
          <p className="text-muted-foreground mt-4 leading-relaxed">
            Each of these services has their own privacy policies governing how
            they handle data.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">5. Data Retention</h2>
          <p className="text-muted-foreground leading-relaxed">
            We retain your chat history and preferences for as long as your
            account is active or as needed to provide you services. You can
            request deletion of your data at any time.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">6. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            Questions about this policy? Contact us at{" "}
            <span className="text-primary">hello.miso.app@gmail.com</span>
          </p>
        </section>
      </div>
    </InfoPageLayout>
  );
}
