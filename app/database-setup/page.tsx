"use client";

import Navbar from "../components/Navbar";

type DatabaseOption = {
  name: string;
  status: "Good for MVP" | "Production Ready" | "Future Option";
  description: string;
  pros: string[];
  cons: string[];
};

type DatabaseTable = {
  name: string;
  purpose: string;
  priority: "Phase 1" | "Phase 2" | "Phase 3";
  fields: string[];
};

type MigrationStep = {
  number: string;
  title: string;
  description: string;
  files: string[];
};

const databaseOptions: DatabaseOption[] = [
  {
    name: "SQLite",
    status: "Good for MVP",
    description:
      "A simple local database stored as a file. Good for testing real database logic before moving to production.",
    pros: [
      "Easy to set up",
      "No external database server needed",
      "Good for local MVP testing",
      "Fast for small projects",
    ],
    cons: [
      "Not ideal for large production SaaS",
      "Not best for many users at the same time",
      "Needs migration later if the project grows",
    ],
  },
  {
    name: "PostgreSQL",
    status: "Production Ready",
    description:
      "A strong relational database used by real SaaS products. Best long-term choice for users, prompts, feedback, corpus, and subscriptions.",
    pros: [
      "Production ready",
      "Strong data structure",
      "Good for SaaS platforms",
      "Works well with Prisma and hosted platforms",
    ],
    cons: [
      "Needs setup",
      "Needs hosting or local installation",
      "A little more complex than SQLite",
    ],
  },
  {
    name: "Supabase",
    status: "Future Option",
    description:
      "A hosted PostgreSQL platform with authentication, database, storage, and APIs. Good if the team wants faster production setup.",
    pros: [
      "Hosted PostgreSQL",
      "Built-in authentication",
      "Easy dashboard",
      "Good for fast MVP deployment",
    ],
    cons: [
      "External service dependency",
      "Free tier limits",
      "Needs account and project setup",
    ],
  },
];

const databaseTables: DatabaseTable[] = [
  {
    name: "users",
    purpose:
      "Stores user accounts. This will be needed when authentication is added.",
    priority: "Phase 2",
    fields: [
      "id",
      "name",
      "email",
      "password_hash",
      "plan",
      "role",
      "created_at",
      "updated_at",
    ],
  },
  {
    name: "user_settings",
    purpose:
      "Stores preferences that are currently saved in localStorage, such as model, goal, depth, format, and personal style.",
    priority: "Phase 2",
    fields: [
      "id",
      "user_id",
      "preferred_model",
      "optimization_depth",
      "default_goal",
      "output_format",
      "personal_style",
      "discovery_focus",
      "created_at",
      "updated_at",
    ],
  },
  {
    name: "optimizations",
    purpose:
      "Stores every prompt optimization result. This replaces mock memory and localStorage history.",
    priority: "Phase 1",
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
      "engine_status",
      "created_at",
    ],
  },
  {
    name: "feedback",
    purpose:
      "Stores useful and needs-work feedback. This replaces mock memory and localStorage feedback.",
    priority: "Phase 1",
    fields: [
      "id",
      "user_id",
      "optimization_id",
      "rating",
      "comment",
      "category",
      "model",
      "engine_status",
      "created_at",
    ],
  },
  {
    name: "sources",
    purpose:
      "Stores sources used by the future discovery pipeline, such as Reddit, X, GitHub, blogs, and research papers.",
    priority: "Phase 3",
    fields: [
      "id",
      "name",
      "type",
      "url",
      "credibility_score",
      "status",
      "last_scan_at",
      "scan_frequency",
      "created_at",
    ],
  },
  {
    name: "discovered_prompts",
    purpose:
      "Stores prompt candidates found by the future discovery system before curation.",
    priority: "Phase 3",
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
    purpose:
      "Stores approve/reject decisions for prompts before they enter the corpus.",
    priority: "Phase 3",
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
    purpose:
      "Stores approved high-quality prompts and the patterns extracted from them.",
    priority: "Phase 3",
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
    purpose:
      "Stores future PromptMaster learning signals from corpus prompts, feedback, and successful optimizations.",
    priority: "Phase 3",
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
];

