export const getFeature = (featureCode: string) => ({
    url: `core/v4/features/${featureCode}`,
    method: 'get',
});

/**
 * Get all feature flags of featureCodes
 * API route is a lot more powerfull with sorts, filters
 * It's just not needed at this point
 */
export const getFeatures = (featureCodes: string[]) => {
    if (featureCodes?.length < 1) {
        throw new Error(`Provide a list of feature code, getting them all at once is not recommended at this point`);
    }
    if (featureCodes.length > 150) {
        throw new Error(`You can't ask for more than 150 features at a time, use pagination instead`);
    }

    return {
        url: `core/v4/features`,
        method: 'get',
        params: {
            Code: featureCodes.join(','),
            Limit: featureCodes.length,
        },
    };
};

export const updateFeatureValue = (featureCode: string, Value: any) => ({
    url: `core/v4/features/${featureCode}/value`,
    method: 'put',
    data: { Value },
});
