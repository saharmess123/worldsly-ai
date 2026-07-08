"use client";

import Navbar from "../components/Navbar";

type Status = "Current" | "Next" | "Planned" | "Future";

type BackendLayer = {
  id: number;
  title: string;
  icon: string;
  status: Status;
  description: string;
  responsibilities: string[];
};

type ApiRoute = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  route: string;
  purpose: string;
  phase: string;
};

type DatabaseTable = {
  name: string;
  purpose: string;
  fields: string[];
};

const backendLayers: BackendLayer[] = [
  {
    id: 1,
    title: "Frontend MVP",
    icon: "🖥️",
    status: "Current",
    description:
      "The current Wordsly.Ai app is a frontend MVP built with Next.js, React, TypeScript, Tailwind CSS, and localStorage.",
    responsibilities: [
      "Display the product interface",
      "Show the full product workflow",
      "Simulate prompt optimization and scoring",
      "Save demo history, feedback, and settings locally",
    ],
  },
  {
    id: 2,
    title: "AI Optimization Engine",
    icon: "🤖",
    status: "Next",
    description:
      "This is the next important layer. It will replace simulated optimization with a real AI model.",
    responsibilities: [
      "Optimize user prompts using a real AI API",
      "Score original and improved prompts",
      "Generate prompt variants",
      "Explain why the improved prompt works better",
      "Support text, image, video, code, agents, marketing, and research prompts",
    ],
  },
  {
    id: 3,
    title: "Backend API",
    icon: "🔌",
    status: "Next",
    description:
      "The backend API will connect the frontend with AI services, database storage, authentication, and future discovery systems.",
    responsibilities: [
      "Receive requests from the frontend",
      "Validate user input",
      "Call AI services",
      "Save and read database records",
      "Return structured responses to the app",
    ],
  },
  {
    id: 4,
    title: "Database",
    icon: "🗄️",
    status: "Planned",
    description:
      "The database will replace localStorage and store real users, prompt history, feedback, sources, curation records, and corpus prompts.",
    responsibilities: [
      "Store users",
      "Store prompt optimizations",
      "Store feedback",
      "Store source data",
      "Store discovered prompts",
      "Store curated corpus prompts",
      "Store future training signals",
    ],
  },
  {
    id: 5,
    title: "Authentication",
    icon: "🔐",
    status: "Planned",
    description:
      "Authentication will allow users to create accounts, save private history, access premium features, and use API keys.",
    responsibilities: [
      "User signup",
      "User login",
      "Session management",
      "Protect private user data",
      "Connect user data to database records",
      "Support premium and team accounts later",
    ],
  },
  {
    id: 6,
    title: "Discovery Pipeline",
    icon: "🌐",
    status: "Future",
    description:
      "The real discovery pipeline will search sources like Reddit, X, GitHub, blogs, research papers, and prompt communities.",
    responsibilities: [
      "Scan trusted sources",
      "Extract prompt candidates",
      "Score source credibility",
      "Detect duplicates",
      "Send good candidates to curation",
    ],
  },
  {
    id: 7,
    title: "PromptMaster Training Layer",
    icon: "🧠",
    status: "Future",
    description:
      "The future training layer will use curated prompts, feedback, and successful optimizations to improve PromptMaster over time.",
    responsibilities: [
      "Prepare training datasets",
      "Use curated prompts as examples",
      "Use feedback as learning signals",
      "Train or fine-tune future prompt models",
      "Improve optimization quality over time",
    ],
  },
];

