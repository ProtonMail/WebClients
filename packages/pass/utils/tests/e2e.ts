/* eslint-disable no-console */
type E2eMessageType = 'shadowRoot';

/**
 * Send pointers to e2e tests, aka playwright, only when E2E_TESTS flag is set
 * It uses console.debug as playwright is able to listen to it and catch handlers
 * Main use case is to send closed shadow roots pointers as they are not accessible otherwise
 */
export const sendToE2eTests = (type: E2eMessageType, ...args: any[]) => {
    if (E2E_TESTS) console.debug(`E2E.${type}`, ...args);
};