const migrationSteps: MigrationStep[] = [
  {
    number: "01",
    title: "Install database tooling",
    description:
      "Install Prisma and choose SQLite first for local MVP, or PostgreSQL if the team wants production direction immediately.",
    files: ["package.json", "prisma/schema.prisma", ".env"],
  },
  {
    number: "02",
    title: "Create Prisma schema",
    description:
      "Define real database models for optimizations, feedback, users, settings, sources, corpus, and training signals.",
    files: ["prisma/schema.prisma"],
  },
  {
    number: "03",
    title: "Run database migration",
    description:
      "Create the database tables from the Prisma schema and generate the Prisma client.",
    files: ["prisma/migrations", "node_modules/.prisma/client"],
  },
  {
    number: "04",
    title: "Create database client",
    description:
      "Create a reusable Prisma client file so API routes can read and write database data.",
    files: ["app/lib/prisma.ts"],
  },
  {
    number: "05",
    title: "Update History API",
    description:
      "Replace the temporary historyStore memory array with real database create and findMany operations.",
    files: ["app/api/history/route.ts"],
  },
  {
    number: "06",
    title: "Update Feedback API",
    description:
      "Replace the temporary feedbackStore memory array with real database create and findMany operations.",
    files: ["app/api/feedback/route.ts"],
  },
  {
    number: "07",
    title: "Update Mock Database Viewer",
    description:
      "Keep the same UI, but it will now show persistent database data instead of temporary server memory.",
    files: ["app/mock-database/page.tsx"],
  },
  {
    number: "08",
    title: "Add authentication later",
    description:
      "After data persistence works, connect records to real users with signup, login, sessions, and account settings.",
    files: ["auth config", "users table", "protected routes"],
  },
];

const apiMigration = [
  {
    route: "/api/history",
    current: "Temporary memory array",
    next: "Database optimizations table",
    priority: "First",
  },
  {
    route: "/api/feedback",
    current: "Temporary memory array",
    next: "Database feedback table",
    priority: "First",
  },
  {
    route: "/api/optimize",
    current: "Mock rule-based engine",
    next: "Real AI API + save result to database",
    priority: "Second",
  },
  {
    route: "/api/score",
    current: "Mock scoring rules",
    next: "AI-based scoring or hybrid scoring",
    priority: "Second",
  },
  {
    route: "/api/sources",
    current: "Planned",
    next: "Database sources table",
    priority: "Later",
  },
  {
    route: "/api/corpus",
    current: "Planned",
    next: "Database corpus_prompts table",
    priority: "Later",
  },
];

function getStatusClass(status: DatabaseOption["status"]) {
  if (status === "Good for MVP") {
    return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  }

  if (status === "Production Ready") {
    return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  }

  return "bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20";
}

function getPriorityClass(priority: DatabaseTable["priority"]) {
  if (priority === "Phase 1") {
    return "bg-emerald-500/10 text-emerald-500";
  }

  if (priority === "Phase 2") {
    return "bg-blue-500/10 text-blue-500";
  }

  return "bg-amber-500/10 text-amber-500";
}

