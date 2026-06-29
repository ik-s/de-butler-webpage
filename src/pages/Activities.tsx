import React from "react";
import { motion } from "motion/react";

import {
  createActivity,
  deleteActivity,
  fetchActivities,
  updateActivity,
  uploadActivityImageFile,
} from "../lib/activitiesApi";
import { isUnauthorizedError } from "../lib/apiError";
import { adminSessionChangedEvent, clearAdminSession, loadStoredAdminSession } from "../lib/adminSession";
import type { Activity, ActivityInput, AdminSession } from "../lib/activitiesApi";

type ActivityFormState = {
  title: string;
  category: string;
  date: string;
  description: string;
  imageFile: File | null;
};

const activityCategories = ["Session", "Event", "Build", "Network"] as const;

const emptyForm: ActivityFormState = {
  title: "",
  category: "Session",
  date: "",
  description: "",
  imageFile: null,
};

function toDateInputValue(value: string): string {
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(value)) {
    return value.replaceAll(".", "-");
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function toFormState(activity: Activity): ActivityFormState {
  const category = activity.category && activityCategories.includes(activity.category as (typeof activityCategories)[number])
    ? activity.category
    : "Session";

  return {
    title: activity.title,
    category,
    date: toDateInputValue(activity.date),
    description: activity.description || "",
    imageFile: null,
  };
}

function toActivityInput(form: ActivityFormState, imageUrl?: string | null): ActivityInput {
  return {
    title: form.title.trim(),
    category: form.category.trim() || null,
    date: form.date.trim(),
    description: form.description.trim() || null,
    imageUrl,
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

export function ActivityForm({
  form,
  submitLabel,
  currentImageUrl,
  onCancel,
  onChange,
  onSubmit,
}: {
  form: ActivityFormState;
  submitLabel: string;
  currentImageUrl?: string | null;
  onCancel?: () => void;
  onChange: (form: ActivityFormState) => void;
  onSubmit: () => void;
}) {
  const inputClass = "h-12 border border-gray-300 bg-white px-4 text-base font-bold text-black outline-none focus:border-black";

  return (
    <div className="grid gap-4 border border-black bg-white p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title">
          <input value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} className={inputClass} />
        </Field>
        <Field label="Category">
          <select
            value={form.category}
            onChange={(event) => onChange({ ...form, category: event.target.value })}
            className={inputClass}
          >
            {activityCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date">
          <input type="date" value={form.date} onChange={(event) => onChange({ ...form, date: event.target.value })} className={inputClass} />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          value={form.description}
          onChange={(event) => onChange({ ...form, description: event.target.value })}
          className="min-h-28 resize-y border border-gray-300 bg-white px-4 py-3 text-base font-semibold text-black outline-none focus:border-black"
        />
      </Field>

      <Field label="Image">
        {currentImageUrl && (
          <div className="grid gap-2">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-black">Current selected image</p>
            <img
              src={currentImageUrl}
              alt="Current selected image"
              className="h-40 w-full border border-gray-200 object-cover"
            />
            <p className="text-xs font-bold normal-case tracking-normal text-slate-500">
              Keep this image unless you choose a new file.
            </p>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(event) => onChange({ ...form, imageFile: event.target.files?.[0] || null })}
          className="border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-black"
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

export function ActivityEditModal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4 py-8">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-edit-modal-title"
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto border border-black bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 id="activity-edit-modal-title" className="text-2xl font-black uppercase tracking-tight text-black">
            {title}
          </h2>
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

export default function Activities() {
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">("loading");
  const [session, setSession] = React.useState<AdminSession | null>(() => loadStoredAdminSession());
  const [adminMessage, setAdminMessage] = React.useState("");
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [createForm, setCreateForm] = React.useState<ActivityFormState>(emptyForm);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editForm, setEditForm] = React.useState<ActivityFormState>(emptyForm);

  const loadActivities = React.useCallback(async () => {
    setStatus("loading");
    try {
      const items = await fetchActivities();
      setActivities(items);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  React.useEffect(() => {
    void loadActivities();
  }, [loadActivities]);

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

  const uploadImageIfNeeded = async (form: ActivityFormState, existingImageUrl?: string | null) => {
    if (!session) {
      throw new Error("Admin login required");
    }

    if (!form.imageFile) {
      return existingImageUrl ?? null;
    }

    const upload = await uploadActivityImageFile(session.token, form.imageFile);
    return upload.imageUrl;
  };

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
      const imageUrl = await uploadImageIfNeeded(createForm);
      await createActivity(session.token, toActivityInput(createForm, imageUrl));
      setCreateForm(emptyForm);
      setIsCreateOpen(false);
      await loadActivities();
    } catch (error) {
      handleAdminError(error, "Activity create failed.");
    }
  };

  const startEdit = (activity: Activity) => {
    setEditingId(activity.id);
    setEditForm(toFormState(activity));
    setAdminMessage("");
  };

  const handleUpdate = async (activity: Activity) => {
    if (!session) {
      return;
    }

    setAdminMessage("");
    try {
      const imageUrl = await uploadImageIfNeeded(editForm, activity.imageUrl);
      await updateActivity(session.token, activity.id, toActivityInput(editForm, imageUrl));
      setEditingId(null);
      setEditForm(emptyForm);
      await loadActivities();
    } catch (error) {
      handleAdminError(error, "Activity update failed.");
    }
  };

  const handleDelete = async (activity: Activity) => {
    if (!session || !window.confirm(`Delete "${activity.title}"?`)) {
      return;
    }

    setAdminMessage("");
    try {
      await deleteActivity(session.token, activity.id);
      if (editingId === activity.id) {
        setEditingId(null);
      }
      await loadActivities();
    } catch (error) {
      handleAdminError(error, "Activity delete failed.");
    }
  };

  const editingActivity = editingId ? activities.find((activity) => activity.id === editingId) : null;

  return (
    <main className="min-h-screen flex-grow bg-neutral-50 pb-28 pt-24">
      <section className="border-b border-gray-200">
        <div className="mx-auto w-full max-w-7xl px-6 py-12 md:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-5 text-xs font-black uppercase tracking-[0.28em] text-neon-green">
              De-Butler Activities
            </p>
            <h1 className="text-5xl font-black tracking-tight text-black md:text-7xl">All ACTIVITIES</h1>
            <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-gray-600 md:text-lg">
              De-Butler의 활동 기록과 주요 프로젝트를 확인하세요.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pt-14 md:px-10">
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
            <ActivityForm form={createForm} submitLabel="Create Activity" onChange={setCreateForm} onSubmit={handleCreate} />

            {adminMessage && <p className="text-sm font-bold text-red-600">{adminMessage}</p>}
          </section>
        )}

        {status === "loading" && (
          <div className="border border-gray-200 bg-white p-8 text-lg font-bold text-slate-500">
            Loading activities...
          </div>
        )}

        {status === "error" && (
          <div className="border border-black bg-white p-8 text-lg font-bold text-black">
            Activities could not be loaded. Start the backend server and refresh this page.
          </div>
        )}

        {status === "ready" && activities.length === 0 && (
          <div className="border border-gray-200 bg-white p-8 text-lg font-bold text-slate-500">
            No activities have been published yet.
          </div>
        )}

        {status === "ready" && activities.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {activities.map((activity, index) => (
              <motion.article
                key={activity.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                whileHover={{ y: -4 }}
                className="overflow-hidden border border-gray-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
              >
                {activity.imageUrl ? (
                  <img
                    src={activity.imageUrl}
                    alt={activity.title}
                    loading="lazy"
                    className="aspect-[4/3] w-full border-b border-gray-100 object-cover"
                  />
                ) : (
                  <div className="aspect-[4/3] w-full border-b border-gray-100 bg-[linear-gradient(135deg,#f4f4f5_0%,#e5e7eb_50%,#f8fafc_100%)]" />
                )}

                <div className="p-7">
                  <div className="mb-8 flex items-center justify-between gap-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neon-green">
                      {activity.category || "Activity"}
                    </span>
                    <span className="font-mono text-xs font-bold uppercase text-gray-400">{activity.date}</span>
                  </div>
                  <h2 className="text-2xl font-black uppercase leading-tight tracking-tight text-black">
                    {activity.title}
                  </h2>
                  {activity.description && (
                    <p className="mt-6 text-base leading-relaxed text-slate-600">{activity.description}</p>
                  )}

                  {session && (
                    <div className="mt-7 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => startEdit(activity)}
                        className="border border-black bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-black"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(activity)}
                        className="bg-black px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {session && editingActivity && (
          <ActivityEditModal title="Edit Activity" onClose={() => setEditingId(null)}>
            <ActivityForm
              form={editForm}
              submitLabel="Save Changes"
              currentImageUrl={editingActivity.imageUrl}
              onCancel={() => setEditingId(null)}
              onChange={setEditForm}
              onSubmit={() => void handleUpdate(editingActivity)}
            />
          </ActivityEditModal>
        )}
      </section>
    </main>
  );
}
