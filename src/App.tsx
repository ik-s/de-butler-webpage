import React from "react";
import { motion } from "motion/react";
import { Instagram, Linkedin, ArrowRight, Menu, User, LogOut } from "lucide-react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { fetchActivities } from "./lib/activitiesApi";
import type { Activity, AdminSession } from "./lib/activitiesApi";
import { adminSessionChangedEvent, clearAdminSession, loadStoredAdminSession } from "./lib/adminSession";
import Activities from "./pages/Activities";
import About from "./pages/About";
import Events from "./pages/Events";
import Login from "./pages/Login";

const SectionHeader = ({ title, to }: { title: string; to?: string }) => (
  <div className="border-b border-black pb-2 mb-6 flex justify-between items-end">
    <h2 className="flex items-center gap-3 text-xl font-bold uppercase tracking-tighter transition-colors hover:text-neon-green">
      <span className="h-6 w-1.5 bg-neon-green" />
      {title}
    </h2>
    {to ? (
      <Link to={to} aria-label={`Go to ${title}`} className="transition-transform hover:translate-x-1">
        <ArrowRight className="w-5 h-5" />
      </Link>
    ) : (
      <ArrowRight className="w-5 h-5 transition-transform hover:translate-x-1" />
    )}
  </div>
);

const EventDetailPlaceholder = () => (
  <main className="min-h-[55vh] flex-grow bg-white" aria-label="Event detail placeholder" />
);

const ActivityItem = ({ title, date, category }: { title: string, date: string, category?: string, key?: any }) => (
  <motion.div
    whileHover={{ x: 5 }}
    className="group cursor-pointer border-b border-gray-100 py-4 last:border-0"
  >
    {category && <span className="text-[10px] font-bold uppercase text-neon-green mb-1 block">{category}</span>}
    <h3 className="text-lg font-medium leading-tight group-hover:text-gray-600 transition-colors">
      {title}
    </h3>
    <p className="text-xs text-gray-400 mt-2 font-mono uppercase">{date}</p>
  </motion.div>
);

