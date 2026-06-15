import { readScopedLocalStorageJson, writeScopedLocalStorageJson } from './lumoScopedLocalStorage';

const PAPER_TRAIL_PANEL_KEY = 'lumo-ai-paper-trail-panel';

export const hasDismissedPaperTrailPanel = (): boolean => {
    const parsed = readScopedLocalStorageJson<{ dismissed?: boolean } | null>(PAPER_TRAIL_PANEL_KEY, null);
    return parsed?.dismissed === true;
};

export const markPaperTrailPanelDismissed = (): void => {
    writeScopedLocalStorageJson(PAPER_TRAIL_PANEL_KEY, { dismissed: true, dismissedAt: Date.now() });
};
