/**
 * Calculate progress percentage (0 <= integer <= 100) of a certain process
 * that involves carrying out several tasks, that can either fail or be successful
 * @param successful   Number of tasks completed successfully
 * @param failed       Number of tasks that failed
 * @param total        Total number of tasks
 */
export const percentageProgress = (successful: number, failed: number, total: number) => {
    if (+total === 0) {
        // assume the process has not started
        return 0;
    }
    // in case successful + failed > total, do not allow progress > 100
    return Math.min(Math.floor(((+successful + failed) / total) * 100), 100);
};

/**
 * Combine progresses of several processes with predefined allocation percentages
 * @param processes                 Processes to be combined. Format: { allocated, successful, failed, total}
 * @param processes.allocated      Allocated percentage for a process. E.g. 0.25
 *
 * @return Combined progrees
 */
export const combineProgress = (
    processes: { allocated: number; successful: number; failed: number; total: number }[] = []
) => {
    const { combinedTotal, combinedAllocations, progresses } = processes.reduce<{
        combinedTotal: number;
        combinedAllocations: number;
        progresses: number[];
    }>(
        (acc, { allocated, successful, failed, total }) => {
            acc.combinedTotal += total;
            acc.combinedAllocations += allocated;
            acc.progresses.push(percentageProgress(successful, failed, total));
            return acc;
        },
        { combinedTotal: 0, combinedAllocations: 0, progresses: [] }
    );
    if (combinedAllocations !== 1 && !!processes.length) {
        throw new Error('Allocations must add up to one');
    }
    if (!combinedTotal) {
        return 0;
    }
    const combinedProgress = processes.reduce((acc, { allocated, total }, i) => {
        // set progress to 100 if there are no tasks to be performed for this process,
        // but there are tasks in other processes
        const progress = allocated * (!total && !!combinedTotal ? 100 : progresses[i]);
        return acc + progress;
    }, 0);

    return Math.round(combinedProgress);
};
