export const getChecklist = (checklistId: string) => ({
    method: 'get',
    url: `core/v4/checklist/${checklistId}`,
});
