import { pageElements } from './elements.js';
import { formatFileSize } from '../utils/format-file-size.js';

/** 成功した画像だけを集計し、変換前後の合計容量を表示します。 */
export function renderConversionSummary(completedEntries) {
  pageElements.summary.hidden = completedEntries.length === 0;
  if (completedEntries.length === 0) return;

  const originalBytes = completedEntries.reduce(
    (totalBytes, imageEntry) => totalBytes + imageEntry.originalFile.size, 0,
  );
  const convertedBytes = completedEntries.reduce(
    (totalBytes, imageEntry) => totalBytes + imageEntry.convertedBlob.size, 0,
  );
  const reductionPercent = originalBytes ? (1 - convertedBytes / originalBytes) * 100 : 0;
  const summaryHeading = document.createElement('strong');
  summaryHeading.textContent = reductionPercent >= 0
    ? `容量を${reductionPercent.toFixed(1)}%削減`
    : `容量が${Math.abs(reductionPercent).toFixed(1)}%増加`;
  const summaryDetail = document.createElement('span');
  summaryDetail.textContent = `${formatFileSize(originalBytes)} → ${formatFileSize(convertedBytes)} ・ ${completedEntries.length}枚変換済み`;
  pageElements.summary.replaceChildren(summaryHeading, summaryDetail);
}

