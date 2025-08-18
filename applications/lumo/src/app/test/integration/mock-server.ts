import { HttpResponse, http } from 'msw';

import { computeSha256AsBase64 } from '../../crypto';

// Mock database types and state
export type MockDbSpace = {
    ID: string;
    CreateTime: string;
    DeleteTime?: string;
    SpaceKey: string;
    SpaceTag: string;
    Encrypted: string;
};

export type MockResponseSpace = MockDbSpace & {
    Conversations: MockResponseConversation[];
    Assets: MockResponseAsset[];
};

export type MockDbConversation = {
    ID: string;
    SpaceID: string;
    CreateTime: string;
    DeleteTime?: string;
    IsStarred: boolean;
    Encrypted: string;
    ConversationTag: string;
};

export type MockResponseConversation = MockDbConversation & {
    Messages: MockResponseMessage[];
};

export type MockDbMessage = {
    ID: string;
    ConversationID: string;
    CreateTime: string;
    Role: number;
    Status: number;
    Encrypted: string;
    MessageTag: string;
    ParentID?: string;
};

export type MockResponseMessage = Omit<MockDbMessage, 'Encrypted'>;

// Add asset types
export type MockDbAsset = {
    ID: string;
    SpaceID: string;
    CreateTime: string;
    DeleteTime?: string;
    Encrypted: string;
    AssetTag: string;
};

export type MockResponseAsset = Omit<MockDbAsset, 'Encrypted'>;

// Request body types
type NewSpaceRequest = {
    SpaceKey: string;
    SpaceTag: string;
    Encrypted: string;
};

type NewConversationRequest = {
    IsStarred?: boolean;
    Encrypted: string;
    ConversationTag: string;
};

type NewMessageRequest = {
    Role: number;
    Status: number;
    Encrypted: string;
    MessageTag: string;
    ParentID?: string;
};

// Add to Request body types
type NewAssetRequest = {
    SpaceID: string;
    Encrypted: string;
    AssetTag: string;
};

class ResourceExistsError extends Error {
    constructor() {
        super();
        this.name = 'ResourceExistsError';
    }
}

// Error tracking and handling class
export class MockErrorHandler {
    private errorMap: Map<string, number> = new Map();
    private errorCallbacks: Map<string, (() => void)[]> = new Map();

    // Register an error to be returned for requests matching urlPrefix and method
    // with an optional callback to be called when the error is triggered
    injectError(urlPrefix: string, method: string, statusCode: number, callback?: () => void): void {
        const key = `${method.toUpperCase()}:${urlPrefix}`;
        this.errorMap.set(key, statusCode);

        // Register the callback if provided
        if (callback) {
            if (!this.errorCallbacks.has(key)) {
                this.errorCallbacks.set(key, []);
            }
            this.errorCallbacks.get(key)!.push(callback);
        }
    }

    // Clear an injected error
    clearError(urlPrefix: string, method: string): void {
        const key = `${method.toUpperCase()}:${urlPrefix}`;
        const deleted = this.errorMap.delete(key);
        if (!deleted) {
            throw new Error(`cannot clear nonexistent error handler: ${key}`);
        }
        // Also clear any callbacks
        this.errorCallbacks.delete(key);
    }

    // Clear all registered errors and callbacks
    clearAllErrors(): void {
        this.errorMap.clear();
        this.errorCallbacks.clear();
    }

    // Check if a request should return an error
    shouldReturnError(url: string, method: string): number | null {
        const requestMethod = method.toUpperCase();

        // Check each registered error pattern
        for (const [key, statusCode] of this.errorMap.entries()) {
            const [errorMethod, errorUrlPrefix] = key.split(':', 2);
            if (requestMethod === errorMethod && url.startsWith(errorUrlPrefix)) {
                // Trigger any registered callbacks for this error
                this.triggerErrorCallbacks(key);
                return statusCode;
            }
        }

        return null;
    }

    private triggerErrorCallbacks(key: string): void {
        const callbacks = this.errorCallbacks.get(key) || [];
        for (const callback of callbacks) {
            callback();
        }
    }
}

