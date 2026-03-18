import {
  Mountain,
  Building2,
  Crown,
  Users,
  Calendar,
  Shield,
  MapPin,
  Utensils,
  Bus,
} from 'lucide-react';

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-24 text-white sm:py-32">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzMuMzEzIDAgNiAyLjY4NyA2IDZzLTIuNjg3IDYtNiA2LTYtMi42ODctNi02IDIuNjg3LTYgNi02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Corporate Retreats,{' '}
          <span className="text-blue-400">Elevated</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          We build high-impact, zero-stress corporate retreats for teams of
          15–200. You focus on your people - we handle everything else.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-4">
          <a
            href="#packages"
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
          >
            View Packages
          </a>
          <a
            href="#contact"
            className="rounded-lg border border-slate-600 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-400 hover:text-white"
          >
            Talk to Our AI Planner
          </a>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: MapPin,
      title: 'Vetted Venues',
      description:
        'Curated locations across Austin, Texas Hill Country, Colorado Rockies, and the Coastal Southeast.',
    },
    {
      icon: Utensils,
      title: 'Full-Service Catering',
      description:
        'Every dietary need covered - vegetarian, vegan, gluten-free, kosher, halal, and allergy-specific menus.',
    },
    {
      icon: Bus,
      title: 'Logistics Handled',
      description:
        'Round-trip transport, AV equipment, event coordination - we manage every detail so you don\'t have to.',
    },
    {
      icon: Users,
      title: 'Teams of 15–200',
      description:
        'From intimate executive retreats to company-wide offsites, we scale to your group size.',
    },
    {
      icon: Calendar,
      title: 'Flexible Booking',
      description:
        'Book as little as 6 weeks out. Rescheduling is free with 21+ days notice.',
    },
    {
      icon: Shield,
      title: 'Weather Guarantee',
      description:
        'Every nature venue has indoor backup. We carry event insurance and always have a Plan B.',
    },
  ];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
          Everything You Need, Nothing You Don&apos;t
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
          200+ events delivered since 2019. Austin-headquartered, nationwide
          reach.
        </p>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-xl border p-6">
              <feature.icon className="h-8 w-8 text-blue-600" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Packages() {
  const packages = [
    {
      name: 'Urban Package',
      price: '$300',
      unit: 'per person',
      icon: Building2,
      color: 'blue',
      features: [
        'Downtown venue rental',
        'Full catering (breakfast, lunch, snacks)',
        'Standard AV equipment',
        'Dedicated event coordinator',
      ],
      vibe: 'Fast-paced, modern, focused on workshops',
      minGroup: 15,
    },
    {
      name: 'Nature Package',
      price: '$450',
      unit: 'per person',
      icon: Mountain,
      color: 'emerald',
      features: [
        'Scenic venue (within 2hrs of city)',
        'Full catering',
        'Round-trip coach transport',
        'Guided team-building activity',
        'Dedicated event coordinator',
      ],
      vibe: 'Disconnected, reflective, team-bonding',
      minGroup: 15,
      popular: true,
    },
    {
      name: 'Executive Package',
      price: '$15,000',
      unit: 'flat rate',
      icon: Crown,
      color: 'amber',
      features: [
        'Luxury private estate venue',
        'Private chef & premium bar',
        'VIP transport',
        'Bespoke itinerary',
        'Up to 15 people',
      ],
      vibe: 'High-end, exclusive, reward-focused',
      minGroup: null,
    },
  ];

  return (
    <section id="packages" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
          Retreat Packages
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
          All packages can be customized with add-ons. Our events team will work
          with you on a tailored quote.
        </p>
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {packages.map((pkg) => (
            <div
              key={pkg.name}
              className={`relative rounded-xl border bg-white p-8 shadow-sm ${
                pkg.popular ? 'ring-2 ring-emerald-500' : ''
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                </div>
              )}
              <pkg.icon className={`h-8 w-8 text-${pkg.color}-600`} />
              <h3 className="mt-4 text-xl font-bold text-slate-900">
                {pkg.name}
              </h3>
              <div className="mt-4">
                <span className="text-3xl font-bold text-slate-900">
                  {pkg.price}
                </span>
                <span className="ml-1 text-sm text-slate-500">
                  {pkg.unit}
                </span>
              </div>
              {pkg.minGroup && (
                <p className="mt-1 text-xs text-slate-400">
                  Minimum {pkg.minGroup} people
                </p>
              )}
              <p className="mt-4 text-sm italic text-slate-500">{pkg.vibe}</p>
              <ul className="mt-6 space-y-3">
                {pkg.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-slate-700"
                  >
                    <span className="mt-0.5 text-emerald-500">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonial() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <blockquote className="text-xl italic leading-relaxed text-slate-700">
          &ldquo;Elevate Offsites handled everything - venue, catering,
          transport, activities. Our team came back more aligned and energized
          than after any retreat we&apos;ve done in-house. Worth every
          penny.&rdquo;
        </blockquote>
        <div className="mt-6">
          <p className="font-semibold text-slate-900">Maria Gonzalez</p>
          <p className="text-sm text-slate-500">
            VP of People, Meridian Technologies
          </p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer
      id="contact"
      className="relative border-t bg-slate-900 py-12 text-slate-400"
    >
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <p className="font-semibold text-white">Elevate Offsites</p>
            <p className="mt-1 text-sm">
              Austin, Texas · Founded 2019 · 200+ events delivered
            </p>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} Elevate Offsites. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <Packages />
      <Testimonial />
      <Footer />
    </>
  );
}
