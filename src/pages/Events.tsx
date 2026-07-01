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
const eventsPerPage = 5;
const upcomingViewTabs = [
  { id: "scheduled", label: "진행될 일정" },
  { id: "done", label: "지난 일정" },
] as const;

export type UpcomingView = (typeof upcomingViewTabs)[number]["id"];

export type EventFormState = {
  title: string;
  category: EventCategory;
  date: string;
  description: string;
  linkUrl: string;
  done: boolean;
};

const emptyForm: EventFormState = {
  title: "",
  category: "WHAT DOES",
  date: "",
  description: "",
  linkUrl: "",
  done: false,
};

function toFormState(event: EventRecord): EventFormState {
  return {
    title: event.title,
    category: event.category,
    date: event.date,
    description: event.description || "",
    linkUrl: event.linkUrl || "",
    done: event.done,
  };
}

function toEventInput(form: EventFormState): EventInput {
  return {
    title: form.title.trim(),
    category: form.category,
    date: form.date.trim(),
    description: form.description.trim() || null,
    linkUrl: form.category === "UPCOMING" ? null : form.linkUrl.trim() || null,
    done: form.category === "UPCOMING" ? form.done : false,
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
  const isUpcoming = form.category === "UPCOMING";

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title">
          <input value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} className={inputClass} />
        </Field>
        <Field label="Category">
          <select
            value={form.category}
            onChange={(event) => {
              const category = event.target.value as EventCategory;
              onChange({
                ...form,
                category,
                linkUrl: category === "UPCOMING" ? "" : form.linkUrl,
                done: category === "UPCOMING" ? form.done : false,
              });
            }}
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
          <input type="date" value={form.date} onChange={(event) => onChange({ ...form, date: event.target.value })} className={inputClass} />
        </Field>
        <Field label="Link URL">
          <input
            value={isUpcoming ? "" : form.linkUrl}
            readOnly={isUpcoming}
            title={isUpcoming ? "UPCOMING posts do not use a link URL." : undefined}
            onChange={(event) => onChange({ ...form, linkUrl: event.target.value })}
            className={`${inputClass} ${isUpcoming ? "cursor-not-allowed" : ""}`}
          />
        </Field>
        {isUpcoming && (
          <Field label="Done">
            <select
              value={String(form.done)}
              onChange={(event) => onChange({ ...form, done: event.target.value === "true" })}
              className={inputClass}
            >
              <option value="false">false</option>
              <option value="true">true</option>
            </select>
          </Field>
        )}
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

export function EventEditModal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 px-5 py-16">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-4xl border border-black bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-black">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="border border-black bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-black"
          >
            Close
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function splitUpcomingEvents(events: EventRecord[]) {
  return {
    scheduled: events.filter((event) => !event.done),
    done: events.filter((event) => event.done),
  };
}

export function paginateEvents(events: EventRecord[], page: number, perPage = eventsPerPage) {
  const totalPages = Math.max(1, Math.ceil(events.length / perPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * perPage;

  return {
    currentPage,
    totalPages,
    items: events.slice(startIndex, startIndex + perPage),
  };
}

export function selectUpcomingViewEvents(
  groups: ReturnType<typeof splitUpcomingEvents>,
  view: UpcomingView,
  donePage: number,
) {
  if (view === "done") {
    return paginateEvents(groups.done, donePage);
  }

  return {
    currentPage: 1,
    totalPages: 1,
    items: groups.scheduled,
  };
}

export function UpcomingViewSelector({
  activeView,
  onChange,
}: {
  activeView: UpcomingView;
  onChange: (view: UpcomingView) => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-10 gap-y-3">
      {upcomingViewTabs.map((view) => {
        const isActive = activeView === view.id;

        return (
          <button
            key={view.id}
            type="button"
            onClick={() => onChange(view.id)}
            className={`text-left text-2xl font-black transition-colors ${
              isActive ? "text-black" : "text-gray-300 hover:text-gray-500"
            }`}
          >
            {view.label}
          </button>
        );
      })}
    </div>
  );
}

function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const buttonClass =
    "h-9 min-w-9 border border-black bg-white px-3 text-sm font-black text-black transition-colors hover:bg-neon-green disabled:border-gray-300 disabled:text-gray-300 disabled:hover:bg-white";

  return (
    <nav aria-label="Event pages" className="mt-10 flex items-center justify-center gap-2">
      <button type="button" disabled={currentPage === 1} onClick={() => onPageChange(1)} className={buttonClass}>
        &lt;&lt;
      </button>
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={buttonClass}
      >
        &lt;
      </button>
      <span className="flex h-10 min-w-10 items-center justify-center bg-black px-3 text-sm font-black text-white">
        {currentPage}
      </span>
      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={buttonClass}
      >
        &gt;
      </button>
      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(totalPages)}
        className={buttonClass}
      >
        &gt;&gt;
      </button>
    </nav>
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
    <div className="grid gap-5">
      {events.map((event) => {
        const shouldOpenInNewTab = event.category === "WHAT DOES" && Boolean(event.linkUrl);

        return (
          <article
            key={event.id}
            className="event-post-link rounded-md border border-gray-200 bg-white px-5 py-8 text-left transition-colors hover:bg-neon-green/10 md:px-6"
          >
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-start">
              <a
                href={event.linkUrl || "#"}
                target={shouldOpenInNewTab ? "_blank" : undefined}
                rel={shouldOpenInNewTab ? "noreferrer" : undefined}
                className="block"
              >
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

              {session && (
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
        );
      })}
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
  const [whatDoesPage, setWhatDoesPage] = React.useState(1);
  const [doneUpcomingPage, setDoneUpcomingPage] = React.useState(1);
  const [activeUpcomingView, setActiveUpcomingView] = React.useState<UpcomingView>("scheduled");

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
    setWhatDoesPage(1);
    setDoneUpcomingPage(1);
    setActiveUpcomingView("scheduled");
  }, [activeTab]);

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
    setAdminMessage("");
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

  const visibleEvents = events.filter((event) => event.category === activeTab);
  const upcomingGroups = splitUpcomingEvents(visibleEvents);
  const paginatedWhatDoes = paginateEvents(visibleEvents, whatDoesPage);
  const selectedUpcomingEvents = selectUpcomingViewEvents(upcomingGroups, activeUpcomingView, doneUpcomingPage);
  const editingEvent = editingId ? events.find((event) => event.id === editingId) : null;

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

        {session && adminMessage && !isCreateOpen && (
          <p className="mb-10 text-right text-sm font-bold text-red-600">{adminMessage}</p>
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
          {activeTab === "UPCOMING" ? (
            <section>
              <UpcomingViewSelector activeView={activeUpcomingView} onChange={setActiveUpcomingView} />

              <EventList
                events={selectedUpcomingEvents.items}
                session={session}
                onEdit={startEdit}
                onDelete={(event) => void handleDelete(event)}
              />

              {activeUpcomingView === "done" && (
                <PaginationControls
                  currentPage={selectedUpcomingEvents.currentPage}
                  totalPages={selectedUpcomingEvents.totalPages}
                  onPageChange={setDoneUpcomingPage}
                />
              )}
            </section>
          ) : (
            <>
              <EventList
                events={paginatedWhatDoes.items}
                session={session}
                onEdit={startEdit}
                onDelete={(event) => void handleDelete(event)}
              />
              <PaginationControls
                currentPage={paginatedWhatDoes.currentPage}
                totalPages={paginatedWhatDoes.totalPages}
                onPageChange={setWhatDoesPage}
              />
            </>
          )}
        </div>
        {session && editingEvent && (
          <EventEditModal title="Edit Event" onClose={() => setEditingId(null)}>
            <EventForm
              form={editForm}
              submitLabel="Save Changes"
              onCancel={() => setEditingId(null)}
              onChange={setEditForm}
              onSubmit={() => void handleUpdate(editingEvent)}
            />
          </EventEditModal>
        )}
      </section>
    </main>
  );
}
