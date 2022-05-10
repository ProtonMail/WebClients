export const getExperiment = (experimentCode: string) => ({
    url: `core/v4/experiments/${experimentCode}`,
    method: 'get',
});

/**
 * Get all experiment flags of experimentCodes
 * API route is a lot more powerfull with sorts, filters
 * It's just not needed at this point
 */
export const getExperiments = () => {
    return {
        url: `core/v4/experiments`,
        method: 'get',
    };
};
