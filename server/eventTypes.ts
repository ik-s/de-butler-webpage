export type EventCategory = 'WHAT DOES' | 'UPCOMING';

export type EventRecord = {
  id: number;
  title: string;
  category: EventCategory;
  date: string;
  description: string | null;
  linkUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateEventInput = {
  title: string;
  category?: EventCategory;
  date: string;
  description?: string | null;
  linkUrl?: string | null;
};

export type UpdateEventInput = Partial<CreateEventInput>;