const InteractiveGridHero = () => {
  const [mousePos, setMousePos] = React.useState({ x: "50%", y: "50%" });

  const handleMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMousePos({ x: `${event.clientX - rect.left}px`, y: `${event.clientY - rect.top}px` });
  };

  return (
    <section
      onMouseMove={handleMouseMove}
      className="relative isolate mb-16 flex min-h-[calc(100svh-80px)] w-full overflow-hidden bg-[#00f000] lg:min-h-[calc(100svh-96px)]"
    >
      <div className="absolute inset-0 opacity-70 blur-3xl [background:radial-gradient(circle_at_20%_30%,#00c400_0%,transparent_45%),radial-gradient(circle_at_78%_66%,#009900_0%,transparent_48%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.08)_1px,transparent_1px)] bg-[size:100px_100px] opacity-45" />
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle 360px at ${mousePos.x} ${mousePos.y}, rgba(255,255,255,0.24), transparent 78%)`,
        }}
      />

    <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-6 py-16 md:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] lg:py-20">
      <div className="max-w-3xl text-left">
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex rounded-full border border-black/15 bg-black/10 px-5 py-2 text-[10px] font-black uppercase tracking-[0.26em] text-black/70 md:text-xs"
        >
          KWANGWOON UNIVERSITY BLOCKCHAIN CLUB 2026
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mt-10 text-[clamp(4rem,8vw,8rem)] font-[1000] uppercase leading-none tracking-normal text-black"
        >
          DE-BUTLER
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="mt-10 max-w-2xl text-base font-bold uppercase tracking-[0.28em] text-black/65 md:text-lg"
        >
          YOUR BUTLER FOR THE DECENTRALIZED ERA
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.12 }}
        className="flex justify-center lg:justify-end"
      >
        <img
          src="/DeButlerIcon.svg"
          alt="De-Butler icon"
          className="w-[min(68vw,18rem)] md:w-[20rem] lg:w-[22rem] drop-shadow-[0_28px_50px_rgba(0,0,0,0.22)]"
        />
      </motion.div>
    </div>
  </section>
  );
};

const AboutSummary = () => (
  <section className="mx-auto mb-16 w-full max-w-7xl px-6 md:px-10">
    <div className="grid gap-10 py-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
      <div>
        <div className="mb-7 flex items-center gap-6">
          <span className="h-12 w-2 bg-neon-green" />
          <h2 className="text-4xl font-black uppercase leading-none tracking-tight md:text-5xl">About Us</h2>
        </div>
        <p className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">BLOCKCHAIN ACADEMIC CLUB FOR THE DECENTRALIZED ERA</p>
      </div>
      <div>
        <p className="max-w-4xl text-2xl font-semibold leading-relaxed tracking-tight text-black md:text-3xl">
          광운대학교 블록체인 학회 De-Butler는 탈중앙화 시대에 필요한 지식과 기술을 탐구하고,
          건전한 Web3 생태계 발전에 기여하는 것을 목표로 합니다.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { title: "Expertise", desc: "코어 기술에 대한 깊이 있는 이해와 학술적 접근을 지향합니다." },
            { title: "Connection", desc: "교내외 학우와 산업계 전문가를 잇는 블록체인 허브를 만듭니다." },
            { title: "Experience", desc: "세미나와 스터디를 넘어 실제 동작하는 DApp과 인프라를 구축합니다." },
          ].map((item) => (
            <div key={item.title} className="min-h-52 rounded-lg border border-gray-100 bg-gray-50 p-8">
              <h3 className="mb-8 text-lg font-black uppercase tracking-tight text-black">{item.title}</h3>
              <p className="text-base leading-relaxed text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const activityImagePlaceholders = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const ActivityImageGrid = ({ activities = [] }: { activities?: Activity[] }) => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
    {activities.length > 0
      ? activities.slice(0, 9).map((activity) => (
          <motion.div
            key={activity.id}
            whileHover={{ y: -4 }}
            className="aspect-[4/3] overflow-hidden border border-gray-200 bg-gray-100"
          >
            {activity.imageUrl ? (
              <img
                src={activity.imageUrl}
                alt={activity.title}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-[linear-gradient(135deg,#f4f4f5_0%,#e5e7eb_50%,#f8fafc_100%)]" />
            )}
          </motion.div>
        ))
      : activityImagePlaceholders.map((item) => (
          <motion.div
            key={item}
            whileHover={{ y: -4 }}
            aria-label={`Activity image placeholder ${item}`}
            className="aspect-[4/3] overflow-hidden border border-gray-200 bg-gray-100"
          >
            <div className="h-full w-full bg-[linear-gradient(135deg,#f4f4f5_0%,#e5e7eb_50%,#f8fafc_100%)]" />
          </motion.div>
        ))}
  </div>
);

function Home() {
  const [leftTab, setLeftTab] = React.useState<"what" | "upcoming">("what");
  const [homeActivities, setHomeActivities] = React.useState<Activity[]>([]);

  React.useEffect(() => {
    let isActive = true;

    fetchActivities()
      .then((items) => {
        if (isActive) {
          setHomeActivities(items);
        }
      })
      .catch(() => {
        if (isActive) {
          setHomeActivities([]);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const aboutActivities = [
    { title: "주간 블록체인 기술 세미나 및 네트워킹", category: "Core", date: "Feb 20, 2026" },
    { title: "Web3 빌더를 위한 온보딩 워크샵", category: "Event", date: "Feb 15, 2026" },
    { title: "국내외 주요 블록체인 컨퍼런스 참여", category: "Core", date: "Jan 28, 2026" },
    { title: "학회원 간의 친목 도모를 위한 '버틀러 나잇'", category: "Social", date: "Jan 10, 2026" },
    { title: "광운대학교 블록체인 커뮤니티 빌딩", category: "Core", date: "Jan 05, 2026" },
  ];

  const upcomingItems = [
    { title: "리크루팅", date: "03.04" },
    { title: "NOT CENT ANYMORE 부스 진행", date: "03.04" },
  ];

  return (
    <main className="flex-grow w-full pb-12">
      {/* Interactive Hero Section */}
      <div id="about" className="scroll-mt-24">
        <InteractiveGridHero />
      </div>

      <AboutSummary />

      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Main Grid - 2 Column Magazine Layout */}
        <div className="grid grid-cols-1 gap-12 mb-24 lg:grid-cols-[minmax(320px,360px)_minmax(0,1fr)]">
          {/* Column 1: What does De-Butler (Fixed Left) */}
          <motion.div
            className="scroll-mt-24"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="border-b border-black pb-2 mb-6 flex items-end justify-between gap-4">
              <div className="flex min-w-0 items-end gap-3">
                <span className="h-6 w-1.5 shrink-0 bg-neon-green" />
                <div className="flex min-w-0 items-end gap-4">
                  <button
                    type="button"
                    onClick={() => setLeftTab("what")}
                    className={`text-xl font-bold uppercase tracking-tighter transition-colors hover:text-neon-green ${leftTab === "what" ? "text-black" : "text-gray-300"}`}
                  >
                    What does
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeftTab("upcoming")}
                    className={`text-xl font-bold uppercase tracking-tighter transition-colors hover:text-neon-green ${leftTab === "upcoming" ? "text-black" : "text-gray-300"}`}
                  >
                    Upcoming
                  </button>
                </div>
              </div>
              <Link to="/events" aria-label="Go to events" className="transition-transform hover:translate-x-1">
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
            {leftTab === "what" ? (
              <div className="space-y-1">
                {aboutActivities.map((activity, idx) => (
                  <ActivityItem
                    key={idx}
                    category={activity.category}
                    title={activity.title}
                    date={activity.date}
                  />
                ))}
              </div>
            ) : (
              <div>
                {upcomingItems.map((item, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ x: 5 }}
                    className="flex items-center gap-5 border-b border-gray-100 py-5 last:border-0"
                  >
                    <span className="w-16 shrink-0 text-2xl font-black italic text-black">{item.date}</span>
                    <p className="text-lg font-medium leading-tight text-black">{item.title}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Column 2: Activities Image Grid (Middle) */}
          <motion.div
            id="activities"
            className="scroll-mt-24"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <SectionHeader title="Activities" to="/activities" />
            <ActivityImageGrid activities={homeActivities} />
          </motion.div>
        </div>
      </div>

    </main>
  );
}

const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const XLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M18.9 2h3.1l-6.8 7.8 8 10.2h-6.3l-4.9-6.3-5.6 6.3H3.3l7.3-8.3L3 2h6.4l4.4 5.8L18.9 2Zm-1.1 16.2h1.7L8.5 3.7H6.7l11.1 14.5Z" />
  </svg>
);

const footerSocialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/de__butler/", Icon: Instagram },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/de-butler/people/?viewAsMember=true", Icon: Linkedin },
  { label: "X", href: "https://x.com/DeButler_", Icon: XLogo },
];

export default function App() {
  const { pathname } = useLocation();
  const showHeaderContact = pathname === "/";
  const [adminSession, setAdminSession] = React.useState<AdminSession | null>(() => loadStoredAdminSession());

  React.useEffect(() => {
    const refreshAdminSession = () => setAdminSession(loadStoredAdminSession());
    window.addEventListener(adminSessionChangedEvent, refreshAdminSession);
    window.addEventListener("storage", refreshAdminSession);

    return () => {
      window.removeEventListener(adminSessionChangedEvent, refreshAdminSession);
      window.removeEventListener("storage", refreshAdminSession);
    };
  }, []);

  const handleJoinClick = () => {
    window.alert("현재 지원 기간이 아닙니다.");
  };

  const handleLogout = () => {
    clearAdminSession();
    setAdminSession(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 font-sans">
      <ScrollToTop />
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center gap-8 px-6 md:px-10 lg:h-24 lg:gap-14">
          <div className="flex flex-col items-start">
            <Link to="/" className="group mb-1 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md">
                <img src="/DeButlerIcon.svg" alt="De-Butler Logo" className="h-full w-full object-contain" />
              </div>
              <span className="text-2xl font-black uppercase italic leading-none tracking-tight">De-Butler</span>
            </Link>
          </div>

          <div className="hidden flex-1 items-center gap-12 text-[15px] font-extrabold text-slate-800 lg:flex">
            <Link to="/about" className="hover-underline">About</Link>
            <Link to="/activities" className="hover-underline">Activities</Link>
            <Link to="/events" className="hover-underline">Events</Link>
            {showHeaderContact && <a href="/#contact" className="hover-underline">Contact</a>}
          </div>

          <div className="ml-auto flex items-center gap-4">
            <Menu className="h-7 w-7 cursor-pointer lg:hidden" />
            {adminSession ? (
              <>
                <span className="hidden items-center gap-2 rounded-full bg-slate-100 px-5 py-4 text-sm font-extrabold text-slate-900 sm:flex">
                  <User className="h-4 w-4 text-slate-700" aria-hidden="true" />
                  {adminSession.username}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Logout admin account"
                  title="Logout"
                  className="hidden h-12 w-12 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-neon-green hover:text-black sm:flex"
                >
                  <LogOut className="h-5 w-5" aria-hidden="true" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="hidden rounded-full bg-black px-6 py-4 text-sm font-extrabold text-white shadow-[0_16px_32px_rgba(0,0,0,0.18)] transition-colors hover:bg-neon-green hover:text-black sm:block"
              >
                Login
              </Link>
            )}
            <button
              onClick={handleJoinClick}
              className="hidden rounded-full bg-black px-8 py-4 text-sm font-extrabold text-white shadow-[0_16px_32px_rgba(0,0,0,0.18)] transition-colors hover:bg-neon-green hover:text-black sm:block"
            >
              Join Us
            </button>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:eventSlug" element={<EventDetailPlaceholder />} />
        <Route path="/login" element={<Login />} />
      </Routes>

      {/* Footer */}
      <footer id="contact" className="scroll-mt-24 bg-black py-14 text-white">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-6 md:px-10 lg:grid-cols-[1.25fr_0.9fr_0.8fr_1fr] lg:items-start">
          <div>
            <span className="text-3xl font-black tracking-tighter uppercase text-neon-green">De-Butler</span>
            <p className="mt-4 text-gray-400 max-w-sm text-sm">
              광운대학교 블록체인 학회 De-Butler는 차세대 인터넷의 주역이 될 인재들을 양성하고,
              건전한 블록체인 생태계 발전에 기여합니다.
            </p>
          </div>
          <div className="lg:pl-8">
            <h4 className="font-bold uppercase text-xs tracking-widest mb-4 text-gray-500">Contact</h4>
            <ul className="text-sm space-y-2">
              <li>debutler2023@gmail.com</li>
              <li>Seoul, South Korea</li>
            </ul>
          </div>
          <div className="flex gap-4 lg:col-start-4 lg:justify-self-end">
            {footerSocialLinks.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target="_blank"
                rel="noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-gray-400 transition-colors hover:border-neon-green hover:bg-neon-green hover:text-black"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-12 flex w-full max-w-7xl flex-col gap-4 border-t border-gray-800 px-6 pt-8 text-[10px] font-bold uppercase tracking-widest text-gray-500 md:px-10 lg:flex-row lg:items-center lg:justify-between">
          <p>© 2026 De-Butler. All rights reserved.</p>
          <p>Built for the Decentralized Era</p>
        </div>
      </footer>
    </div>
  );
}
