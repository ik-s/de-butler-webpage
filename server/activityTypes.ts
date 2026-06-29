export type ActivityRecord = {
  id: number;
  title: string;
  category: string | null;
  date: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateActivityInput = {
  title: string;
  category?: string | null;
  date: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
};

export type UpdateActivityInput = Partial<CreateActivityInput>;
