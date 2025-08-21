/**
 * Manages the latest event IDs for different tree event scopes for drive sdk event system
 * This provider is used to track the most recent event ID processed for each scope,
 */
export class LatestEventIdProvider {
    private eventIdMap: Map<string, string> = new Map();

    /**
     * Retrieves the latestEventId for a given treeEventScopeId.
     *
     * @param treeEventScopeId - The unique identifier for the tree event scope
     * @returns The latestEventId for the scope, or null if no event ID has been saved
     */
    getLatestEventId(treeEventScopeId: string): string | null {
        return this.eventIdMap.get(treeEventScopeId) ?? null;
    }

    /**
     * Saves the latestEventId for a specific treeEventScopeId.
     *
     * @param treeEventScopeId - The unique identifier for the tree event scope
     * @param eventId - The event ID to save as the latest for this scope
     */
    saveLatestEventId(treeEventScopeId: string, eventId: string): void {
        this.eventIdMap.set(treeEventScopeId, eventId);
    }

    /**
     * Removes specific treeEventScopeId from the provider.
     *
     * @param treeEventScopeId - The unique identifier for the tree event scope to remove
     */
    removeEventScope(treeEventScopeId: string): void {
        this.eventIdMap.delete(treeEventScopeId);
    }
}
