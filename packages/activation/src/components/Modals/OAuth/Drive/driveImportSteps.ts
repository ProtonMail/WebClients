/** Steps of the Google Drive import flow, shown as "x of 4" in the step modals. */
export const DRIVE_IMPORT_STEPS = {
    intro: { current: 1, total: 4 },
    grantAccess: { current: 2, total: 4 },
    preparing: { current: 3, total: 4 },
    started: { current: 4, total: 4 },
} as const;
