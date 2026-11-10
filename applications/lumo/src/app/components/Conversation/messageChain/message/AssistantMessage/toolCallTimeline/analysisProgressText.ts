import { c } from 'ttag';

import type { AnalysisProgress } from '../../../../../../services/analysisProgressStore';

/** A file with this many parts or more is long enough to say that it is a lot of work. */
export const BIG_FILE_PARTS = 6;
/** How often the line changes, so it can be read without flickering. */
export const LINE_INTERVAL_MS = 6_000;

const READING: readonly (() => string)[] = [
    () => c('collider_2025:Reasoning').t`Pawing through the pages`,
    () => c('collider_2025:Reasoning').t`Sniffing out the important bits`,
    () => c('collider_2025:Reasoning').t`Chasing down every last detail`,
    () => c('collider_2025:Reasoning').t`Sharpening claws on the footnotes`,
    () => c('collider_2025:Reasoning').t`Knocking a few loose facts off the table`,
    () => c('collider_2025:Reasoning').t`Reading this with feline focus`,
    () => c('collider_2025:Reasoning').t`Not a single page escapes the whiskers`,
    () => c('collider_2025:Reasoning').t`Purr-using the fine print`,
];

const MERGING: readonly (() => string)[] = [
    () => c('collider_2025:Reasoning').t`Licking the notes into shape`,
    () => c('collider_2025:Reasoning').t`Gathering everything into one cosy pile`,
];

/** The playful line for the moment: which one shows changes over time and differs between runs. */
export function getAnalysisLine(progress: Pick<AnalysisProgress, 'phase'>, tick: number, seed: number): string {
    const lines = progress.phase === 'merging' ? MERGING : READING;
    return lines[(seed + tick) % lines.length]!();
}

/** "Part 7 of 18", or nothing before the first part is done and once reading is over. */
export function getAnalysisCount({ phase, done, total }: AnalysisProgress): string | undefined {
    if (phase === 'merging' || total < 2) {
        return undefined;
    }
    const shown = Math.min(done + 1, total);
    // translator: How far an assistant has got reading a long file, e.g. "Part 7 of 18".
    return c('collider_2025:Reasoning').t`Part ${shown} of ${total}`;
}

/** Said once, for long files, so nobody wonders why it takes a while. */
export function getAnalysisEffortNote({ total }: Pick<AnalysisProgress, 'total'>): string | undefined {
    return total >= BIG_FILE_PARTS
        ? // translator: Shown while the assistant reads a very long file. It takes a minute or two.
          c('collider_2025:Reasoning').t`This is a big one, so it can take a minute or two. Good thing cats are patient.`
        : undefined;
}

/** A stable number for a call id, so the same run keeps its starting line while others differ. */
export function seedFromId(id: string | undefined): number {
    let hash = 0;
    for (const char of id ?? '') {
        hash = (hash * 31 + char.charCodeAt(0)) | 0;
    }
    return Math.abs(hash);
}
