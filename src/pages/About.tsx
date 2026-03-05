import React from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

export default function About() {
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
                                De-Butler는 블록체인 기술에 관심 있는 창의적이고 열정적인 학생들이 모여 스마트 컨트랙트, 암호학, 합의 알고리즘, 토크노믹스 등 다양한 학술 주제를 깊이 있게 연구(Research)하고 실제 프로덕트를 개발(Development)합니다.
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
                                    <span><strong>전문성 결여 극복</strong>: 단순 트렌드 추종이 아닌, 코어 기술에 대한 깊이 있는 이해와 철저한 학술적 접근을 지향합니다.</span>
                                </li>
                                <li className="flex gap-4">
                                    <span className="font-mono text-neon-green font-bold">02</span>
                                    <span><strong>연결과 시너지</strong>: 교내 학우들뿐만 아니라 타 대학, 산업계 전문가들과의 활발한 네트워킹을 통해 블록체인 허브로 자리매김합니다.</span>
                                </li>
                                <li className="flex gap-4">
                                    <span className="font-mono text-neon-green font-bold">03</span>
                                    <span><strong>실전적 경험</strong>: 세미나와 스터디를 넘어, 실제 동작하는 DApp과 인프라를 구축하며 실무 능력을 배양합니다.</span>
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
                        <h2 className="text-2xl font-bold uppercase tracking-tighter">Core Values</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {['Decentralization', 'Transparency', 'Innovation'].map((value, idx) => (
                            <div key={idx} className="border border-black p-6 bg-black text-white hover:bg-neon-green hover:text-black hover:border-neon-green transition-all duration-300">
                                <h3 className="text-xl font-black uppercase italic mb-2">{value}</h3>
                                <p className="text-sm opacity-80 uppercase tracking-widest font-mono">Value #{idx + 1}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Background Elements */}
            <div className="absolute top-40 right-10 w-96 h-96 bg-neon-green/10 rounded-full blur-[100px] pointer-events-none" />
        </main>
    );
}