export class MockDatabase {
    private spaces: Map<string, MockDbSpace> = new Map();
    private conversations: Map<string, MockDbConversation> = new Map();
    private messages: Map<string, MockDbMessage> = new Map();
    private assets: Map<string, MockDbAsset> = new Map();
    private nextSpaceId = 1;
    private nextConversationId = 1;
    private nextMessageId = 1;
    private nextAssetId = 1;
    private conflictErrors: Map<string, number> = new Map(); // { localId => nbErrors }

    // Space operations
    addSpace(space: MockDbSpace): void {
        const existing = Array.from(this.spaces.values()).some((c) => c.SpaceTag === space.SpaceTag);
        if (existing) {
            this.registerConflictError(space.SpaceTag);
            throw new ResourceExistsError();
        }
        this.spaces.set(space.ID, space);
    }

    getSpace(id: string): MockDbSpace | undefined {
        return this.spaces.get(id);
    }

    listSpaces(): MockDbSpace[] {
        return Array.from(this.spaces.values());
    }

    listSpacesPaginated(createTimeSince?: string, createTimeUntil?: string, pageSize: number = 100): MockDbSpace[] {
        let spaces = Array.from(this.spaces.values());

        // Filter by creation time if parameters are provided
        if (createTimeSince) {
            spaces = spaces.filter((space) => space.CreateTime >= createTimeSince);
        }
        if (createTimeUntil) {
            spaces = spaces.filter((space) => space.CreateTime <= createTimeUntil);
        }

        // Sort by CreateTime DESC, then by ID DESC
        spaces.sort((a, b) => {
            const timeCompare = b.CreateTime.localeCompare(a.CreateTime);
            if (timeCompare !== 0) return timeCompare;
            return b.ID.localeCompare(a.ID);
        });

        // Apply page size limit
        return spaces.slice(0, pageSize);
    }

    deleteSpace(id: string): boolean {
        const space = this.spaces.get(id);
        if (!space) return false;

        // Soft delete the space and all its conversations
        space.DeleteTime = new Date().toISOString();
        this.spaces.set(id, space);

        // Soft delete all conversations in this space
        const conversations = this.getConversationsBySpaceId(id);
        conversations.forEach((c) => {
            c.DeleteTime = space.DeleteTime;
            this.conversations.set(c.ID, c);
        });

        return true;
    }

    getConversationsBySpaceId(id: string): MockDbConversation[] {
        const iter = Array.from(this.conversations.values()).filter((c) => c.SpaceID === id);
        return [...iter];
    }

    async getNextSpaceId(): Promise<string> {
        return serverId(this.nextSpaceId++);
    }

    async getNextConversationId(): Promise<string> {
        return serverId(this.nextConversationId++);
    }

    async getNextMessageId(): Promise<string> {
        return serverId(this.nextMessageId++);
    }

    // Conversation operations
    addConversation(conversation: MockDbConversation): void {
        const existing = Array.from(this.conversations.values()).some(
            (c) => c.ConversationTag === conversation.ConversationTag
        );
        if (existing) {
            this.registerConflictError(conversation.ConversationTag);
            throw new ResourceExistsError();
        }
        this.conversations.set(conversation.ID, conversation);
    }

    // Message operations
    addMessage(message: MockDbMessage): void {
        const existing = Array.from(this.messages.values()).some((c) => c.MessageTag === message.MessageTag);
        if (existing) {
            this.registerConflictError(message.MessageTag);
            throw new ResourceExistsError();
        }
        this.messages.set(message.ID, message);
    }

    getConversation(id: string): MockDbConversation | undefined {
        return this.conversations.get(id);
    }

    getMessagesByConversationId(id: string): MockDbMessage[] {
        const messages = Array.from(this.messages.values()).filter((m) => m.ConversationID === id);
        // Sort by CreateTime ASC
        messages.sort((a, b) => a.CreateTime.localeCompare(b.CreateTime));
        return messages;
    }

    getMessage(id: string): MockDbMessage | undefined {
        return this.messages.get(id);
    }

    // Asset operations
    addAsset(asset: MockDbAsset): void {
        const existing = Array.from(this.assets.values()).some((a) => a.AssetTag === asset.AssetTag);
        if (existing) {
            this.registerConflictError(asset.AssetTag);
            throw new ResourceExistsError();
        }
        this.assets.set(asset.ID, asset);
    }

