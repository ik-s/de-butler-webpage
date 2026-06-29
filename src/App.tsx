import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Instagram, Twitter, MessageSquare, ArrowRight, Menu, Search } from "lucide-react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import About from "./pages/About";

const SectionHeader = ({ title }: { title: string }) => (
  <div className="border-b border-black pb-2 mb-6 flex justify-between items-end">
    <h2 className="text-xl font-bold uppercase tracking-tighter">{title}</h2>
    <ArrowRight className="w-5 h-5" />
  </div>
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

const TabItem = ({ title, desc, date, views, image }: { title: string, desc: string, date: string, views: string, image: string, key?: any }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex gap-4 py-6 border-b border-gray-100 group cursor-pointer"
  >
    <div className="w-32 md:w-48 h-20 md:h-28 flex-shrink-0 overflow-hidden bg-gray-100">
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        referrerPolicy="no-referrer"
      />
    </div>
    <div className="flex flex-col flex-1 min-w-0">
      <h3 className="text-base md:text-lg font-bold leading-tight mb-1 group-hover:text-gray-600 transition-colors line-clamp-2">
        {title}
      </h3>
      <p className="text-xs md:text-sm text-gray-500 line-clamp-1 mb-2">{desc}</p>
      <div className="mt-auto flex justify-end items-center gap-3 text-[10px] font-mono text-gray-400 uppercase">
        <span>읽음 {views}</span>
        <span>•</span>
        <span>{date}</span>
      </div>
    </div>
  </motion.div>
);

const RisingItem = ({ date, title }: { date: string, title: string, key?: any }) => (
  <motion.div
    whileHover={{ x: 5 }}
    className="flex gap-4 py-3 border-b border-gray-50 last:border-0 cursor-pointer group"
  >
    <span className="text-lg font-black italic text-black w-12 shrink-0">{date}</span>
    <p className="text-sm font-medium leading-tight group-hover:text-gray-600 transition-colors line-clamp-2">
      {title}
    </p>
  </motion.div>
);

const InteractiveGridHero = () => (
  <section className="relative isolate mb-16 flex min-h-[calc(100svh-80px)] w-full overflow-hidden bg-[#00f000] lg:min-h-[calc(100svh-96px)]">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.08)_1px,transparent_1px)] bg-[size:100px_100px] opacity-45" />

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

function Home() {
  const [activeTab, setActiveTab] = useState<'dev' | 'res'>('dev');

  const aboutActivities = [
    { title: "주간 블록체인 기술 세미나 및 네트워킹", category: "Core", date: "Feb 20, 2026" },
    { title: "Web3 빌더를 위한 온보딩 워크샵", category: "Event", date: "Feb 15, 2026" },
    { title: "국내외 주요 블록체인 컨퍼런스 참여", category: "Core", date: "Jan 28, 2026" },
    { title: "학회원 간의 친목 도모를 위한 '버틀러 나잇'", category: "Social", date: "Jan 10, 2026" },
    { title: "광운대학교 블록체인 커뮤니티 빌딩", category: "Core", date: "Jan 05, 2026" },
  ];

  const devActivities = [
    { title: "Smart Contract 보안 취약점 분석 툴 개발", desc: "보안성 강화를 위한 자동화 분석 도구 프로젝트", date: "6일 전", views: "28417", image: "/dev-thumb-1.svg" },
    { title: "Rust 기반 Solana DApp 아키텍처 연구", desc: "고성능 블록체인 애플리케이션 설계를 위한 심층 분석", date: "7일 전", views: "12603", image: "/dev-thumb-2.svg" },
    { title: "탈중앙화 투표 시스템(DAO) 프로토타입", desc: "거버넌스 투명성을 위한 온체인 투표 솔루션", date: "5일 전", views: "10407", image: "/dev-thumb-3.svg" },
  ];

  const resActivities = [
    { title: "2026년 L2 솔루션 생태계 분석 보고서", desc: "확장성 솔루션의 현재와 미래 전망", date: "2일 전", views: "31052", image: "/res-thumb-1.svg" },
    { title: "토큰 이코노믹스: 지속 가능한 모델의 조건", desc: "장기적 가치 창출을 위한 경제 모델 설계", date: "4일 전", views: "18560", image: "/res-thumb-2.svg" },
    { title: "DeFi 프로토콜 거버넌스 공격 사례 연구", desc: "주요 해킹 사례를 통한 보안 프로토콜 분석", date: "8일 전", views: "9210", image: "/res-thumb-3.svg" },
  ];

  const risingItems = [
    { date: "03.04", title: "리크루팅" },
    { date: "03.04", title: "NOT CENT ANYMORE 부스 진행" },
  ];

  const getActiveData = () => {
    switch (activeTab) {
      case 'dev': return devActivities;
      case 'res': return resActivities;
    }
  };

  return (
    <main className="flex-grow w-full pb-12">
      {/* Interactive Hero Section */}
      <div id="about" className="scroll-mt-24">
        <InteractiveGridHero />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Main Grid - 3 Column Magazine Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-24">
          {/* Column 1: What does De-Butler (Fixed Left) */}
          <motion.div
            id="activities"
            className="lg:col-span-3 scroll-mt-24"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <SectionHeader title="What does De-Butler" />
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
          </motion.div>

          {/* Column 2: Grouped Teams with Tabs (Middle) */}
          <motion.div
            id="teams"
            className="lg:col-span-6 scroll-mt-24"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex border-b border-gray-200 mb-6 relative">
              <button
                onClick={() => setActiveTab('dev')}
                className={`pb-3 pr-8 text-xl font-bold uppercase tracking-tighter transition-all relative z-10 ${activeTab === 'dev' ? 'text-black' : 'text-gray-300 hover:text-gray-500'
                  }`}
              >
                Development Team
                {activeTab === 'dev' && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-8 h-[3px] bg-black" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('res')}
                className={`pb-3 px-8 text-xl font-bold uppercase tracking-tighter transition-all relative z-10 ${activeTab === 'res' ? 'text-black' : 'text-gray-300 hover:text-gray-500'
                  }`}
              >
                Research Team
                {activeTab === 'res' && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-8 right-0 h-[3px] bg-black" />
                )}
              </button>
            </div>

            <div className="min-h-[400px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {getActiveData()?.map((activity, idx) => (
                    <TabItem
                      key={idx}
                      title={activity.title}
                      desc={activity.desc}
                      date={activity.date}
                      views={activity.views}
                      image={activity.image}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Column 3: Rising (Sidebar Right) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-3"
          >
            <div className="border-b border-black pb-2 mb-6 flex justify-between items-end">
              <h2 className="text-xl font-bold uppercase tracking-tighter">Upcoming Event</h2>
              <span className="text-[10px] font-mono text-gray-400 uppercase">12:00 기준</span>
            </div>
            <div className="space-y-2">
              {risingItems.map((item, idx) => (
                <RisingItem key={idx} date={item.date} title={item.title} />
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Social Section */}
      <section id="contact" className="border-t border-black pt-12 mb-24 scroll-mt-24">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Connect with us</h2>
            <p className="text-gray-500 uppercase text-xs font-bold tracking-widest">Follow our journey on social media</p>
          </div>
          <div className="flex gap-4">
            <motion.a
              whileHover={{ scale: 1.1, backgroundColor: '#00FF00', color: '#000' }}
              href="#"
              className="w-16 h-16 border border-black rounded-full flex items-center justify-center transition-colors"
            >
              <Instagram className="w-6 h-6" />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.1, backgroundColor: '#00FF00', color: '#000' }}
              href="#"
              className="w-16 h-16 border border-black rounded-full flex items-center justify-center transition-colors"
            >
              <Twitter className="w-6 h-6" />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.1, backgroundColor: '#00FF00', color: '#000' }}
              href="#"
              className="w-16 h-16 border border-black rounded-full flex items-center justify-center transition-colors"
            >
              <MessageSquare className="w-6 h-6" />
            </motion.a>
          </div>
        </div>
      </section>
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

