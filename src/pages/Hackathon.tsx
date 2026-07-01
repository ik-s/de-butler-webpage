import React from "react";
import { motion } from "motion/react";

import { isUnauthorizedError } from "../lib/apiError";
import { adminSessionChangedEvent, clearAdminSession, loadStoredAdminSession } from "../lib/adminSession";
import type { AdminSession } from "../lib/activitiesApi";
import {
  createHackathon,
  deleteHackathon,
  fetchHackathons,
  updateHackathon,
} from "../lib/hackathonsApi";
import type { HackathonImageFit, HackathonInput, HackathonRecord } from "../lib/hackathonsApi";

type HackathonFormState = {
  label: string;
  title: string;
  meta: string;
  imageUrl: string;
  imageFit: HackathonImageFit;
  description: string;
  linkUrl: string;
  sortOrder: string;
};

const emptyForm: HackathonFormState = {
  label: "",
  title: "",
  meta: "",
  imageUrl: "",
  imageFit: "cover",
  description: "",
  linkUrl: "",
  sortOrder: "0",
};

function toFormState(card: HackathonRecord): HackathonFormState {
  return {
    label: card.label,
    title: card.title,
    meta: card.meta,
    imageUrl: card.imageUrl || "",
    imageFit: card.imageFit,
    description: card.description,
    linkUrl: card.linkUrl || "",
    sortOrder: String(card.sortOrder),
  };
}

