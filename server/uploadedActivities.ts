import fs from 'node:fs';
import path from 'node:path';

import { ActivitiesRepository } from './activitiesRepository.ts';

const supportedImageExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.webp']);

function titleFromFileName(fileName: string): string {
  return path
    .basename(fileName, path.extname(fileName))
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function dateFromMtime(mtime: Date): string {
  const year = mtime.getFullYear();
  const month = String(mtime.getMonth() + 1).padStart(2, '0');
  const day = String(mtime.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function activityImageUrl(fileName: string): string {
  return `/uploads/activities/${encodeURIComponent(fileName)}`;
}

export function syncUploadedActivities(repository: ActivitiesRepository, activitiesUploadRoot: string): void {
  fs.mkdirSync(activitiesUploadRoot, { recursive: true });

  const existingImageUrls = new Set(
    repository
      .list()
      .map((activity) => activity.imageUrl)
      .filter((imageUrl): imageUrl is string => Boolean(imageUrl)),
  );

  const files = fs
    .readdirSync(activitiesUploadRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && supportedImageExtensions.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  files.forEach((fileName, index) => {
    const imageUrl = activityImageUrl(fileName);
    if (existingImageUrls.has(imageUrl)) {
      return;
    }

    const stat = fs.statSync(path.join(activitiesUploadRoot, fileName));
    repository.create({
      title: titleFromFileName(fileName),
      category: 'Session',
      date: dateFromMtime(stat.mtime),
      description: null,
      imageUrl,
      sortOrder: existingImageUrls.size + index,
    });
    existingImageUrls.add(imageUrl);
  });
}
