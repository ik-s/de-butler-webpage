import React from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

const whatWeDoItems = [
    {
        title: "LEARN",
        step: "STEP #1",
        desc: "블록체인과 Web3를 처음 접하는 학우도 기초 개념부터 차근차근 배워갑니다.",
        image: "/what-we-do-learn.jpg",
    },
    {
        title: "RESEARCH",
        step: "STEP #2",
        desc: "기술, 프로젝트, 시장 흐름을 함께 분석하며 블록체인을 바라보는 관점을 넓혀갑니다.",
        image: "/what-we-do-research.jpg",
    },
    {
        title: "BUILD",
        step: "STEP #3",
        desc: "스터디와 리서치를 바탕으로 프로젝트, 해커톤, 외부 활동을 통해 실제 결과물을 만들어갑니다.",
        image: "/what-we-do-build.jpg",
    },
];

export default function About() {
    const [selectedItem, setSelectedItem] = React.useState<(typeof whatWeDoItems)[number] | null>(null);

    return (
        <main className="flex-grow w-full pb-12 pt-24 min-h-screen relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-16"
                >
                    <div className="border-b border-black pb-2 mb-8 flex justify-between items-end">
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">About De-Butler</h1>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-lg leading-relaxed text-gray-800">
                        <div>
                            <p className="mb-6">
                                광운대학교 블록체인 학회 <strong>De-Butler(디버틀러)</strong>는 다가오는 탈중앙화 시대(Decentralized Era)에 필수적인 지식과 기술을 탐구하고, 건전한 Web3 생태계 발전에 기여하는 것을 목표로 합니다.
                            </p>
                            <p className="mb-6">
                                버틀러(Butler)가 주인을 헌신적으로 보필하듯, 우리는 기술의 변화 속에서도 사람을 향하는 블록체인의 본질적 가치를 최우선으로 생각합니다.
                            </p>
                            <p>
                                De-Butler는 블록체인과 Web3를 처음 접하는 학생들도 기초부터 차근차근 이해하고, 함께 배우며 성장할 수 있는 학습 공동체입니다. 나아가 리서치, 세션, 프로젝트 개발, 해커톤, 외부 행사 참여 등을 통해 단순한 관심을 넘어 실제 생태계에서 활용할 수 있는 전문성과 실행력을 갖춘 Web3 인재로 성장하는 것을 지향합니다.
                            </p>
                        </div>

                        <div className="bg-gray-50 p-8 border border-gray-100 relative group">
                            <div className="absolute top-0 left-0 w-2 h-full bg-neon-green transform origin-left scale-y-0 group-hover:scale-y-100 transition-transform duration-500" />
                            <h3 className="text-xl font-bold uppercase tracking-tighter mb-4 italic flex items-center gap-2">
                                Our Vision <ArrowRight className="w-5 h-5 text-neon-green" />
                            </h3>
                            <ul className="space-y-4">
                                <li className="flex gap-4">
                                    <span className="font-mono text-neon-green font-bold">01</span>
                                    <span><strong>깊이 있는 학습</strong>: 단순히 트렌드를 따라가는 것이 아니라, 블록체인과 Web3의 핵심 원리와 기술적 기반을 이해하며 탄탄한 전문성을 쌓아갑니다.</span>
                                </li>
                                <li className="flex gap-4">
                                    <span className="font-mono text-neon-green font-bold">02</span>
                                    <span><strong>연결과 시너지</strong>: 교내 학우들뿐만 아니라 타 대학, 산업계 전문가들과의 활발한 네트워킹을 통해 지식과 경험이 확장되는 블록체인 커뮤니티를 만들어갑니다.</span>
                                </li>
                                <li className="flex gap-4">
                                    <span className="font-mono text-neon-green font-bold">03</span>
                                    <span><strong>실전적 경험</strong>: 세미나와 스터디를 넘어, 리서치·기획·개발·해커톤 등 실제 프로젝트 경험을 통해 Web3 생태계에서 필요한 실행력을 기릅니다.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="border-b border-black pb-2 mb-8">
                        <h2 className="text-2xl font-bold uppercase tracking-tighter">WHAT WE DO</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {whatWeDoItems.map((item) => (
                            <button
                                key={item.title}
                                type="button"
                                onClick={() => setSelectedItem(item)}
                                className="border border-black p-6 bg-black text-left text-white hover:bg-neon-green hover:text-black hover:border-neon-green transition-all duration-300"
                            >
                                <h3 className="text-xl font-black uppercase italic mb-2">{item.title}</h3>
                                <p className="text-sm leading-relaxed">{item.desc}</p>
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>

            {selectedItem && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
                    onClick={() => setSelectedItem(null)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-2xl bg-white p-6 shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-6 flex items-start justify-between gap-8">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-neon-green">{selectedItem.step}</p>
                                <h3 className="text-2xl font-black uppercase tracking-tight">{selectedItem.title}</h3>
                                <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-600">{selectedItem.desc}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedItem(null)}
                                className="h-10 w-10 rounded-full bg-black text-white"
                                aria-label="Close"
                            >
                                X
                            </button>
                        </div>
                        <div className="h-72 bg-gray-100 md:h-80">
                            <img
                                src={selectedItem.image}
                                alt={`${selectedItem.title} activity`}
                                className="h-full w-full object-cover"
                                onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                }}
                            />
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Background Elements */}
            <div className="absolute top-40 right-10 w-96 h-96 bg-neon-green/10 rounded-full blur-[100px] pointer-events-none" />
        </main>
    );
}