const apiRoutes: ApiRoute[] = [
  {
    method: "POST",
    route: "/api/optimize",
    purpose:
      "Receives a user prompt and returns improved prompt, variants, scores, patterns, and explanation.",
    phase: "Mock first, real AI later",
  },
  {
    method: "POST",
    route: "/api/score",
    purpose:
      "Scores a prompt based on clarity, structure, context, constraints, and use-case quality.",
    phase: "Mock first, real AI later",
  },
  {
    method: "GET",
    route: "/api/history",
    purpose: "Returns saved optimization history for the logged-in user.",
    phase: "Database phase",
  },
  {
    method: "POST",
    route: "/api/history",
    purpose: "Saves a new prompt optimization to the database.",
    phase: "Database phase",
  },
  {
    method: "GET",
    route: "/api/feedback",
    purpose: "Returns feedback records and analytics.",
    phase: "Database phase",
  },
  {
    method: "POST",
    route: "/api/feedback",
    purpose: "Saves useful or needs-work feedback for an optimization.",
    phase: "Database phase",
  },
  {
    method: "GET",
    route: "/api/sources",
    purpose: "Returns discovery sources such as Reddit, X, GitHub, and blogs.",
    phase: "Discovery phase",
  },
  {
    method: "POST",
    route: "/api/sources",
    purpose: "Creates or updates a discovery source.",
    phase: "Discovery phase",
  },
  {
    method: "GET",
    route: "/api/discovery",
    purpose: "Returns discovered prompt candidates.",
    phase: "Discovery phase",
  },
  {
    method: "POST",
    route: "/api/curation/review",
    purpose: "Approves or rejects a discovered prompt.",
    phase: "Curation phase",
  },
  {
    method: "GET",
    route: "/api/corpus",
    purpose: "Returns approved corpus prompts.",
    phase: "Corpus phase",
  },
  {
    method: "POST",
    route: "/api/corpus",
    purpose: "Adds an approved prompt to the corpus.",
    phase: "Corpus phase",
  },
];

const databaseTables: DatabaseTable[] = [
  {
    name: "users",
    purpose: "Stores user accounts and plan information.",
    fields: ["id", "name", "email", "password_hash", "plan", "created_at"],
  },
  {
    name: "user_settings",
    purpose: "Stores user preferences currently saved in localStorage.",
    fields: [
      "id",
      "user_id",
      "preferred_model",
      "optimization_depth",
      "default_goal",
      "output_format",
      "personal_style",
      "discovery_focus",
    ],
  },
  {
    name: "optimizations",
    purpose: "Stores every prompt optimization made by users.",
    fields: [
      "id",
      "user_id",
      "original_prompt",
      "improved_prompt",
      "category",
      "model",
      "goal",
      "depth",
      "output_format",
      "original_score",
      "improved_score",
      "created_at",
    ],
  },
  {
    name: "feedback",
    purpose: "Stores useful and needs-work feedback signals.",
    fields: [
      "id",
      "user_id",
      "optimization_id",
      "rating",
      "comment",
      "created_at",
    ],
  },
  {
    name: "sources",
    purpose: "Stores discovery sources.",
    fields: [
      "id",
      "name",
      "type",
      "url",
      "credibility",
      "status",
      "last_scan_at",
      "scan_frequency",
    ],
  },
  {
    name: "discovered_prompts",
    purpose: "Stores prompt candidates found by the discovery pipeline.",
    fields: [
      "id",
      "source_id",
      "title",
      "prompt",
      "category",
      "model",
      "quality_score",
      "source_url",
      "status",
      "discovered_at",
    ],
  },
  {
    name: "curation_reviews",
    purpose: "Stores approval or rejection decisions.",
    fields: [
      "id",
      "discovered_prompt_id",
      "reviewer_id",
      "status",
      "risk_level",
      "review_reason",
      "created_at",
    ],
  },
  {
    name: "corpus_prompts",
    purpose: "Stores approved prompts and intelligence patterns.",
    fields: [
      "id",
      "title",
      "prompt",
      "improved_version",
      "category",
      "model",
      "quality_score",
      "patterns",
      "metadata",
      "created_at",
    ],
  },
  {
    name: "training_signals",
    purpose: "Stores future PromptMaster training data signals.",
    fields: [
      "id",
      "source_type",
      "source_id",
      "signal_type",
      "score",
      "metadata",
      "created_at",
    ],
  },
  {
    name: "api_keys",
    purpose: "Stores API keys for premium, team, and enterprise access.",
    fields: [
      "id",
      "user_id",
      "key_hash",
      "label",
      "usage_limit",
      "created_at",
      "last_used_at",
    ],
  },
];