export default function App() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <ScrollToTop />
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center gap-8 px-6 md:px-10 lg:h-24 lg:gap-14">
          <div className="flex flex-col items-start">
            <Link to="/" className="group mb-1 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border border-neon-green">
                <img src="/logo.jpg" alt="De-Butler Logo" className="h-full w-full object-cover" />
              </div>
              <span className="text-2xl font-black uppercase italic leading-none tracking-tight">De-Butler</span>
            </Link>
            <span className="text-[9px] font-bold uppercase leading-none tracking-[0.08em] text-gray-400">
              Your Butler for the Decentralized Era
            </span>
          </div>

          <div className="hidden flex-1 items-center gap-12 text-[15px] font-extrabold text-slate-800 lg:flex">
            <Link to="/about" className="hover-underline">About</Link>
            <a href="/#activities" className="hover-underline">Activities</a>
            <a href="/#teams" className="hover-underline">Teams</a>
            <a href="/#contact" className="hover-underline">Contact</a>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <button aria-label="Search" className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-gray-100">
              <Search className="h-6 w-6" />
            </button>
            <Menu className="h-7 w-7 cursor-pointer lg:hidden" />
            <button className="hidden rounded-full bg-black px-8 py-4 text-sm font-extrabold text-white shadow-[0_16px_32px_rgba(0,0,0,0.18)] transition-colors hover:bg-neon-green hover:text-black sm:block">
              Join Us
            </button>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>

      {/* Footer */}
      <footer className="bg-black text-white px-6 py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <span className="text-3xl font-black tracking-tighter uppercase italic text-neon-green">De-Butler</span>
            <p className="mt-4 text-gray-400 max-w-sm text-sm">
              광운대학교 블록체인 학회 De-Butler는 차세대 인터넷의 주역이 될 인재들을 양성하고,
              건전한 블록체인 생태계 발전에 기여합니다.
            </p>
          </div>
          <div>
            <h4 className="font-bold uppercase text-xs tracking-widest mb-4 text-gray-500">Contact</h4>
            <ul className="text-sm space-y-2">
              <li>debutler.official@gmail.com</li>
              <li>Seoul, South Korea</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold uppercase text-xs tracking-widest mb-4 text-gray-500">Legal</h4>
            <ul className="text-sm space-y-2">
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-800 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
          <p>© 2026 De-Butler. All rights reserved.</p>
          <p>Built for the Decentralized Era</p>
        </div>
      </footer>
    </div>
  );
}
