import { Link } from "react-router-dom";

const GITHUB = "https://github.com/papendiaye21";
const LINKEDIN = "https://www.linkedin.com/in/papendiaye21";

const repos = [
  { name: "caresync", desc: "Caresync clinic platform" },
  { name: "todo", desc: "Dart / Flutter project" },
  { name: "allRunners", desc: "Full-stack running tracker" },
  { name: "flutter-calculator", desc: "Dart project" },
  { name: "PN", desc: "Public repository (no description available)" },
  { name: "diamond-price-prediction", desc: "ML / notebook project" },
];

const skills: [string, string[]][] = [
  ["Languages", ["Python", "JavaScript", "TypeScript", "Dart"]],
  ["Focus areas", ["Full-stack development", "AI / agents", "Security", "Databases"]],
];

export function PortfolioPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-4">
          <span className="font-semibold">Pape Ndiaye</span>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <a href="#about">About</a>
            <a href="#projects">Projects</a>
            <a href="#skills">Skills</a>
            <a href="#contact">Contact</a>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-4xl space-y-12 px-4 py-10">
        <section>
          <h1 className="text-3xl font-bold sm:text-4xl">Hi, I'm Pape Ndiaye</h1>
          <p className="mt-3 text-lg text-slate-600">
            Computer Science student at the University of Rhode Island (URI),
            graduating December 2027. I enjoy full-stack development, AI/agents,
            security and databases, building with Python, JavaScript, TypeScript
            and Dart.
          </p>
        </section>
        <section id="about">
          <h2 className="text-2xl font-semibold">About</h2>
          <p className="mt-3 text-slate-700">
            I'm part of the Handshake AI Fellowship, and I've built healthcare
            SaaS software, a running tracker, and AI desktop tooling. I also
            bring discipline and teamwork from my service with the Rhode Island
            Army National Guard.
          </p>
        </section>
        <section id="projects">
          <h2 className="text-2xl font-semibold">Projects</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {repos.map((r) => (
              <li key={r.name} className="rounded-lg border border-slate-200 bg-white p-4">
                <a
                  className="font-semibold text-blue-700 hover:underline"
                  href={`${GITHUB}/${r.name}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {r.name}
                </a>
                <p className="mt-1 text-sm text-slate-600">{r.desc}</p>
              </li>
            ))}
          </ul>
        </section>
        <section id="skills">
          <h2 className="text-2xl font-semibold">Skills</h2>
          <div className="mt-4 space-y-3">
            {skills.map(([label, items]) => (
              <div key={label}>
                <h3 className="text-sm font-medium text-slate-500">{label}</h3>
                <div className="mt-1 flex flex-wrap gap-2">
                  {items.map((i) => (
                    <span key={i} className="rounded-full bg-slate-200 px-3 py-1 text-sm">
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
        <section id="contact">
          <h2 className="text-2xl font-semibold">Contact</h2>
          <p className="mt-3 flex flex-wrap gap-4">
            <a className="text-blue-700 hover:underline" href={GITHUB} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a className="text-blue-700 hover:underline" href={LINKEDIN} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          </p>
        </section>
      </main>
      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">
        <Link to="/app" className="hover:underline">
          Caresync app sign in
        </Link>
      </footer>
    </div>
  );
}
