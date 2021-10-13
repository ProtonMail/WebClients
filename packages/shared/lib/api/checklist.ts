export const getChecklist = (checklistId: string) => ({
    method: 'get',
    url: `core/v4/checklist/${checklistId}`,
});

export const seenCompletedChecklist = (checklistId: string) => ({
    method: 'post',
    url: `core/v4/checklist/${checklistId}/seen-completed-list`,
});