const phases = [
  {
    number: "01",
    title: "Create mock API routes",
    description:
      "Move simulated logic from frontend components into Next.js API routes. The UI will call API routes even if they still return mock results.",
  },
  {
    number: "02",
    title: "Connect real AI",
    description:
      "Replace mock optimization with a real AI model for prompt improvement and scoring.",
  },
  {
    number: "03",
    title: "Add database",
    description:
      "Replace localStorage with real persistent database tables.",
  },
  {
    number: "04",
    title: "Add authentication",
    description:
      "Create signup, login, sessions, private history, and account-based settings.",
  },
  {
    number: "05",
    title: "Build discovery pipeline",
    description:
      "Start real prompt discovery from selected sources and send candidates to curation.",
  },
  {
    number: "06",
    title: "Prepare training data",
    description:
      "Use curated corpus prompts, successful optimizations, and feedback to prepare PromptMaster training datasets.",
  },
];

function getStatusClass(status: Status) {
  if (status === "Current") return "bg-emerald-500/10 text-emerald-500";
  if (status === "Next") return "bg-blue-500/10 text-blue-500";
  if (status === "Planned") return "bg-amber-500/10 text-amber-500";
  return "bg-fuchsia-500/10 text-fuchsia-500";
}

function getMethodClass(method: ApiRoute["method"]) {
  if (method === "GET") return "bg-emerald-500/10 text-emerald-500";
  if (method === "POST") return "bg-blue-500/10 text-blue-500";
  if (method === "PUT") return "bg-amber-500/10 text-amber-500";
  return "bg-red-500/10 text-red-500";
}