    getAsset(id: string): MockDbAsset | undefined {
        return this.assets.get(id);
    }

    getAssetsBySpaceId(id: string): MockDbAsset[] {
        return Array.from(this.assets.values()).filter((a) => a.SpaceID === id);
    }

    deleteAsset(id: string): boolean {
        const asset = this.assets.get(id);
        if (!asset) return false;

        // Soft delete the asset
        asset.DeleteTime = new Date().toISOString();
        this.assets.set(id, asset);
        return true;
    }

    async getNextAssetId(): Promise<string> {
        return serverId(this.nextAssetId++);
    }

    populateSpaces(spaces: MockDbSpace[]): MockResponseSpace[] {
        return spaces.map((s: MockDbSpace): MockResponseSpace => {
            const conversations = this.getConversationsBySpaceId(s.ID);
            const assets = this.getAssetsBySpaceId(s.ID);

            return {
                ...s,
                Conversations: conversations.map((c) => ({ ...c, Messages: [] })),
                Assets: assets.map(({ Encrypted, ...rest }) => rest),
            };
        });
    }

    getNbConflictErrors(id: string): number {
        return this.conflictErrors.get(id) ?? 0;
    }

    private registerConflictError(tag: string) {
        this.conflictErrors.set(tag, (this.conflictErrors.get(tag) ?? 0) + 1);
    }
}

// Helper function to generate server IDs
export async function serverId(id: number): Promise<string> {
    const salt = 'FBbzCxGXo+a3YbXJHWQtxbWuRqoMhych';
    return computeSha256AsBase64(`${salt}${id}`, true);
}

// Helper function to check for "undefined" string values in URL or route parameters
function checkForUndefinedParams(
    request: Request,
    params: Record<string, string | readonly string[] | undefined>
): void {
    // Check route parameters
    for (const [key, value] of Object.entries(params)) {
        if (value === 'undefined') {
            const e = new Error(`Route parameter '${key}' has string value 'undefined'`);
            console.error(e);
            throw e;
        }
    }

    // Check URL query parameters
    const url = new URL(request.url);
    for (const [key, value] of url.searchParams.entries()) {
        if (value === 'undefined') {
            const e = new Error(`URL query parameter '${key}' has string value 'undefined'`);
            console.error(e);
            throw e;
        }
    }
}

// Helper function to create 400 Bad Request response
function createBadRequestResponse(errorMessage: string) {
    return new HttpResponse(JSON.stringify({ Code: 4000, Error: errorMessage }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
    });
}

// Helper function to parse unix timestamp parameter
function parseUnixTimestamp(paramValue: string | null): string | undefined {
    if (!paramValue) {
        return undefined;
    }

    // Strict integer parsing - must be all digits, no whitespace, no partial parsing
    if (!/^\d+$/.test(paramValue)) {
        throw new Error(`Invalid timestamp format: ${paramValue}`);
    }

    const timestamp = parseInt(paramValue, 10);

    // Additional safety check - ensure the parsed number converts back to the same string
    if (timestamp.toString() !== paramValue) {
        throw new Error(`Invalid timestamp format: ${paramValue}`);
    }

    return new Date(timestamp * 1000).toISOString();
}

