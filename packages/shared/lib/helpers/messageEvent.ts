/**
 * Safely extracts the type property from a MessageEvent
 * Returns undefined if access is blocked due to cross-origin restrictions
 */
export const getMessageEventType = (event: MessageEvent): string | undefined => {
    try {
        if (!event.data) {
            return undefined;
        }
        return event.data.type;
    } catch (error) {
        // Cross-origin access blocked - this is the "Permission denied to access property 'type'" error
        return undefined;
    }
};
