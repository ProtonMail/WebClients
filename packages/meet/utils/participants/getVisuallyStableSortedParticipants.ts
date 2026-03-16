export const getVisuallyStableSortedParticipants = ({
    idealOrder,
    previousOrder,
    pageSize,
    selfView,
}: {
    idealOrder: string[];
    previousOrder: string[];
    pageSize: number;
    selfView: boolean;
}): string[] => {
    if (previousOrder.length === 0) {
        return idealOrder;
    }

    const offset = selfView ? 0 : 1;
    const idealSet = new Set(idealOrder);

    // Remove participants who left
    let stable = previousOrder.filter((id) => idealSet.has(id));

    // Append participants who joined
    const stableSet = new Set(stable);
    const added = idealOrder.filter((id) => !stableSet.has(id));
    stable = [...stable, ...added];

    // Ensure each page has the correct set of participants
    const paginatedCount = idealOrder.length - offset;
    const totalPages = Math.ceil(paginatedCount / pageSize);
    for (let page = 0; page < totalPages; page++) {
        const start = offset + page * pageSize;
        const end = Math.min(start + pageSize, idealOrder.length);
        const pageSlice = stable.slice(start, end);
        const idealPageSlice = idealOrder.slice(start, end);

        // Look up for swapping candidates
        const pageSet = new Set(pageSlice);
        const idealPageSet = new Set(idealPageSlice);
        const shouldMoveIn = idealPageSlice.filter((id) => !pageSet.has(id));
        const shouldMoveOut = pageSlice.filter((id) => !idealPageSet.has(id));

        // Swap participants to new page
        shouldMoveIn.forEach((inId, i) => {
            const outId = shouldMoveOut[i];
            if (outId) {
                const inIdx = stable.indexOf(inId);
                const outIdx = stable.indexOf(outId);
                stable[inIdx] = outId;
                stable[outIdx] = inId;
            }
        });
    }

    return stable;
};
