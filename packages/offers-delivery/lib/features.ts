/** Splits a campaign body into one feature per non-blank line, trimmed. */
export const getFeatureLines = (body: string): string[] => {
    return body
        .split('\n')
        .map((feature) => feature.trim())
        .filter((feature) => feature !== '');
};