// MSW handlers for the mock server
export function createHandlers(mockDb: MockDatabase, errorHandler?: MockErrorHandler) {
    // Use default error handler if none provided
    const errors = errorHandler || new MockErrorHandler();

    // Helper to check for injected errors
    const checkForError = (url: string, method: string) => {
        console.log(`mock server: checkForError: checking for ${method} ${url}`);
        const statusCode = errors.shouldReturnError(url, method);
        if (statusCode) {
            console.log(`mock server: injected error ${statusCode} for ${method} ${url}`);
            return new HttpResponse(JSON.stringify({ Code: 5000, Error: 'Injected error' }), {
                status: statusCode,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        return null;
    };

    return [
        http.post('/api/lumo/v1/spaces', async ({ request, params }) => {
            // Check for injected error
            const errorResponse = checkForError('/api/lumo/v1/spaces', 'POST');
            if (errorResponse) return errorResponse;

            // Check for "undefined" parameter values
            checkForUndefinedParams(request, params);

            const body = (await request.json()) as NewSpaceRequest;
            console.log(`mock server: http post /api/lumo/v1/spaces <-`, body);

            try {
                const nextSpaceId = await mockDb.getNextSpaceId();
                console.log(`mock server: generated space ID:`, nextSpaceId);

                const space: MockDbSpace = {
                    ID: nextSpaceId,
                    CreateTime: new Date().toISOString(),
                    SpaceKey: body.SpaceKey,
                    SpaceTag: body.SpaceTag,
                    Encrypted: body.Encrypted,
                };
                console.log(`mock server: about to add space:`, space);

                mockDb.addSpace(space);
                console.log(`mock server: space added successfully`);

                const response = { Code: 1000, Space: { ID: space.ID } };
                console.log(`mock server: http post /api/lumo/v1/spaces ->`, response);
                return HttpResponse.json(response);
            } catch (error) {
                console.error(`mock server: ERROR in POST spaces:`, error);
                if (error instanceof ResourceExistsError) {
                    console.log(`mock server: space already exists, returning 409`);
                    return HttpResponse.json({ error: 'Resource already exists' }, { status: 409 });
                }
                console.log(`mock server: unexpected error, returning 500`);
                return new HttpResponse(JSON.stringify({ Code: 5000, Error: 'Internal server error' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }),

        http.get('/api/lumo/v1/spaces', ({ request, params }) => {
            try {
                // Check for injected error
                const errorResponse = checkForError('/api/lumo/v1/spaces', 'GET');
                if (errorResponse) return errorResponse;

                // Check for "undefined" parameter values
                checkForUndefinedParams(request, params);

                const url = new URL(request.url);
                const pageSizeParam = url.searchParams.get('PageSize');

                // Parse unix timestamps with validation
                let createTimeSince: string | undefined;
                let createTimeUntil: string | undefined;

                try {
                    createTimeSince = parseUnixTimestamp(url.searchParams.get('CreateTimeSince'));
                    createTimeUntil = parseUnixTimestamp(url.searchParams.get('CreateTimeUntil'));
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Invalid timestamp parameter';
                    return createBadRequestResponse(errorMessage);
                }

                const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 100;
                console.log(`mock server: http get /api/lumo/v1/spaces <- params:`, {
                    createTimeSince,
                    createTimeUntil,
                    pageSize,
                });

                const spaces = mockDb.listSpacesPaginated(createTimeSince, createTimeUntil, pageSize);
                const populatedSpaces = mockDb.populateSpaces(spaces);
                return HttpResponse.json({
                    Code: 1000,
                    Spaces: populatedSpaces,
                });
            } catch (error) {
                console.error(`mock server: ERROR in GET /api/lumo/v1/spaces:`, error);
                return new HttpResponse(JSON.stringify({ Code: 5000, Error: 'Internal server error' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }),

        http.get('/api/lumo/v1/spaces/:id', ({ params, request }) => {
            const id = params.id as string;

            // Check for injected error
            const errorResponse = checkForError(`/api/lumo/v1/spaces/${id}`, 'GET');
            if (errorResponse) return errorResponse;

            // Check for "undefined" parameter values
            checkForUndefinedParams(request, params);

            console.log(`mock server: http get /api/lumo/v1/spaces/${id}`);
            const space = mockDb.getSpace(id);
            console.log(`mock server: http get /api/lumo/v1/spaces/${id} ->`, space);
            if (!space) {
                return new HttpResponse(null, { status: 404 });
            }

            // Get conversations and assets for this space
            const conversations = mockDb.getConversationsBySpaceId(id);
            const assets = mockDb.getAssetsBySpaceId(id);

            // Create response with populated space
            const response = {
                Code: 1000,
                Space: {
                    ...space,
                    Conversations: conversations.map((c) => ({ ...c, Messages: [] })),
                    Assets: assets.map(({ Encrypted, ...rest }) => rest),
                },
            };
            return HttpResponse.json(response);
        }),

        http.delete('/api/lumo/v1/spaces', ({ request, params }) => {
            // Check for injected error
            const errorResponse = checkForError('/api/lumo/v1/spaces', 'DELETE');
            if (errorResponse) return errorResponse;

            // Check for "undefined" parameter values
            checkForUndefinedParams(request, params);

            console.log('mock server: http delete /api/lumo/v1/spaces (bulk delete)');
            const allSpaces = mockDb.listSpaces();
            const deletedCount = allSpaces.length;

            // Delete all spaces (this will cascade to conversations)
            allSpaces.forEach((space) => {
                mockDb.deleteSpace(space.ID);
            });

            console.log(`mock server: http delete /api/lumo/v1/spaces -> deleted ${deletedCount} spaces`);
            return HttpResponse.json({
                Code: 1000,
                DeletedCount: deletedCount,
            });
        }),

        http.delete('/api/lumo/v1/spaces/:id', ({ params, request }) => {
            const id = params.id as string;

            // Check for injected error
            const errorResponse = checkForError(`/api/lumo/v1/spaces/${id}`, 'DELETE');
            if (errorResponse) return errorResponse;

            // Check for "undefined" parameter values
            checkForUndefinedParams(request, params);

            console.log(`mock server: http delete /api/lumo/v1/spaces/${id}`);
            const success = mockDb.deleteSpace(id);
            console.log(`mock server: http delete /api/lumo/v1/spaces/${id} ->`, success ? 'deleted' : 'not found');
            if (!success) {
                return new HttpResponse(null, { status: 404 });
            }
            return HttpResponse.json({
                Code: 1000,
            });
        }),

        http.post('/api/lumo/v1/spaces/:spaceId/conversations', async ({ request, params }) => {
            const spaceId = params.spaceId as string;

            // Check for injected error
            const errorResponse = checkForError(`/api/lumo/v1/spaces/${spaceId}/conversations`, 'POST');
            if (errorResponse) return errorResponse;

            // Check for "undefined" parameter values
            checkForUndefinedParams(request, params);

            const body = (await request.json()) as NewConversationRequest;
            console.log(`mock server: http post /api/lumo/v1/spaces/${spaceId}/conversations <-`, body);

            // Verify the space exists
            const space = mockDb.getSpace(spaceId);
            if (!space) {
                console.log(`mock server: http post /api/lumo/v1/spaces/${spaceId}/conversations -> 404 Not Found`);
                return new HttpResponse(null, { status: 404 });
            }

            const conversation: MockDbConversation = {
                ID: await mockDb.getNextConversationId(),
                SpaceID: spaceId,
                CreateTime: new Date().toISOString(),
                IsStarred: body.IsStarred ?? false,
                Encrypted: body.Encrypted,
                ConversationTag: body.ConversationTag,
            };
            mockDb.addConversation(conversation);
            const response = { Code: 1000, Conversation: { ID: conversation.ID } };
            console.log(`mock server: http post /api/lumo/v1/spaces/${spaceId}/conversations ->`, response);
            return HttpResponse.json(response);
        }),

        http.get('/api/lumo/v1/conversations/:conversationId', ({ params, request }) => {
            const conversationId = params.conversationId as string;

            // Check for injected error
            const errorResponse = checkForError(`/api/lumo/v1/conversations/${conversationId}`, 'GET');
            if (errorResponse) return errorResponse;

            // Check for "undefined" parameter values
            checkForUndefinedParams(request, params);

            console.log(`mock server: http get /api/lumo/v1/conversations/${conversationId}`);
            const conversation = mockDb.getConversation(conversationId);
            console.log(`mock server: http get /api/lumo/v1/conversations/${conversationId} ->`, conversation);
            if (!conversation) {
                return new HttpResponse(null, { status: 404 });
            }

            const messages = mockDb.getMessagesByConversationId(conversationId);
            const shallowMessages = messages.map(({ Encrypted, ...rest }) => rest);
            return HttpResponse.json({
                Code: 1000,
                Conversation: {
                    ...conversation,
                    Messages: shallowMessages,
                },
            });
        }),

        http.post('/api/lumo/v1/conversations/:conversationId/messages', async ({ request, params }) => {
            const conversationId = params.conversationId as string;

            // Check for injected error
            const errorResponse = checkForError(`/api/lumo/v1/conversations/${conversationId}/messages`, 'POST');
            if (errorResponse) return errorResponse;

            // Check for "undefined" parameter values
            checkForUndefinedParams(request, params);

            const body = (await request.json()) as NewMessageRequest;
            console.log(`mock server: http post /api/lumo/v1/conversations/${conversationId}/messages <-`, body);

            // Verify the conversation exists
            const conversation = mockDb.getConversation(conversationId);
            if (!conversation) {
                console.log(
                    `mock server: http post /api/lumo/v1/conversations/${conversationId}/messages -> 404 Not Found`
                );
                return new HttpResponse(null, { status: 404 });
            }

            const message: MockDbMessage = {
                ID: await mockDb.getNextMessageId(),
                ConversationID: conversationId,
                CreateTime: new Date().toISOString(),
                Role: body.Role,
                Status: body.Status,
                Encrypted: body.Encrypted,
                MessageTag: body.MessageTag,
                ParentID: body.ParentID,
            };
            try {
                console.log('mockDb.addMessage');
                mockDb.addMessage(message);
            } catch (e) {
                if (e instanceof ResourceExistsError) {
                    return HttpResponse.json({ error: 'Resource already exists' }, { status: 409 });
                }
                throw e;
            }

            // Return shallow message in response (without Encrypted field)
            const { Encrypted, ...shallowMessage } = message;
            const response = { Code: 1000, Message: shallowMessage };
            console.log(`mock server: http post /api/lumo/v1/conversations/${conversationId}/messages ->`, response);
            return HttpResponse.json(response);
        }),

        http.put('/api/lumo/v1/conversations/:conversationId', async ({ request, params }) => {
            const conversationId = params.conversationId as string;

            // Check for injected error
            const errorResponse = checkForError(`/api/lumo/v1/conversations/${conversationId}`, 'PUT');
            if (errorResponse) return errorResponse;

            // Check for "undefined" parameter values
            checkForUndefinedParams(request, params);

            const body = (await request.json()) as { IsStarred?: boolean; Encrypted?: string };
            console.log(`mock server: http put /api/lumo/v1/conversations/${conversationId} <-`, body);

            // Verify the conversation exists
            const conversation = mockDb.getConversation(conversationId);
            if (!conversation) {
                console.log(`mock server: http put /api/lumo/v1/conversations/${conversationId} -> 404 Not Found`);
                return new HttpResponse(null, { status: 404 });
            }

            // Update the conversation
            if (body.IsStarred !== undefined) {
                conversation.IsStarred = body.IsStarred;
            }
            if (body.Encrypted !== undefined) {
                conversation.Encrypted = body.Encrypted;
            }
            mockDb.addConversation(conversation);

            const messages = mockDb.getMessagesByConversationId(conversationId);
            const shallowMessages = messages.map(({ Encrypted, ...rest }) => rest);
            const response = {
                Code: 1000,
                Conversation: {
                    ...conversation,
                    Messages: shallowMessages,
                },
            };
            console.log(`mock server: http put /api/lumo/v1/conversations/${conversationId} ->`, response);
            return HttpResponse.json(response);
        }),

        // Add asset/attachment handlers
        http.post('/api/lumo/v1/spaces/:spaceId/assets', async ({ request, params }) => {
            const spaceId = params.spaceId as string;

            // Check for injected error
            const errorResponse = checkForError(`/api/lumo/v1/spaces/${spaceId}/assets`, 'POST');
            if (errorResponse) return errorResponse;

            // Check for "undefined" parameter values
            checkForUndefinedParams(request, params);

            const body = (await request.json()) as NewAssetRequest;
            console.log(`mock server: http post /api/lumo/v1/spaces/${spaceId}/assets <-`, body);

            // Verify the space exists
            const space = mockDb.getSpace(spaceId);
            if (!space) {
                console.log(`mock server: http post /api/lumo/v1/spaces/${spaceId}/assets -> 404 Not Found`);
                return new HttpResponse(null, { status: 404 });
            }

            const asset: MockDbAsset = {
                ID: await mockDb.getNextAssetId(),
                SpaceID: spaceId,
                CreateTime: new Date().toISOString(),
                Encrypted: body.Encrypted,
                AssetTag: body.AssetTag,
            };
            mockDb.addAsset(asset);
            const response = { Code: 1000, Asset: { ID: asset.ID } };
            console.log(`mock server: http post /api/lumo/v1/spaces/${spaceId}/assets ->`, response);
            return HttpResponse.json(response);
        }),

        http.get('/api/lumo/v1/assets/:assetId', ({ params, request }) => {
            const assetId = params.assetId as string;

            // Check for injected error
            const errorResponse = checkForError(`/api/lumo/v1/assets/${assetId}`, 'GET');
            if (errorResponse) return errorResponse;

            // Check for "undefined" parameter values
            checkForUndefinedParams(request, params);

            console.log(`mock server: http get /api/lumo/v1/assets/${assetId}`);
            const asset = mockDb.getAsset(assetId);
            console.log(`mock server: http get /api/lumo/v1/assets/${assetId} ->`, asset);
            if (!asset) {
                return new HttpResponse(null, { status: 404 });
            }

            // Return shallow asset in response (without Encrypted field)
            const { Encrypted, ...shallowAsset } = asset;
            return HttpResponse.json({
                Code: 1000,
                Asset: shallowAsset,
            });
        }),

        http.put('/api/lumo/v1/assets/:assetId', async ({ request, params }) => {
            const assetId = params.assetId as string;

            // Check for injected error
            const errorResponse = checkForError(`/api/lumo/v1/assets/${assetId}`, 'PUT');
            if (errorResponse) return errorResponse;

            // Check for "undefined" parameter values
            checkForUndefinedParams(request, params);

            const body = (await request.json()) as { Encrypted?: string };
            console.log(`mock server: http put /api/lumo/v1/assets/${assetId} <-`, body);

            // Verify the asset exists
            const asset = mockDb.getAsset(assetId);
            if (!asset) {
                console.log(`mock server: http put /api/lumo/v1/assets/${assetId} -> 404 Not Found`);
                return new HttpResponse(null, { status: 404 });
            }

            // Update the asset
            if (body.Encrypted !== undefined) {
                asset.Encrypted = body.Encrypted;
            }
            mockDb.addAsset(asset);

            // Return shallow asset in response (without Encrypted field)
            const { Encrypted, ...shallowAsset } = asset;
            const response = {
                Code: 1000,
                Asset: shallowAsset,
            };
            console.log(`mock server: http put /api/lumo/v1/assets/${assetId} ->`, response);
            return HttpResponse.json(response);
        }),

        http.delete('/api/lumo/v1/assets/:assetId', ({ params, request }) => {
            const assetId = params.assetId as string;

            // Check for injected error
            const errorResponse = checkForError(`/api/lumo/v1/assets/${assetId}`, 'DELETE');
            if (errorResponse) return errorResponse;

            // Check for "undefined" parameter values
            checkForUndefinedParams(request, params);

            console.log(`mock server: http delete /api/lumo/v1/assets/${assetId}`);
            const success = mockDb.deleteAsset(assetId);
            console.log(
                `mock server: http delete /api/lumo/v1/assets/${assetId} ->`,
                success ? 'deleted' : 'not found'
            );
            if (!success) {
                return new HttpResponse(null, { status: 404 });
            }
            return HttpResponse.json({
                Code: 1000,
            });
        }),

        http.get('/api/lumo/v1/messages/:messageId', ({ params, request }) => {
            const messageId = params.messageId as string;

            // Check for injected error
            const errorResponse = checkForError(`/api/lumo/v1/messages/${messageId}`, 'GET');
            if (errorResponse) return errorResponse;

            // Check for "undefined" parameter values
            checkForUndefinedParams(request, params);

            console.log(`mock server: http get /api/lumo/v1/messages/${messageId}`);
            const message = mockDb.getMessage(messageId);
            console.log(`mock server: http get /api/lumo/v1/messages/${messageId} ->`, message);
            if (!message) {
                return new HttpResponse(null, { status: 404 });
            }

            // Return shallow message in response (without Encrypted field)
            return HttpResponse.json({
                Code: 1000,
                Message: message,
            });
        }),
    ];
}
