// Maps a page-builder block's `_type` discriminator to the widget component
// that renders it. Used by BlockRenderer (rendering) and, in the visual-editing
// phase, by registerComponents.ts (CloudCannon component re-rendering).
import Hero from '~/components/widgets/Hero.astro';
import Hero2 from '~/components/widgets/Hero2.astro';
import HeroText from '~/components/widgets/HeroText.astro';
import Note from '~/components/widgets/Note.astro';
import Features from '~/components/widgets/Features.astro';
import Features2 from '~/components/widgets/Features2.astro';
import Features3 from '~/components/widgets/Features3.astro';
import Content from '~/components/widgets/Content.astro';
import Steps from '~/components/widgets/Steps.astro';
import Steps2 from '~/components/widgets/Steps2.astro';
import Stats from '~/components/widgets/Stats.astro';
import CallToAction from '~/components/widgets/CallToAction.astro';
import FAQs from '~/components/widgets/FAQs.astro';
import Pricing from '~/components/widgets/Pricing.astro';
import Testimonials from '~/components/widgets/Testimonials.astro';
import Brands from '~/components/widgets/Brands.astro';
import Contact from '~/components/widgets/Contact.astro';
import BlogLatestPosts from '~/components/widgets/BlogLatestPosts.astro';

export const componentMap: Record<string, unknown> = {
  hero: Hero,
  hero2: Hero2,
  hero_text: HeroText,
  note: Note,
  features: Features,
  features2: Features2,
  features3: Features3,
  content: Content,
  steps: Steps,
  steps2: Steps2,
  stats: Stats,
  call_to_action: CallToAction,
  faqs: FAQs,
  pricing: Pricing,
  testimonials: Testimonials,
  brands: Brands,
  contact: Contact,
  blog_latest_posts: BlogLatestPosts,
};
