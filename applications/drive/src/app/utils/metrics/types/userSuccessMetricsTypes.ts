export enum UserAvailabilityTypes {
    coreFeatureError = 'coreFeatureError',
    recoveredError = 'recoveredError',
    handledError = 'handledError',
    unhandledError = 'unhandledError',
}

/**
 * Interface for the Metric Shared Worker
 */
export interface MetricSharedWorkerInterface {
    /**
     * Marks the user's availability status.
     * @param connectionId - The unique identifier for the ShareWorker connection.
     * @param type - The user's availability type.
     */
    mark: (connectionId: string, type: UserAvailabilityTypes) => void;

    /**
     * Sets the authentication headers for the /metrics API call
     * @param connectionId - The unique identifier for the ShareWorker connection (private app=localID, public app=random uuid).
     * @param uid - The user's unique identifier necessary for the backend authentification.
     * @param accessToken - Optional access token for authentication.
     */
    setAuthHeaders: (connectionId: string, uid: string, accessToken?: string) => void;

    /**
     * Sets the version headers for the /metrics API call
     * @param connectionId - The unique identifier for the ShareWorker connection (private app=localID, public app=random uuid).
     * @param clientID - The client's unique identifier from the app config.
     * @param appVersion - The version of the application taken from the app config.
     */
    setVersionHeaders: (connectionId: string, clientID: string, appVersion: string) => void;

    /**
     * Sets the local user information.
     * @param connectionId - The unique identifier for the ShareWorker connection (private app=localID, public app=random uuid).
     * @param uid - The user's unique identifier necessary for the backend authentification.
     * @param plan - The user's subscription plan, either 'paid' or 'free'.
     */
    setLocalUser: (connectionId: string, uid: string, plan: 'paid' | 'free') => void;

    /**
     * Disconnects a specific connection.
     * @param connectionId - The unique identifier for the SharedWorker connection to be disconnected.
     */
    disconnect: (connectionId: string) => void;
}
