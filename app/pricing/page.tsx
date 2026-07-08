"use client";

import Navbar from "../components/Navbar";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "Start exploring",
    description:
      "For users who want to discover curated prompts and test basic prompt optimization.",
    badge: "Acquisition",
    highlighted: false,
    features: [
      "5–10 daily prompt optimizations",
      "Access to public prompt library",
      "Basic prompt revision",
      "1–2 optimized variants",
      "Short explanation",
      "Limited history",
      "Community prompt trends",
    ],
    button: "Start Free",
    href: "/prompt-optimizer",
  },
  {
    name: "Premium",
    price: "$12–19",
    period: "per month",
    description:
      "For creators, developers, marketers, and professionals who want deeper prompt intelligence.",
    badge: "Recommended",
    highlighted: true,
    features: [
      "Unlimited prompt optimizations",
      "Advanced multi-variant revisions",
      "Deep why-it-works analysis",
      "Personal prompt memory",
      "Style adaptation",
      "Full analytics dashboard",
      "Model-specific prompt insights",
      "Export bundles",
      "JSON / YAML formatting",
      "Priority discovery",
      "Ad-free experience",
    ],
    button: "Upgrade Preview",
    href: "/prompt-optimizer",
  },
  {
    name: "Team",
    price: "Custom",
    period: "for companies",
    description:
      "For teams that need private prompt knowledge, admin controls, and company-specific optimization.",
    badge: "Enterprise",
    highlighted: false,
    features: [
      "Team workspace",
      "Private prompt corpus",
      "Admin controls",
      "SSO preview",
      "Custom prompt training",
      "Company-specific analytics",
      "API access",
      "Priority support",
      "Private discovery sources",
    ],
    button: "Contact Sales",
    href: "/dashboard",
  },
];

const comparison = [
  {
    feature: "Daily optimizations",
    free: "Limited",
    premium: "Unlimited",
    team: "Custom",
  },
  {
    feature: "Prompt library",
    free: "Public library",
    premium: "Advanced library",
    team: "Private + public",
  },
  {
    feature: "Prompt variants",
    free: "1–2 variants",
    premium: "Multiple variants",
    team: "Custom variants",
  },
  {
    feature: "Prompt memory",
    free: "Limited",
    premium: "Personal memory",
    team: "Team memory",
  },
  {
    feature: "Analytics",
    free: "Basic",
    premium: "Full dashboard",
    team: "Admin analytics",
  },
  {
    feature: "API access",
    free: "No",
    premium: "Included",
    team: "Advanced",
  },
  {
    feature: "Custom training",
    free: "No",
    premium: "No",
    team: "Available",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-100 px-6 py-6 text-slate-950 transition dark:bg-[#030712] dark:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-180px] top-[-160px] h-[520px] w-[520px] rounded-full bg-blue-500/25 blur-[140px]" />
        <div className="absolute right-[-180px] top-[120px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/20 blur-[140px]" />
        <div className="absolute bottom-[-180px] left-[30%] h-[520px] w-[520px] rounded-full bg-cyan-400/20 blur-[140px]" />
      </div>

      <section className="relative mx-auto max-w-7xl">
        <Navbar />

        <div className="relative mb-8 overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white/80 p-8 text-center shadow-2xl shadow-slate-300/30 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
          <div className="absolute right-[-100px] top-[-100px] h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute bottom-[-120px] left-[35%] h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/60" />
              Free vs Premium Accounts
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
              Flexible plans for prompt intelligence.
            </h1>

            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Wordsly.Ai can start with a free discovery layer, then grow into a
              premium platform with unlimited optimization, personal memory,
              analytics, API access, and team features.
            </p>
          </div>
        </div>

        <div className="mb-10 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-[2.5rem] border p-6 shadow-2xl backdrop-blur-2xl transition hover:-translate-y-1 ${
                plan.highlighted
                  ? "border-blue-500 bg-slate-950 text-white shadow-blue-500/20"
                  : "border-slate-200 bg-white/80 shadow-slate-300/20 dark:border-white/10 dark:bg-white/5 dark:shadow-black/20"
              }`}
            >
              <div className="mb-5 flex items-center justify-between">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    plan.highlighted
                      ? "bg-blue-500 text-white"
                      : "bg-blue-500/10 text-blue-500"
                  }`}
                >
                  {plan.badge}
                </span>

                {plan.highlighted && (
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">
                    Best Value
                  </span>
                )}
              </div>

              <h2 className="text-3xl font-black">{plan.name}</h2>

              <div className="mt-5 flex items-end gap-2">
                <p className="text-5xl font-black">{plan.price}</p>
                <p
                  className={`pb-2 text-sm font-bold ${
                    plan.highlighted
                      ? "text-slate-400"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {plan.period}
                </p>
              </div>

              <p
                className={`mt-5 text-sm leading-7 ${
                  plan.highlighted
                    ? "text-slate-300"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {plan.description}
              </p>

              <a
                href={plan.href}
                className={`mt-6 block rounded-2xl px-6 py-4 text-center text-sm font-black transition hover:-translate-y-1 ${
                  plan.highlighted
                    ? "bg-white text-slate-950 hover:bg-blue-50"
                    : "bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600"
                }`}
              >
                {plan.button}
              </a>

              <div className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex gap-3">
                    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">
                      ✓
                    </span>

                    <p
                      className={`text-sm leading-6 ${
                        plan.highlighted
                          ? "text-slate-300"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {feature}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-[2.5rem] border border-slate-200 bg-white/80 p-6 shadow-2xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <div className="mb-6">
            <h2 className="text-3xl font-black">Feature Comparison</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              A product-ready comparison for the free, premium, and team account
              strategy.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10">
            <div className="grid grid-cols-4 bg-slate-950 text-white">
              <div className="p-4 text-sm font-black">Feature</div>
              <div className="p-4 text-sm font-black">Free</div>
              <div className="p-4 text-sm font-black">Premium</div>
              <div className="p-4 text-sm font-black">Team</div>
            </div>

            {comparison.map((row) => (
              <div
                key={row.feature}
                className="grid grid-cols-4 border-t border-slate-200 bg-white text-sm dark:border-white/10 dark:bg-slate-950/60"
              >
                <div className="p-4 font-black">{row.feature}</div>
                <div className="p-4 text-slate-600 dark:text-slate-400">
                  {row.free}
                </div>
                <div className="p-4 font-bold text-blue-500">
                  {row.premium}
                </div>
                <div className="p-4 text-slate-600 dark:text-slate-400">
                  {row.team}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-[2.5rem] bg-slate-950 p-8 text-center text-white shadow-2xl shadow-blue-500/20">
          <h2 className="mx-auto max-w-3xl text-4xl font-black leading-tight">
            Premium is the core revenue engine.
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            The free plan brings users and feedback. Premium unlocks deeper
            optimization, analytics, prompt memory, API access, and advanced
            exports.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="/prompt-optimizer"
              className="rounded-2xl bg-white px-7 py-4 text-center font-black text-slate-950 transition hover:bg-blue-50"
            >
              Test Optimizer
            </a>

            <a
              href="/dashboard"
              className="rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-center font-black text-white transition hover:bg-white/20"
            >
              Open Dashboard
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}