function toHackathonInput(form: HackathonFormState): HackathonInput {
  return {
    label: form.label.trim(),
    title: form.title.trim(),
    meta: form.meta.trim(),
    imageUrl: form.imageUrl.trim() || null,
    imageFit: form.imageFit,
    description: form.description.trim(),
    linkUrl: form.linkUrl.trim() || null,
    sortOrder: Number(form.sortOrder) || 0,
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

export function HackathonForm({
  form,
  submitLabel,
  onCancel,
  onChange,
  onSubmit,
}: {
  form: HackathonFormState;
  submitLabel: string;
  onCancel?: () => void;
  onChange: (form: HackathonFormState) => void;
  onSubmit: () => void;
}) {
  const inputClass =
    "border border-gray-300 px-4 py-3 text-base font-bold normal-case tracking-normal text-black outline-none focus:border-black";

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Label">
          <input value={form.label} onChange={(event) => onChange({ ...form, label: event.target.value })} className={inputClass} />
        </Field>
        <Field label="Title">
          <input value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} className={inputClass} />
        </Field>
        <Field label="Meta">
          <input value={form.meta} onChange={(event) => onChange({ ...form, meta: event.target.value })} className={inputClass} />
        </Field>
        <Field label="Sort Order">
          <input
            type="number"
            value={form.sortOrder}
            onChange={(event) => onChange({ ...form, sortOrder: event.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Image URL">
          <input value={form.imageUrl} onChange={(event) => onChange({ ...form, imageUrl: event.target.value })} className={inputClass} />
        </Field>
        <Field label="Image Fit">
          <select
            value={form.imageFit}
            onChange={(event) => onChange({ ...form, imageFit: event.target.value as HackathonImageFit })}
            className={inputClass}
          >
            <option value="cover">cover</option>
            <option value="contain">contain</option>
          </select>
        </Field>
        <Field label="Link URL">
          <input value={form.linkUrl} onChange={(event) => onChange({ ...form, linkUrl: event.target.value })} className={inputClass} />
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

function HackathonEditModal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 px-5 py-16">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Edit Hackathon"
        className="w-full max-w-4xl border border-black bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-black">Edit Hackathon</h2>
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

export function HackathonList({
  cards,
  session,
  onEdit,
  onDelete,
}: {
  cards: HackathonRecord[];
  session: AdminSession | null;
  onEdit: (card: HackathonRecord) => void;
  onDelete: (card: HackathonRecord) => void;
}) {
  return (
    <div className="space-y-10">
      {cards.map((hackathon, index) => (
        <motion.article
          key={hackathon.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
          className="group mx-auto max-w-6xl overflow-hidden rounded-lg border border-black bg-white"
        >
          <div className="aspect-[21/9] min-h-64 overflow-hidden bg-black">
            {hackathon.imageUrl ? (
              <img
                src={hackathon.imageUrl}
                alt={hackathon.title}
                className={`h-full w-full transition-transform duration-500 group-hover:scale-[1.03] ${
                  hackathon.imageFit === "contain" ? "object-contain p-10" : "object-cover"
                }`}
              />
            ) : (
              <div className="h-full w-full bg-white" />
            )}
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
              <div className="flex flex-wrap gap-3">
                {hackathon.linkUrl && (
                  <a
                    href={hackathon.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex border border-black px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-black transition-colors hover:bg-neon-green"
                  >
                    자세히 보기 -&gt;
                  </a>
                )}
                {session && (
                  <>
                    <button
                      type="button"
                      onClick={() => onEdit(hackathon)}
                      className="border border-black bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-black"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(hackathon)}
                      className="bg-black px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.article>
      ))}
    </div>
  );
}

export default function Hackathon() {
  const [cards, setCards] = React.useState<HackathonRecord[]>([]);
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">("loading");
  const [session, setSession] = React.useState<AdminSession | null>(() => loadStoredAdminSession());
  const [adminMessage, setAdminMessage] = React.useState("");
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [createForm, setCreateForm] = React.useState<HackathonFormState>(emptyForm);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editForm, setEditForm] = React.useState<HackathonFormState>(emptyForm);

  const loadCards = React.useCallback(async () => {
    setStatus("loading");
    try {
      setCards(await fetchHackathons());
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  React.useEffect(() => {
    void loadCards();
  }, [loadCards]);

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
      await createHackathon(session.token, toHackathonInput(createForm));
      setCreateForm(emptyForm);
      setIsCreateOpen(false);
      await loadCards();
    } catch (error) {
      handleAdminError(error, "Hackathon create failed.");
    }
  };

  const startEdit = (card: HackathonRecord) => {
    setAdminMessage("");
    setEditingId(card.id);
    setEditForm(toFormState(card));
  };

  const handleUpdate = async (card: HackathonRecord) => {
    if (!session) {
      return;
    }

    setAdminMessage("");
    try {
      await updateHackathon(session.token, card.id, toHackathonInput(editForm));
      setEditingId(null);
      await loadCards();
    } catch (error) {
      handleAdminError(error, "Hackathon update failed.");
    }
  };

  const handleDelete = async (card: HackathonRecord) => {
    if (!session || !window.confirm(`Delete "${card.title}"?`)) {
      return;
    }

    setAdminMessage("");
    try {
      await deleteHackathon(session.token, card.id);
      if (editingId === card.id) {
        setEditingId(null);
      }
      await loadCards();
    } catch (error) {
      handleAdminError(error, "Hackathon delete failed.");
    }
  };

  const editingCard = editingId ? cards.find((card) => card.id === editingId) : null;

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

        {session && !isCreateOpen && (
          <div className="mx-auto mb-10 flex max-w-6xl justify-end">
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
          <section className="mx-auto mb-10 grid max-w-6xl gap-5 border border-gray-200 bg-white p-5">
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
            <HackathonForm
              form={createForm}
              submitLabel="Create Hackathon"
              onChange={setCreateForm}
              onSubmit={handleCreate}
            />
          </section>
        )}

        {adminMessage && <p className="mx-auto mb-8 max-w-6xl text-right text-sm font-bold text-red-600">{adminMessage}</p>}
        {status === "loading" && <p className="text-center text-sm font-bold uppercase tracking-[0.18em] text-gray-400">Loading hackathons</p>}
        {status === "error" && <p className="text-center text-sm font-bold text-red-600">Hackathons could not be loaded.</p>}
        {status === "ready" && (
          <HackathonList
            cards={cards}
            session={session}
            onEdit={startEdit}
            onDelete={(card) => void handleDelete(card)}
          />
        )}

        {session && editingCard && (
          <HackathonEditModal onClose={() => setEditingId(null)}>
            <HackathonForm
              form={editForm}
              submitLabel="Save Changes"
              onCancel={() => setEditingId(null)}
              onChange={setEditForm}
              onSubmit={() => void handleUpdate(editingCard)}
            />
          </HackathonEditModal>
        )}
      </section>
    </main>
  );
}
