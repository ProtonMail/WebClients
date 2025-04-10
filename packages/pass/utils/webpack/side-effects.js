export const sideEffectsRule = {
    test: /node_modules\/(@unleash\/proxy-client-react|unleash-proxy-client)/,
    sideEffects: false,
};
