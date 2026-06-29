const events = [
    {
        no: 1,
        category: "운영",
        title: "심화세션 1주차 안내",
        author: "개발팀장",
        date: "2026.04.06",
    },
];

export default function Events() {
    return (
        <main className="min-h-screen flex-grow pt-24 pb-24">
            <section className="mx-auto w-full max-w-7xl px-6 md:px-10">
                <div className="mb-24">
                    <h1 className="mb-8 text-6xl font-black tracking-tight text-neon-green md:text-7xl">이벤트</h1>
                    <p className="max-w-2xl text-xl leading-relaxed text-black">
                        De-Butler의 주요 소식과 이벤트를 확인하세요. 운영, 학술, 이벤트 공지를 확인할 수 있습니다.
                    </p>
                </div>

                <div className="mb-14 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                    <div className="flex gap-4">
                        <button className="rounded-lg bg-white px-6 py-4 text-base font-bold text-neon-green shadow-[0_2px_12px_rgba(0,0,0,0.10)]">
                            전체
                        </button>
                        <button className="px-6 py-4 text-base font-medium text-black">운영</button>
                    </div>
                    <input
                        type="search"
                        placeholder="검색어를 입력하세요"
                        className="h-14 w-full rounded-lg border border-black px-5 text-base outline-none md:w-[400px]"
                    />
                </div>

                <div className="overflow-x-auto rounded-xl border border-black shadow-[0_3px_12px_rgba(0,0,0,0.12)]">
                    <div className="grid min-w-[900px] grid-cols-[0.6fr_1fr_3fr_1.2fr_1.1fr] gap-6 px-8 py-6 text-sm font-black uppercase tracking-[0.28em] text-black">
                        <span>No.</span>
                        <span>Category</span>
                        <span>Title</span>
                        <span>Author</span>
                        <span className="text-right">Date</span>
                    </div>
                    {events.map((event) => (
                        <div
                            key={event.no}
                            className="grid min-w-[900px] grid-cols-[0.6fr_1fr_3fr_1.2fr_1.1fr] gap-6 px-8 py-8 text-lg font-bold text-black"
                        >
                            <span className="text-neon-green">{event.no}</span>
                            <span>{event.category}</span>
                            <span>{event.title}</span>
                            <span>{event.author}</span>
                            <span className="text-right">{event.date}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-16 flex justify-center gap-3">
                    {["≪", "‹", "1", "›", "≫"].map((label) => (
                        <button
                            key={label}
                            className={`h-11 w-11 rounded-lg border border-black text-lg font-bold ${label === "1" ? "bg-neon-green text-black" : "bg-white text-black"}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </section>
        </main>
    );
}
