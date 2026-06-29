import React from "react";

import {
  createEvent,
  deleteEvent,
  fetchEvents,
  updateEvent,
} from "../lib/eventsApi";
import { isUnauthorizedError } from "../lib/apiError";
import { adminSessionChangedEvent, clearAdminSession, loadStoredAdminSession } from "../lib/adminSession";
import type { AdminSession } from "../lib/activitiesApi";
import type { EventCategory, EventInput, EventRecord } from "../lib/eventsApi";

const eventTabs: EventCategory[] = ["WHAT DOES", "UPCOMING"];

const sampleEvents: EventRecord[] = [
  {
    id: -1,
    title: "De-Butler가 하는 일",
    category: "WHAT DOES",
    date: "2026.06.29",
    description:
      "De-Butler는 블록체인과 웹3 기술을 함께 학습하고, 서비스 기획부터 개발까지 이어지는 실전 프로젝트를 운영합니다.",
    linkUrl: "/events/what-does-debutler",
    createdAt: "2026-06-29T00:00:00.000Z",
    updatedAt: "2026-06-29T00:00:00.000Z",
  },
  {
    id: -2,
    title: "스터디와 프로젝트를 연결하는 운영 방식",
    category: "WHAT DOES",
    date: "2026.06.20",
    description:
      "정기 세션에서 익힌 개념을 팀 프로젝트로 확장하며, 멤버들이 직접 리서치와 구현 경험을 쌓을 수 있도록 돕습니다.",
    linkUrl: "/events/study-session",
    createdAt: "2026-06-20T00:00:00.000Z",
    updatedAt: "2026-06-20T00:00:00.000Z",
  },
  {
    id: -3,
    title: "신규 멤버 오리엔테이션 안내",
    category: "UPCOMING",
    date: "2026.07.08",
    description: "새로운 멤버를 위한 De-Butler 소개, 활동 로드맵 공유, 팀 매칭 세션이 진행될 예정입니다.",
    linkUrl: "/events/orientation",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
  {
    id: -4,
    title: "여름 빌드 나이트 참가 신청",
    category: "UPCOMING",
    date: "2026.07.18",
    description: "아이디어 검증부터 프로토타입 제작까지 하루 동안 집중해서 진행하는 빌드 나이트 신청이 곧 시작됩니다.",
    linkUrl: "/events/build-night",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
];

export type EventFormState = {
  title: string;
  category: EventCategory;
  date: string;
  description: string;
  linkUrl: string;
};

const emptyForm: EventFormState = {
  title: "",
  category: "WHAT DOES",
  date: "",
  description: "",
  linkUrl: "",
};

function toFormState(event: EventRecord): EventFormState {
  return {
    title: event.title,
    category: event.category,
    date: event.date,
    description: event.description || "",
    linkUrl: event.linkUrl || "",
  };
}

function toEventInput(form: EventFormState): EventInput {
  return {
    title: form.title.trim(),
    category: form.category,
    date: form.date.trim(),
    description: form.description.trim() || null,
    linkUrl: form.linkUrl.trim() || null,
  };
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
      {label}
      {children}
    </label>
  );
}

export function EventForm({
  form,
  submitLabel,
  onCancel,
  onChange,
  onSubmit,
}: {
  form: EventFormState;
  submitLabel: string;
  onCancel?: () => void;
  onChange: (form: EventFormState) => void;
  onSubmit: () => void;
}) {
  const inputClass =
    "border border-gray-300 px-4 py-3 text-base font-bold normal-case tracking-normal text-black outline-none focus:border-black";

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title">
          <input value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} className={inputClass} />
        </Field>
        <Field label="Category">
          <select
            value={form.category}
            onChange={(event) => onChange({ ...form, category: event.target.value as EventCategory })}
            className={inputClass}
          >
            {eventTabs.map((tab) => (
              <option key={tab} value={tab}>
                {tab}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date">
          <input value={form.date} onChange={(event) => onChange({ ...form, date: event.target.value })} className={inputClass} />
        </Field>
        <Field label="Link URL">
          <input
            value={form.linkUrl}
            onChange={(event) => onChange({ ...form, linkUrl: event.target.value })}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Description">
        <textarea
          value={form.description}
          onChange={(event) => onChange({ ...form, description: event.target.value })}
          className="min-h-28 border border-gray-300 px-4 py-3 text-base font-bold normal-case tracking-normal text-black outline-none focus:border-black"
        />
      </Field>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSubmit}
          className="bg-black px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-neon-green hover:text-black"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="border border-black bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-black"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export function EventList({
  events,
  session,
  onEdit,
  onDelete,
  renderEditForm,
}: {
  events: EventRecord[];
  session: AdminSession | null;
  onEdit: (event: EventRecord) => void;
  onDelete: (event: EventRecord) => void;
  renderEditForm?: (event: EventRecord) => React.ReactNode;
}) {
  return (
    <div className="divide-y divide-gray-200 border-t border-gray-200">
      {events.map((event) => (
        <article key={event.id} className="event-post-link px-5 py-10 text-left transition-colors">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-start">
            <a href={event.linkUrl || "#"} className="block">
              <h2 className="text-xl font-black leading-snug text-black md:text-2xl">{event.title}</h2>
              {event.description && (
                <p className="mt-5 text-base leading-8 text-black md:text-lg">{event.description}</p>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-medium text-gray-400">
                <span className="font-bold text-neon-green">{event.category}</span>
                <span aria-hidden="true">|</span>
                <time dateTime={event.date.replaceAll(".", "-")}>{event.date}</time>
              </div>
            </a>

            {session && event.id > 0 && (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onEdit(event)}
                  className="border border-black bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-black"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(event)}
                  className="bg-black px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {renderEditForm?.(event)}
        </article>
      ))}
    </div>
  );
}

export default function Events() {
  const [events, setEvents] = React.useState<EventRecord[]>([]);
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">("loading");
  const [activeTab, setActiveTab] = React.useState<EventCategory>("WHAT DOES");
  const [session, setSession] = React.useState<AdminSession | null>(() => loadStoredAdminSession());
  const [adminMessage, setAdminMessage] = React.useState("");
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [createForm, setCreateForm] = React.useState<EventFormState>(emptyForm);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editForm, setEditForm] = React.useState<EventFormState>(emptyForm);

  const loadEventList = React.useCallback(async () => {
    setStatus("loading");
    try {
      const items = await fetchEvents();
      setEvents(items);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  React.useEffect(() => {
    void loadEventList();
  }, [loadEventList]);

  React.useEffect(() => {
    const refreshAdminSession = () => {
      const nextSession = loadStoredAdminSession();
      setSession(nextSession);
      if (!nextSession) {
        setIsCreateOpen(false);
        setEditingId(null);
      }
    };

    window.addEventListener(adminSessionChangedEvent, refreshAdminSession);
    window.addEventListener("storage", refreshAdminSession);

    return () => {
      window.removeEventListener(adminSessionChangedEvent, refreshAdminSession);
      window.removeEventListener("storage", refreshAdminSession);
    };
  }, []);

  const handleAdminError = (error: unknown, fallbackMessage: string) => {
    if (isUnauthorizedError(error)) {
      clearAdminSession();
      setSession(null);
      setIsCreateOpen(false);
      setEditingId(null);
      setAdminMessage("Admin session expired. Please log in again.");
      return;
    }

    setAdminMessage(fallbackMessage);
  };

  const handleCreate = async () => {
    if (!session) {
      return;
    }

    setAdminMessage("");
    try {
      await createEvent(session.token, toEventInput(createForm));
      setCreateForm(emptyForm);
      setIsCreateOpen(false);
      await loadEventList();
    } catch (error) {
      handleAdminError(error, "Event create failed.");
    }
  };

  const startEdit = (event: EventRecord) => {
    setEditingId(event.id);
    setEditForm(toFormState(event));
  };

  const handleUpdate = async (event: EventRecord) => {
    if (!session) {
      return;
    }

    setAdminMessage("");
    try {
      await updateEvent(session.token, event.id, toEventInput(editForm));
      setEditingId(null);
      await loadEventList();
    } catch (error) {
      handleAdminError(error, "Event update failed.");
    }
  };

  const handleDelete = async (event: EventRecord) => {
    if (!session || !window.confirm(`Delete "${event.title}"?`)) {
      return;
    }

    setAdminMessage("");
    try {
      await deleteEvent(session.token, event.id);
      if (editingId === event.id) {
        setEditingId(null);
      }
      await loadEventList();
    } catch (error) {
      handleAdminError(error, "Event delete failed.");
    }
  };

  const displayEvents = events.length > 0 ? events : sampleEvents;
  const visibleEvents = displayEvents.filter((event) => event.category === activeTab);

  return (
    <main className="min-h-screen flex-grow bg-white pb-28 pt-24">
      <section className="border-b border-gray-300">
        <div className="mx-auto w-full max-w-7xl px-6 pt-12 md:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-5 text-xs font-black uppercase tracking-[0.28em] text-neon-green">
              De-Butler Events
            </p>
            <h1 className="text-5xl font-black tracking-tight text-black md:text-7xl">All EVENTS</h1>
            <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-gray-600 md:text-lg">
              De-Butler의 활동 소개와 예정된 이벤트를 확인하세요.
            </p>
          </div>

          <div className="mt-20 flex flex-wrap justify-center gap-x-12 gap-y-4 pb-2">
            {eventTabs.map((tab) => {
              const isActive = activeTab === tab;

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`text-xl font-black transition-colors md:text-2xl ${
                    isActive ? "text-black" : "text-gray-300 hover:text-gray-500"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pt-14 md:px-10">
        {session && !isCreateOpen && (
          <div className="mb-12 flex justify-end">
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="bg-black px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-neon-green hover:text-black"
            >
              POST
            </button>
          </div>
        )}

        {session && isCreateOpen && (
          <section className="mb-12 grid gap-5 border border-gray-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-black uppercase tracking-tight text-black">Admin Controls</h2>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="border border-black bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-black"
              >
                Close
              </button>
            </div>
            <EventForm form={createForm} submitLabel="Create Event" onChange={setCreateForm} onSubmit={handleCreate} />

            {adminMessage && <p className="text-sm font-bold text-red-600">{adminMessage}</p>}
          </section>
        )}

        {status === "error" && (
          <div className="mb-10 border border-black bg-white p-8 text-lg font-bold text-black">
            Events could not be loaded. Sample events are shown for now.
          </div>
        )}

        <div className="text-center">
          <h2 className="text-4xl font-black tracking-tight text-black">{activeTab}</h2>
          <p className="mt-4 text-base text-gray-600">
            {activeTab === "WHAT DOES"
              ? "De-Butler가 만들어가는 활동을 만나보세요"
              : "곧 진행될 De-Butler 일정을 확인하세요"}
          </p>
        </div>

        <div className="mt-16">
          <EventList
            events={visibleEvents}
            session={session}
            onEdit={startEdit}
            onDelete={(event) => void handleDelete(event)}
            renderEditForm={(event) =>
              session && editingId === event.id ? (
                <div className="mt-8 border-t border-gray-200 pt-5">
                  <EventForm
                    form={editForm}
                    submitLabel="Save Changes"
                    onCancel={() => setEditingId(null)}
                    onChange={setEditForm}
                    onSubmit={() => void handleUpdate(event)}
                  />
                </div>
              ) : null
            }
          />
        </div>
      </section>
    </main>
  );
}