export default function BackendPlanPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-100 px-6 py-6 text-slate-950 transition dark:bg-[#030712] dark:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-180px] top-[-160px] h-[520px] w-[520px] rounded-full bg-blue-500/25 blur-[140px]" />
        <div className="absolute right-[-180px] top-[120px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/20 blur-[140px]" />
        <div className="absolute bottom-[-180px] left-[30%] h-[520px] w-[520px] rounded-full bg-cyan-400/20 blur-[140px]" />
      </div>

      <section className="relative mx-auto max-w-7xl">
        <Navbar />

        <div className="relative mb-8 overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white/80 p-8 shadow-2xl shadow-slate-300/30 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
          <div className="absolute right-[-100px] top-[-100px] h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute bottom-[-120px] left-[30%] h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/60" />
              Backend Plan
            </div>

            <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
              Move Wordsly.Ai from frontend simulation to a real AI-powered
              product.
            </h1>

            <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              The frontend MVP already demonstrates the full product flow. The
              next phase is building the real engine: AI API, backend routes,
              database, authentication, discovery pipeline, corpus storage, and
              future PromptMaster training data.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href="/admin"
                className="rounded-2xl bg-blue-500 px-6 py-4 text-center font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
              >
                Open Admin
              </a>

              <a
                href="/architecture"
                className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
              >
                View Architecture
              </a>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-4">
          <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <p className="text-sm font-black text-slate-500">Current State</p>
            <h3 className="mt-2 text-4xl font-black">Frontend MVP</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              UI and simulated logic are ready.
            </p>
          </div>

          <div className="rounded-[2rem] border border-blue-500/20 bg-blue-500/10 p-6 shadow-xl shadow-blue-500/10 backdrop-blur-2xl">
            <p className="text-sm font-black text-blue-600 dark:text-blue-300">
              Next Step
            </p>
            <h3 className="mt-2 text-4xl font-black">AI API</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              Real optimization and scoring.
            </p>
          </div>

          <div className="rounded-[2rem] border border-amber-500/20 bg-amber-500/10 p-6 shadow-xl shadow-amber-500/10 backdrop-blur-2xl">
            <p className="text-sm font-black text-amber-600 dark:text-amber-300">
              Required
            </p>
            <h3 className="mt-2 text-4xl font-black">Database</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              Replace localStorage.
            </p>
          </div>

          <div className="rounded-[2rem] border border-fuchsia-500/20 bg-fuchsia-500/10 p-6 shadow-xl shadow-fuchsia-500/10 backdrop-blur-2xl">
            <p className="text-sm font-black text-fuchsia-600 dark:text-fuchsia-300">
              Future
            </p>
            <h3 className="mt-2 text-4xl font-black">Training</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              PromptMaster learning loop.
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-[2.5rem] border border-slate-200 bg-white/80 p-7 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <h2 className="text-3xl font-black">Real Engine Layers</h2>

          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600 dark:text-slate-400">
            This is the technical roadmap for turning the frontend MVP into a
            real production system.
          </p>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {backendLayers.map((layer) => (
              <div
                key={layer.id}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-slate-950/60"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-3 text-4xl">{layer.icon}</div>
                    <h3 className="text-2xl font-black">{layer.title}</h3>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClass(
                      layer.status
                    )}`}
                  >
                    {layer.status}
                  </span>
                </div>

                <p className="text-sm leading-7 text-slate-600 dark:text-slate-400">
                  {layer.description}
                </p>

                <div className="mt-5">
                  <h4 className="font-black">Responsibilities</h4>
                  <div className="mt-3 space-y-2">
                    {layer.responsibilities.map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8 rounded-[2.5rem] border border-slate-200 bg-white/80 p-7 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <h2 className="text-3xl font-black">Suggested Database Schema</h2>

          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600 dark:text-slate-400">
            These tables would replace localStorage and support real users,
            prompt optimization, feedback, discovery, curation, corpus, and
            future training data.
          </p>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {databaseTables.map((table) => (
              <div
                key={table.name}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-slate-950/60"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-2xl font-black">{table.name}</h3>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white dark:bg-white dark:text-slate-950">
                    table
                  </span>
                </div>

                <p className="text-sm leading-7 text-slate-600 dark:text-slate-400">
                  {table.purpose}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {table.fields.map((field) => (
                    <span
                      key={field}
                      className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-500"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8 rounded-[2.5rem] border border-slate-200 bg-white/80 p-7 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <h2 className="text-3xl font-black">API Route Plan</h2>

          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600 dark:text-slate-400">
            The first implementation can use mock API routes, then later replace
            mock responses with real AI calls and database operations.
          </p>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10">
            <div className="grid grid-cols-[90px_1fr_160px] bg-slate-950 px-5 py-4 text-sm font-black text-white">
              <div>Method</div>
              <div>Route & Purpose</div>
              <div>Phase</div>
            </div>

            {apiRoutes.map((api) => (
              <div
                key={`${api.method}-${api.route}`}
                className="grid grid-cols-[90px_1fr_160px] gap-4 border-t border-slate-200 bg-white px-5 py-4 text-sm dark:border-white/10 dark:bg-slate-950/60"
              >
                <div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${getMethodClass(
                      api.method
                    )}`}
                  >
                    {api.method}
                  </span>
                </div>

                <div>
                  <p className="font-black">{api.route}</p>
                  <p className="mt-1 leading-6 text-slate-600 dark:text-slate-400">
                    {api.purpose}
                  </p>
                </div>

                <div>
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">
                    {api.phase}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8 rounded-[2.5rem] border border-slate-200 bg-white/80 p-7 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <h2 className="text-3xl font-black">Development Phases</h2>

          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600 dark:text-slate-400">
            Recommended order for building the real system safely.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {phases.map((phase) => (
              <div
                key={phase.number}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-slate-950/60"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 text-xl font-black text-white">
                  {phase.number}
                </div>

                <h3 className="text-xl font-black">{phase.title}</h3>

                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                  {phase.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2.5rem] bg-slate-950 p-8 text-center text-white shadow-2xl shadow-blue-500/20">
          <h2 className="mx-auto max-w-3xl text-4xl font-black leading-tight">
            Recommended next move: mock API routes first, then real AI.
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            The cleanest transition is to move the optimizer logic from the
            frontend into API routes. After that, the mock API can be replaced
            with a real AI model without redesigning the UI.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="/admin"
              className="rounded-2xl bg-white px-7 py-4 text-center font-black text-slate-950 transition hover:bg-blue-50"
            >
              Admin Control
            </a>

            <a
              href="/prompt-optimizer"
              className="rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-center font-black text-white transition hover:bg-white/20"
            >
              Test Optimizer
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}