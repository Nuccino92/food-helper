import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPageLayout } from "@/components/InfoPageLayout";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <InfoPageLayout>
      <h1 className="mb-2 text-3xl font-bold uppercase tracking-wide">
        How Miso Works
      </h1>
      <p className="mb-12 text-lg text-muted-foreground">
        Your AI-powered guide for when you're stuck on what to eat.
      </p>

      <div className="space-y-10">
        <section>
          <h2 className="mb-4 text-xl font-semibold">The Problem We Solve</h2>
          <p className="text-muted-foreground leading-relaxed">
            You know the feeling: it's dinner time, everyone's hungry, and no
            one can decide what to eat. You scroll through delivery apps,
            nothing sounds good. You open the fridge, close it, repeat. Miso is
            here to break that cycle.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">How It Works</h2>
          <ol className="list-decimal space-y-4 pl-6 text-muted-foreground">
            <li>
              <strong className="text-foreground">
                Tell Miso what's going on
              </strong>{" "}
              - Can't decide? Family disagreement? Just need something quick?
              Start there.
            </li>
            <li>
              <strong className="text-foreground">Answer a few questions</strong>{" "}
              - Miso will ask about your mood, cravings, dietary needs, or
              what's in your kitchen.
            </li>
            <li>
              <strong className="text-foreground">Get a recommendation</strong> -
              Once we've narrowed it down, you'll get a clear suggestion you can
              act on.
            </li>
            <li>
              <strong className="text-foreground">Execute</strong> - Whether
              you're cooking (we'll give you the recipe) or ordering out (we'll
              help find a place), Miso follows through.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">Choose Your Guide</h2>
          <p className="mb-4 text-muted-foreground leading-relaxed">
            Pick a persona that matches your vibe:
          </p>
          <ul className="list-disc space-y-3 pl-6 text-muted-foreground">
            <li>
              <strong className="text-foreground">Miso</strong> - Friendly and
              supportive, helps you work through the decision together
            </li>
            <li>
              <strong className="text-foreground">Gordon</strong> - A
              perfectionist who pushes you toward culinary excellence
            </li>
            <li>
              <strong className="text-foreground">Sancho</strong> - Zero patience
              for indecision, but gets the job done fast
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">Ready?</h2>
          <p className="text-muted-foreground leading-relaxed">
            <Link to="/" className="text-primary hover:underline">
              Go back to Miso
            </Link>{" "}
            and let's figure out what you're eating.
          </p>
        </section>
      </div>
    </InfoPageLayout>
  );
}