export default function DatabaseSetupPage() {
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
              Database Setup Plan
            </div>

            <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
              Move Wordsly.Ai from mock memory to persistent database storage.
            </h1>

            <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              The current APIs work with temporary server memory. This plan
              explains how to replace mock storage with a real database for
              prompt history, feedback, settings, users, sources, corpus, and
              future training signals.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href="/mock-database"
                className="rounded-2xl bg-blue-500 px-6 py-4 text-center font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-600"
              >
                View Mock Database
              </a>

              <a
                href="/backend-plan"
                className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
              >
                Backend Plan
              </a>

              <a
                href="/api-status"
                className="rounded-2xl border border-slate-300 bg-white/70 px-6 py-4 text-center font-black text-slate-900 shadow-lg shadow-slate-300/20 transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-black/20 dark:hover:bg-white/10"
              >
                API Status
              </a>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <p className="text-sm font-black text-slate-500">
              Current Storage
            </p>
            <h3 className="mt-2 text-4xl font-black">Mock Memory</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Data disappears after restart.
            </p>
          </div>

          <div className="rounded-[2rem] border border-blue-500/20 bg-blue-500/10 p-6 shadow-xl shadow-blue-500/10 backdrop-blur-2xl">
            <p className="text-sm font-black text-blue-600 dark:text-blue-300">
              MVP Choice
            </p>
            <h3 className="mt-2 text-4xl font-black">SQLite</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              Fast local persistence.
            </p>
          </div>

          <div className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-6 shadow-xl shadow-emerald-500/10 backdrop-blur-2xl">
            <p className="text-sm font-black text-emerald-600 dark:text-emerald-300">
              Production Choice
            </p>
            <h3 className="mt-2 text-4xl font-black">PostgreSQL</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              Best for real SaaS.
            </p>
          </div>

          <div className="rounded-[2rem] border border-fuchsia-500/20 bg-fuchsia-500/10 p-6 shadow-xl shadow-fuchsia-500/10 backdrop-blur-2xl">
            <p className="text-sm font-black text-fuchsia-600 dark:text-fuchsia-300">
              Later
            </p>
            <h3 className="mt-2 text-4xl font-black">Auth + Users</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              Private accounts and plans.
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-[2.5rem] border border-slate-200 bg-white/80 p-7 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <h2 className="text-3xl font-black">Database Options</h2>

          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600 dark:text-slate-400">
            The project can start with SQLite for local MVP persistence, then
            move to PostgreSQL or Supabase when production deployment becomes
            the priority.
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {databaseOptions.map((option) => (
              <div
                key={option.name}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-slate-950/60"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <h3 className="text-2xl font-black">{option.name}</h3>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                      option.status
                    )}`}
                  >
                    {option.status}
                  </span>
                </div>

                <p className="text-sm leading-7 text-slate-600 dark:text-slate-400">
                  {option.description}
                </p>

                <div className="mt-5">
                  <h4 className="font-black text-emerald-500">Pros</h4>
                  <div className="mt-3 space-y-2">
                    {option.pros.map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm font-semibold text-slate-700 dark:text-slate-300"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <h4 className="font-black text-amber-500">Cons</h4>
                  <div className="mt-3 space-y-2">
                    {option.cons.map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm font-semibold text-slate-700 dark:text-slate-300"
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
          <h2 className="text-3xl font-black">Recommended Tables</h2>

          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600 dark:text-slate-400">
            Phase 1 should focus on optimizations and feedback because those are
            already connected to mock APIs. Users, settings, discovery, corpus,
            and training can be added after.
          </p>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {databaseTables.map((table) => (
              <div
                key={table.name}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-slate-950/60"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-2xl font-black">{table.name}</h3>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${getPriorityClass(
                      table.priority
                    )}`}
                  >
                    {table.priority}
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
          <h2 className="text-3xl font-black">API Migration Plan</h2>

          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600 dark:text-slate-400">
            The UI can stay almost the same. The main change will happen inside
            the API routes, where mock memory will be replaced with database
            queries.
          </p>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10">
            <div className="grid grid-cols-[1fr_1fr_1fr_120px] bg-slate-950 px-5 py-4 text-sm font-black text-white">
              <div>Route</div>
              <div>Current</div>
              <div>Next</div>
              <div>Priority</div>
            </div>

            {apiMigration.map((item) => (
              <div
                key={item.route}
                className="grid grid-cols-[1fr_1fr_1fr_120px] gap-4 border-t border-slate-200 bg-white px-5 py-4 text-sm dark:border-white/10 dark:bg-slate-950/60"
              >
                <div className="font-mono font-black text-blue-500">
                  {item.route}
                </div>
                <div className="text-slate-700 dark:text-slate-300">
                  {item.current}
                </div>
                <div className="text-slate-700 dark:text-slate-300">
                  {item.next}
                </div>
                <div>
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">
                    {item.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8 rounded-[2.5rem] border border-slate-200 bg-white/80 p-7 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
          <h2 className="text-3xl font-black">Migration Steps</h2>

          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600 dark:text-slate-400">
            This is the safe order to move from temporary mock memory to real
            persistent data.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {migrationSteps.map((step) => (
              <div
                key={step.number}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-slate-950/60"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 text-xl font-black text-white">
                  {step.number}
                </div>

                <h3 className="text-xl font-black">{step.title}</h3>

                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                  {step.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {step.files.map((file) => (
                    <span
                      key={file}
                      className="rounded-full bg-slate-500/10 px-3 py-1 text-xs font-black text-slate-500 dark:text-slate-300"
                    >
                      {file}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2.5rem] bg-slate-950 p-8 text-center text-white shadow-2xl shadow-blue-500/20">
          <h2 className="mx-auto max-w-3xl text-4xl font-black leading-tight">
            Recommended next move: PostgreSQL + Prisma for local MVP persistence.
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            This will allow Wordsly.Ai to save history and feedback even after
            the dev server restarts. Later, the same Prisma structure can move
            to PostgreSQL for production.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="/mock-database"
              className="rounded-2xl bg-white px-7 py-4 text-center font-black text-slate-950 transition hover:bg-blue-50"
            >
              View Mock Database
            </a>

            <a
              href="/backend-plan"
              className="rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-center font-black text-white transition hover:bg-white/20"
            >
              Backend Plan
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}