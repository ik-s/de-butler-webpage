export type HackathonImageFit = 'cover' | 'contain';

export type HackathonRecord = {
  id: number;
  label: string;
  title: string;
  meta: string;
  imageUrl: string | null;
  imageFit: HackathonImageFit;
  description: string;
  linkUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateHackathonInput = {
  label: string;
  title: string;
  meta: string;
  imageUrl?: string | null;
  imageFit?: HackathonImageFit;
  description: string;
  linkUrl?: string | null;
  sortOrder?: number;
};

export type UpdateHackathonInput = Partial<CreateHackathonInput>;
