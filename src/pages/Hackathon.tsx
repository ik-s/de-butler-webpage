import { motion } from "motion/react";

type HackathonCard = {
  label: string;
  title: string;
  meta: string;
  imageUrl: string;
  imageFit: "cover" | "contain";
  description: string;
  linkUrl?: string;
};

const hackathons: HackathonCard[] = [
  {
    label: "Hackathon Archive",
    title: "DE-BUTHON 2025",
    meta: "2025.03 - Kwangwoon University",
    imageUrl: "/hackathon/de-buthon-2025.webp",
    imageFit: "cover",
    description:
      "디버틀러에서 개최한 첫 해커톤입니다. 아이디어톤과 프로덕트톤을 동시에 운영하고 Axelar · Biconomy 등 파트너사들이 Special Track을 개설해 다채로운 빌딩의 장을 만들었습니다.",
    linkUrl: "https://www.hankyung.com/article/202503244674O",
  },
  {
    label: "Upcoming Hackathon",
    title: "2026 Hackathon",
    meta: "Coming Soon",
    imageUrl: "/hackathon/de-buthon-2026.png",
    imageFit: "contain",
    description: "Coming Soon",
  },
];

export default function Hackathon() {
  return (
    <main className="min-h-screen flex-grow bg-neutral-50 pb-20 pt-16">
      <section className="mx-auto w-full max-w-7xl px-6 md:px-10">
        <div className="mx-auto mb-12 max-w-4xl text-center">
          <h1 className="text-5xl font-black uppercase leading-none tracking-tight text-black md:text-7xl">
            DE-BUTLER Hackathon
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-relaxed text-slate-500 md:text-lg">
            De-Butler hackathon archive and upcoming program.
          </p>
        </div>

        <div className="space-y-10">
          {hackathons.map((hackathon, index) => (
            <motion.article
              key={hackathon.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="group mx-auto max-w-6xl overflow-hidden rounded-lg border border-black bg-white"
            >
              <div className="aspect-[21/9] min-h-64 overflow-hidden bg-black">
                <img
                  src={hackathon.imageUrl}
                  alt={hackathon.title}
                  className={`h-full w-full transition-transform duration-500 group-hover:scale-[1.03] ${
                    hackathon.imageFit === "contain" ? "object-contain p-10" : "object-cover"
                  }`}
                />
              </div>
              <div className="grid gap-8 p-6 md:grid-cols-[1fr_0.72fr] md:p-8">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-neon-green">
                    {hackathon.label}
                  </p>
                  <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-black md:text-5xl">
                    {hackathon.title}
                  </h2>
                  <p className="mt-4 font-mono text-sm font-bold uppercase tracking-[0.08em] text-slate-500">
                    {hackathon.meta}
                  </p>
                </div>
                <div className="flex flex-col justify-between gap-8 border-t border-gray-200 pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
                  <p className="text-base font-medium leading-relaxed text-slate-700 md:text-lg">
                    {hackathon.description}
                  </p>
                  {hackathon.linkUrl && (
                    <a
                      href={hackathon.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex self-start border border-black px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-black transition-colors hover:bg-neon-green"
                    >
                      자세히 보기 -&gt;
                    </a>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </main>
  );
}
