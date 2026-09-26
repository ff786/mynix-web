import NewsletterForm from "@/components/newsletter/NewsletterForm";
import Eyebrow from "@/components/ui/text/Eyebrow";
import Reveal from "@/components/ui/text/Reveal";
import RevealText from "@/components/ui/text/RevealText";

/** Home-page newsletter sign-up, between About Us and the footer. */
export default function NewsletterSection() {
  return (
    <section
      id="newsletter"
      aria-labelledby="newsletter-title"
      data-theme="dark"
      data-section-bg="#050505"
      className="scroll-mt-[72px] px-6 pb-8 pt-28 sm:px-10 sm:pt-40"
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <Eyebrow className="mb-6">Newsletter</Eyebrow>
        <RevealText
          id="newsletter-title"
          text="Stay in the know."
          className="text-4xl font-semibold uppercase leading-[0.92] tracking-tighter text-ink/90 sm:text-6xl"
        />
        <Reveal as="p" delay={0.25} className="mt-6 max-w-md leading-relaxed text-ink/60">
          New arrivals, restocks and tools worth knowing about — occasional emails from MYNIX, never spam.
        </Reveal>
        <Reveal delay={0.4} className="mt-10 w-full max-w-lg">
          <NewsletterForm />
        </Reveal>
      </div>
    </section>
  );
}
