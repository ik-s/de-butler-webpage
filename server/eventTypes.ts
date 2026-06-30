export type EventCategory = 'WHAT DOES' | 'UPCOMING';

export type EventRecord = {
  id: number;
  title: string;
  category: EventCategory;
  date: string;
  description: string | null;
  linkUrl: string | null;
  done: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateEventInput = {
  title: string;
  category?: EventCategory;
  date: string;
  description?: string | null;
  linkUrl?: string | null;
  done?: boolean;
};

export type UpdateEventInput = Partial<CreateEventInput>;
