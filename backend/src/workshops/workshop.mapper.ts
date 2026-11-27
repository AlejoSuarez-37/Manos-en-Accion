import { PDF_RULE, WORKSHOP_IMAGE_RULE } from '../storage/image-rules.js';
import type { StorageService } from '../storage/storage.service.js';
import type { PublicWorkshop, Workshop } from './entities/workshop.entity.js';

export const toPublicWorkshop = (
  workshop: Workshop,
  storage: StorageService,
): PublicWorkshop => ({
  id: workshop.id,
  title: workshop.title,
  description: workshop.description,
  imageUrl: storage.getUrl(workshop.imageKey, WORKSHOP_IMAGE_RULE),
  pdfUrl: workshop.pdfKey
    ? storage.getPdfUrl(
        workshop.pdfKey,
        PDF_RULE,
        workshop.pdfName ?? undefined,
      )
    : null,
  pdfName: workshop.pdfName ?? null,
  focusAreaId: workshop.focusArea.id,
});
