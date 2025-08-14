import { type SetupServer, setupServer } from 'msw/node';

import { newMessageId } from '../../redux/slices/core/messages';
import { RoleInt, StatusInt } from '../../remote/types';
import type { Base64 } from '../../types';
import { MockDatabase, type MockDbSpace, MockErrorHandler, createHandlers, serverId } from './mock-server';

describe('Mock Server Tests', () => {
    let mockDb: MockDatabase;
    let server: SetupServer;
    let mockErrorHandler: MockErrorHandler;
    let baseUrl: string;

    beforeEach(async () => {
        mockDb = new MockDatabase();
        mockErrorHandler = new MockErrorHandler();
        server = setupServer(...createHandlers(mockDb, mockErrorHandler));
        server.listen();
        baseUrl = 'http://localhost';
    });

    afterEach(async () => {
        server.close();
    });

    describe('MockDatabase Class', () => {
        describe('ID Generation', () => {
            it('should generate sequential IDs', async () => {
                const id1 = await mockDb.getNextSpaceId();
                const id2 = await mockDb.getNextSpaceId();
                const id3 = await mockDb.getNextConversationId();
                const id4 = await mockDb.getNextMessageId();
                const id5 = await mockDb.getNextAssetId();

                expect(id1).toBeDefined();
                expect(id2).toBeDefined();
                expect(id3).toBeDefined();
                expect(id4).toBeDefined();
                expect(id5).toBeDefined();
                expect(id1).not.toBe(id2);
            });

            it('should generate deterministic server IDs', async () => {
                const id1a = await serverId(1);
                const id1b = await serverId(1);
                const id2 = await serverId(2);

                expect(id1a).toBe(id1b);
                expect(id1a).not.toBe(id2);
                expect(typeof id1a).toBe('string');
                expect(id1a.length).toBeGreaterThan(0);
            });
        });

        describe('Space Operations', () => {
            it('should add and retrieve spaces', async () => {
                const spaceId = await mockDb.getNextSpaceId();
                const space: MockDbSpace = {
                    ID: spaceId,
                    CreateTime: new Date().toISOString(),
                    SpaceKey: 'test-key',
                    SpaceTag: 'test-tag',
                    Encrypted: 'encrypted-data' as Base64,
                };

                mockDb.addSpace(space);
                const retrieved = mockDb.getSpace(spaceId);
                expect(retrieved).toEqual(space);
            });

            it('should list all spaces', async () => {
                const space1Id = await mockDb.getNextSpaceId();
                const space2Id = await mockDb.getNextSpaceId();

                const space1: MockDbSpace = {
                    ID: space1Id,
                    CreateTime: '2023-01-01T00:00:00.000Z',
                    SpaceKey: 'key1',
                    SpaceTag: 'tag1',
                    Encrypted: 'data1' as Base64,
                };

                const space2: MockDbSpace = {
                    ID: space2Id,
                    CreateTime: '2023-01-02T00:00:00.000Z',
                    SpaceKey: 'key2',
                    SpaceTag: 'tag2',
                    Encrypted: 'data2' as Base64,
                };

                mockDb.addSpace(space1);
                mockDb.addSpace(space2);

                const spaces = mockDb.listSpaces();
                expect(spaces).toHaveLength(2);
                expect(spaces).toContainEqual(space1);
                expect(spaces).toContainEqual(space2);
            });

            it('should handle basic pagination', async () => {
                // Create 5 spaces with different timestamps
                for (let i = 0; i < 5; i++) {
                    const spaceId = await mockDb.getNextSpaceId();
                    const space: MockDbSpace = {
                        ID: spaceId,
                        CreateTime: `2023-01-0${i}T00:00:00.000Z`,
                        SpaceKey: `key${i}`,
                        SpaceTag: `tag${i}`,
                        Encrypted: `data${i}` as Base64,
                    };
                    mockDb.addSpace(space);
                }

                // Test pagination without filters
                const allSpaces = mockDb.listSpacesPaginated(undefined, undefined, 10);
                expect(allSpaces).toHaveLength(5);

                // Test with page size limit
                const limitedSpaces = mockDb.listSpacesPaginated(undefined, undefined, 3);
                expect(limitedSpaces).toHaveLength(3);

                // Test basic time filter
                const filteredSpaces = mockDb.listSpacesPaginated(
                    '2023-01-02T00:00:00.000Z',
                    '2023-01-04T00:00:00.000Z',
                    10
                );
                expect(filteredSpaces).toHaveLength(3);

                // Verify sorting (newest first)
                expect(allSpaces[0].CreateTime >= allSpaces[1].CreateTime).toBe(true);
            });

            it('should soft delete spaces and cascade to conversations', async () => {
                const spaceId = await mockDb.getNextSpaceId();
                const conversationId = await mockDb.getNextConversationId();

                const space: MockDbSpace = {
                    ID: spaceId,
                    CreateTime: new Date().toISOString(),
                    SpaceKey: 'key',
                    SpaceTag: 'tag',
                    Encrypted: 'data' as Base64,
                };

                const conversation = {
                    ID: conversationId,
                    SpaceID: spaceId,
                    CreateTime: new Date().toISOString(),
                    IsStarred: false,
                    Encrypted: 'conv-data',
                    ConversationTag: 'conv-tag',
                };

                mockDb.addSpace(space);
                mockDb.addConversation(conversation);

                const deleted = mockDb.deleteSpace(spaceId);
                expect(deleted).toBe(true);

                const deletedSpace = mockDb.getSpace(spaceId);
                expect(deletedSpace?.DeleteTime).toBeDefined();

                const conversations = mockDb.getConversationsBySpaceId(spaceId);
                expect(conversations[0].DeleteTime).toBeDefined();
            });
        });

        describe('Conversation Operations', () => {
            it('should add and retrieve conversations', async () => {
                const spaceId = await mockDb.getNextSpaceId();
                const conversationId = await mockDb.getNextConversationId();

                const conversation = {
                    ID: conversationId,
                    SpaceID: spaceId,
                    CreateTime: new Date().toISOString(),
                    IsStarred: true,
                    Encrypted: 'conv-data',
                    ConversationTag: 'conv-tag',
                };

                mockDb.addConversation(conversation);
                const retrieved = mockDb.getConversation(conversationId);
                expect(retrieved).toEqual(conversation);

                const bySpace = mockDb.getConversationsBySpaceId(spaceId);
                expect(bySpace).toHaveLength(1);
                expect(bySpace[0]).toEqual(conversation);
            });
        });

        describe('Message Operations', () => {
            it('should add and retrieve messages', async () => {
                const messageId = await mockDb.getNextMessageId();
                const conversationId = await mockDb.getNextConversationId();

                const message = {
                    ID: messageId,
                    ConversationID: conversationId,
                    CreateTime: new Date().toISOString(),
                    Role: RoleInt.User,
                    Status: StatusInt.Succeeded,
                    Encrypted: 'msg-data',
                    MessageTag: 'msg-tag',
                };

                mockDb.addMessage(message);
                const retrieved = mockDb.getMessage(messageId);
                expect(retrieved).toEqual(message);

                const byConversation = mockDb.getMessagesByConversationId(conversationId);
                expect(byConversation).toHaveLength(1);
                expect(byConversation[0]).toEqual(message);
            });

            it('should sort messages by creation time', async () => {
                const conversationId = await mockDb.getNextConversationId();

                // Add messages in reverse chronological order
                for (let i = 2; i >= 0; i--) {
                    const messageId = await mockDb.getNextMessageId();
                    const message = {
                        ID: messageId,
                        ConversationID: conversationId,
                        CreateTime: new Date(2023, 0, i + 1).toISOString(),
                        Role: RoleInt.User,
                        Status: StatusInt.Succeeded,
                        Encrypted: `msg-data-${i}`,
                        MessageTag: `msg-tag-${i}`,
                    };
                    mockDb.addMessage(message);
                }

                const sorted = mockDb.getMessagesByConversationId(conversationId);
                expect(sorted).toHaveLength(3);
                // Should be sorted by CreateTime ASC
                expect(sorted[0].CreateTime <= sorted[1].CreateTime).toBe(true);
                expect(sorted[1].CreateTime <= sorted[2].CreateTime).toBe(true);
            });

            it('should throw when the message tag conflicts', async () => {
                const message1 = {
                    ID: await mockDb.getNextMessageId(),
                    ConversationID: await mockDb.getNextConversationId(),
                    CreateTime: new Date().toISOString(),
                    Role: RoleInt.User,
                    Status: StatusInt.Succeeded,
                    Encrypted: 'msg-data',
                    MessageTag: 'msg-local-id-1',
                };

                const message2 = {
                    ID: await mockDb.getNextMessageId(),
                    ConversationID: await mockDb.getNextConversationId(),
                    CreateTime: new Date().toISOString(),
                    Role: RoleInt.User,
                    Status: StatusInt.Succeeded,
                    Encrypted: 'msg-data',
                    MessageTag: 'msg-local-id-1', // same
                };

                mockDb.addMessage(message1);
                expect(() => {
                    mockDb.addMessage(message2);
                }).toThrow();
            });
        });

        describe('Asset Operations', () => {
            it('should add, retrieve, and delete assets', async () => {
                const assetId = await mockDb.getNextAssetId();
                const spaceId = await mockDb.getNextSpaceId();

                const asset = {
                    ID: assetId,
                    SpaceID: spaceId,
                    CreateTime: new Date().toISOString(),
                    Encrypted: 'asset-data' as Base64,
                    AssetTag: 'asset-tag',
                };

                mockDb.addAsset(asset);
                const retrieved = mockDb.getAsset(assetId);
                expect(retrieved).toEqual(asset);

                const bySpace = mockDb.getAssetsBySpaceId(spaceId);
                expect(bySpace).toHaveLength(1);
                expect(bySpace[0]).toEqual(asset);

                const deleted = mockDb.deleteAsset(assetId);
                expect(deleted).toBe(true);

                const deletedAsset = mockDb.getAsset(assetId);
                expect(deletedAsset?.DeleteTime).toBeDefined();
            });
        });

        describe('Data Population', () => {
            it('should populate spaces with conversations and assets', async () => {
                const spaceId = await mockDb.getNextSpaceId();
                const conversationId = await mockDb.getNextConversationId();
                const assetId = await mockDb.getNextAssetId();

                const space: MockDbSpace = {
                    ID: spaceId,
                    CreateTime: new Date().toISOString(),
                    SpaceKey: 'key',
                    SpaceTag: 'tag',
                    Encrypted: 'data' as Base64,
                };

                const conversation = {
                    ID: conversationId,
                    SpaceID: spaceId,
                    CreateTime: new Date().toISOString(),
                    IsStarred: false,
                    Encrypted: 'conv-data',
                    ConversationTag: 'conv-tag',
                };

                const asset = {
                    ID: assetId,
                    SpaceID: spaceId,
                    CreateTime: new Date().toISOString(),
                    Encrypted: 'asset-data' as Base64,
                    AssetTag: 'asset-tag',
                };

                mockDb.addSpace(space);
                mockDb.addConversation(conversation);
                mockDb.addAsset(asset);

                const populated = mockDb.populateSpaces([space]);
                expect(populated).toHaveLength(1);
                expect(populated[0].Conversations).toHaveLength(1);
                expect(populated[0].Assets).toHaveLength(1);
                expect(populated[0].Conversations[0].ID).toBe(conversationId);
                expect(populated[0].Assets[0].ID).toBe(assetId);
                // Should exclude encrypted data from assets
                expect('Encrypted' in populated[0].Assets[0]).toBe(false);
            });
        });
    });

    describe('MockErrorHandler Class', () => {
        it('should inject and detect errors', () => {
            let callbackCalled = false;
            const callback = () => {
                callbackCalled = true;
            };

            mockErrorHandler.injectError('/api/test', 'GET', 500, callback);

            const statusCode = mockErrorHandler.shouldReturnError('/api/test/something', 'GET');
            expect(statusCode).toBe(500);
            expect(callbackCalled).toBe(true);

            const noError = mockErrorHandler.shouldReturnError('/api/other', 'GET');
            expect(noError).toBeNull();
        });

        it('should clear specific errors', () => {
            mockErrorHandler.injectError('/api/test', 'GET', 500);
            mockErrorHandler.injectError('/api/other', 'POST', 400);

            let statusCode = mockErrorHandler.shouldReturnError('/api/test', 'GET');
            expect(statusCode).toBe(500);

            mockErrorHandler.clearError('/api/test', 'GET');

            statusCode = mockErrorHandler.shouldReturnError('/api/test', 'GET');
            expect(statusCode).toBeNull();

            statusCode = mockErrorHandler.shouldReturnError('/api/other', 'POST');
            expect(statusCode).toBe(400);
        });

        it('should clear all errors', () => {
            mockErrorHandler.injectError('/api/test1', 'GET', 500);
            mockErrorHandler.injectError('/api/test2', 'POST', 400);

            mockErrorHandler.clearAllErrors();

            expect(mockErrorHandler.shouldReturnError('/api/test1', 'GET')).toBeNull();
            expect(mockErrorHandler.shouldReturnError('/api/test2', 'POST')).toBeNull();
        });

        it('should handle multiple callbacks for same error', () => {
            let callback1Called = false;
            let callback2Called = false;

            mockErrorHandler.injectError('/api/test', 'GET', 500, () => {
                callback1Called = true;
            });
            mockErrorHandler.injectError('/api/test', 'GET', 500, () => {
                callback2Called = true;
            });

            mockErrorHandler.shouldReturnError('/api/test', 'GET');

            expect(callback1Called).toBe(true);
            expect(callback2Called).toBe(true);
        });
    });

    describe('HTTP API Endpoints', () => {
        describe('Spaces API', () => {
            it('should create spaces via POST', async () => {
                const requestBody = {
                    SpaceKey: 'test-key',
                    SpaceTag: 'test-tag',
                    Encrypted: 'encrypted-data',
                };

                const response = await fetch(`${baseUrl}/api/lumo/v1/spaces`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody),
                });

                expect(response.status).toBe(200);
                const responseData = await response.json();
                expect(responseData.Code).toBe(1000);
                expect(responseData.Space.ID).toBeDefined();

                // Verify space was added to mock database
                const space = mockDb.getSpace(responseData.Space.ID);
                expect(space).toBeDefined();
                expect(space!.SpaceKey).toBe('test-key');
                expect(space!.SpaceTag).toBe('test-tag');
                expect(space!.Encrypted).toBe('encrypted-data');
            });

            it('should list spaces via GET', async () => {
                // Add test spaces to mock database
                const space1Id = await mockDb.getNextSpaceId();
                const space2Id = await mockDb.getNextSpaceId();

                mockDb.addSpace({
                    ID: space1Id,
                    CreateTime: '2023-01-01T00:00:00.000Z',
                    SpaceKey: 'key1',
                    SpaceTag: 'tag1',
                    Encrypted: 'data1' as Base64,
                });

                mockDb.addSpace({
                    ID: space2Id,
                    CreateTime: '2023-01-02T00:00:00.000Z',
                    SpaceKey: 'key2',
                    SpaceTag: 'tag2',
                    Encrypted: 'data2' as Base64,
                });

                const response = await fetch(`${baseUrl}/api/lumo/v1/spaces`);
                expect(response.status).toBe(200);

                const responseData = await response.json();
                expect(responseData.Code).toBe(1000);
                expect(responseData.Spaces).toHaveLength(2);
                expect(responseData.Spaces[0].ID).toBeDefined();
                expect(responseData.Spaces[0].SpaceKey).toBeDefined();
            });

            it('should handle pagination parameters', async () => {
                // Add 3 spaces with specific timestamps
                for (let i = 0; i < 3; i++) {
                    const spaceId = await mockDb.getNextSpaceId();
                    mockDb.addSpace({
                        ID: spaceId,
                        CreateTime: new Date(2023, 0, i + 1).toISOString(),
                        SpaceKey: `key${i}`,
                        SpaceTag: `tag${i}`,
                        Encrypted: `data${i}` as Base64,
                    });
                }

                // Test with page size
                const response = await fetch(`${baseUrl}/api/lumo/v1/spaces?PageSize=2`);
                expect(response.status).toBe(200);

                const responseData = await response.json();
                expect(responseData.Spaces).toHaveLength(2);
            });

            it('should validate timestamp parameters', async () => {
                const response = await fetch(`${baseUrl}/api/lumo/v1/spaces?CreateTimeSince=invalid`);
                expect(response.status).toBe(400);

                const responseData = await response.json();
                expect(responseData.Error).toContain('Invalid timestamp format');
            });

            it('should get single space via GET', async () => {
                const spaceId = await mockDb.getNextSpaceId();
                mockDb.addSpace({
                    ID: spaceId,
                    CreateTime: new Date().toISOString(),
                    SpaceKey: 'test-key',
                    SpaceTag: 'test-tag',
                    Encrypted: 'encrypted-data' as Base64,
                });

                const response = await fetch(`${baseUrl}/api/lumo/v1/spaces/${spaceId}`);
                expect(response.status).toBe(200);

                const responseData = await response.json();
                expect(responseData.Code).toBe(1000);
                expect(responseData.Space.ID).toBe(spaceId);
                expect(responseData.Space.SpaceKey).toBe('test-key');
            });

            it('should delete spaces via DELETE', async () => {
                const spaceId = await mockDb.getNextSpaceId();
                mockDb.addSpace({
                    ID: spaceId,
                    CreateTime: new Date().toISOString(),
                    SpaceKey: 'test-key',
                    SpaceTag: 'test-tag',
                    Encrypted: 'encrypted-data' as Base64,
                });

                const response = await fetch(`${baseUrl}/api/lumo/v1/spaces/${spaceId}`, {
                    method: 'DELETE',
                });
                expect(response.status).toBe(200);

                const responseData = await response.json();
                expect(responseData.Code).toBe(1000);

                // Verify space was soft deleted
                const deletedSpace = mockDb.getSpace(spaceId);
                expect(deletedSpace?.DeleteTime).toBeDefined();
            });

            it('should return 404 for non-existent space', async () => {
                const response = await fetch(`${baseUrl}/api/lumo/v1/spaces/non-existent-id`);
                expect(response.status).toBe(404);
            });

            it('should delete all spaces via bulk DELETE', async () => {
                // Add multiple spaces to the database
                const space1Id = await mockDb.getNextSpaceId();
                const space2Id = await mockDb.getNextSpaceId();
                const space3Id = await mockDb.getNextSpaceId();

                mockDb.addSpace({
                    ID: space1Id,
                    CreateTime: new Date().toISOString(),
                    SpaceKey: 'key1',
                    SpaceTag: 'tag1',
                    Encrypted: 'data1' as Base64,
                });

                mockDb.addSpace({
                    ID: space2Id,
                    CreateTime: new Date().toISOString(),
                    SpaceKey: 'key2',
                    SpaceTag: 'tag2',
                    Encrypted: 'data2' as Base64,
                });

                mockDb.addSpace({
                    ID: space3Id,
                    CreateTime: new Date().toISOString(),
                    SpaceKey: 'key3',
                    SpaceTag: 'tag3',
                    Encrypted: 'data3' as Base64,
                });

                // Verify spaces exist before deletion
                expect(mockDb.listSpaces()).toHaveLength(3);

                // Delete all spaces
                const response = await fetch(`${baseUrl}/api/lumo/v1/spaces`, {
                    method: 'DELETE',
                });

                expect(response.status).toBe(200);
                const responseData = await response.json();
                expect(responseData.Code).toBe(1000);
                expect(responseData.DeletedCount).toBe(3);

                // Verify all spaces are soft deleted internally in the mock database
                const space1 = mockDb.getSpace(space1Id);
                const space2 = mockDb.getSpace(space2Id);
                const space3 = mockDb.getSpace(space3Id);
                expect(space1?.DeleteTime).toBeDefined();
                expect(space2?.DeleteTime).toBeDefined();
                expect(space3?.DeleteTime).toBeDefined();

                // Now calling the api for GET /spaces should return objects with only DeleteTime set
                const listResponse = await fetch(`${baseUrl}/api/lumo/v1/spaces`, {
                    method: 'GET',
                });
                expect(listResponse.status).toBe(200);
                const listData = await listResponse.json();
                expect(listData.Code).toBe(1000);
                expect(Array.isArray(listData.Spaces)).toBe(true);
                expect(listData.Spaces).toHaveLength(3);

                for (const space of listData.Spaces) {
                    // Should only have ID and DeleteTime (and possibly SpaceTag for mapping)
                    expect(space.DeleteTime).toBeDefined();
                }
            });

            it('should handle bulk DELETE with no spaces', async () => {
                // Ensure database is empty
                expect(mockDb.listSpaces()).toHaveLength(0);

                const response = await fetch(`${baseUrl}/api/lumo/v1/spaces`, {
                    method: 'DELETE',
                });

                expect(response.status).toBe(200);
                const responseData = await response.json();
                expect(responseData.Code).toBe(1000);
                expect(responseData.DeletedCount).toBe(0);
            });

            it('should cascade delete conversations when bulk deleting spaces', async () => {
                // Add space and conversation
                const spaceId = await mockDb.getNextSpaceId();
                const conversationId = await mockDb.getNextConversationId();

                mockDb.addSpace({
                    ID: spaceId,
                    CreateTime: new Date().toISOString(),
                    SpaceKey: 'test-key',
                    SpaceTag: 'test-tag',
                    Encrypted: 'encrypted-data' as Base64,
                });

                mockDb.addConversation({
                    ID: conversationId,
                    SpaceID: spaceId,
                    CreateTime: new Date().toISOString(),
                    IsStarred: false,
                    Encrypted: 'conv-data',
                    ConversationTag: 'conv-tag',
                });

                // Verify conversation exists before deletion
                const conversationBefore = mockDb.getConversation(conversationId);
                expect(conversationBefore?.DeleteTime).toBeUndefined();

                // Delete all spaces
                const response = await fetch(`${baseUrl}/api/lumo/v1/spaces`, {
                    method: 'DELETE',
                });

                expect(response.status).toBe(200);
                const responseData = await response.json();
                expect(responseData.Code).toBe(1000);
                expect(responseData.DeletedCount).toBe(1);

                // Verify conversation was cascaded deleted
                const conversationAfter = mockDb.getConversation(conversationId);
                expect(conversationAfter?.DeleteTime).toBeDefined();
            });

            it('should handle error injection for bulk DELETE', async () => {
                // Inject a 500 error for bulk delete
                mockErrorHandler.injectError('/api/lumo/v1/spaces', 'DELETE', 500);

                const response = await fetch(`${baseUrl}/api/lumo/v1/spaces`, {
                    method: 'DELETE',
                });

                expect(response.status).toBe(500);
                const responseData = await response.json();
                expect(responseData.Code).toBe(5000);
                expect(responseData.Error).toBe('Injected error');
            });
        });

        describe('Conversations API', () => {
            it('should create conversations via POST', async () => {
                const spaceId = await mockDb.getNextSpaceId();
                mockDb.addSpace({
                    ID: spaceId,
                    CreateTime: new Date().toISOString(),
                    SpaceKey: 'test-key',
                    SpaceTag: 'test-tag',
                    Encrypted: 'encrypted-data' as Base64,
                });

                const requestBody = {
                    ConversationTag: 'conv-tag',
                    Encrypted: 'conv-encrypted-data',
                    IsStarred: false,
                };

                const response = await fetch(`${baseUrl}/api/lumo/v1/spaces/${spaceId}/conversations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody),
                });

                expect(response.status).toBe(200);
                const responseData = await response.json();
                expect(responseData.Code).toBe(1000);
                expect(responseData.Conversation.ID).toBeDefined();

                // Verify conversation was added to mock database
                const conversation = mockDb.getConversation(responseData.Conversation.ID);
                expect(conversation).toBeDefined();
                expect(conversation!.ConversationTag).toBe('conv-tag');
                expect(conversation!.SpaceID).toBe(spaceId);
            });

            it('should get conversations with messages via GET', async () => {
                const conversationId = await mockDb.getNextConversationId();
                const messageId = await mockDb.getNextMessageId();

                mockDb.addConversation({
                    ID: conversationId,
                    SpaceID: 'space-id',
                    CreateTime: new Date().toISOString(),
                    IsStarred: false,
                    Encrypted: 'conv-data',
                    ConversationTag: 'conv-tag',
                });

                mockDb.addMessage({
                    ID: messageId,
                    ConversationID: conversationId,
                    CreateTime: new Date().toISOString(),
                    Role: RoleInt.User,
                    Status: StatusInt.Succeeded,
                    Encrypted: 'msg-data',
                    MessageTag: 'msg-tag',
                });

                const response = await fetch(`${baseUrl}/api/lumo/v1/conversations/${conversationId}`);
                expect(response.status).toBe(200);

                const responseData = await response.json();
                expect(responseData.Code).toBe(1000);
                expect(responseData.Conversation.ID).toBe(conversationId);
                expect(responseData.Conversation.Messages).toHaveLength(1);
                expect(responseData.Conversation.Messages[0].ID).toBe(messageId);
                // Messages should not include encrypted data in shallow response
                expect(responseData.Conversation.Messages[0].Encrypted).toBeUndefined();
            });
        });

        describe('Messages API', () => {
            it('should create messages via POST', async () => {
                const conversationId = await mockDb.getNextConversationId();
                mockDb.addConversation({
                    ID: conversationId,
                    SpaceID: 'space-id',
                    CreateTime: new Date().toISOString(),
                    IsStarred: false,
                    Encrypted: 'conv-data',
                    ConversationTag: 'conv-tag',
                });

                const requestBody = {
                    MessageTag: 'msg-tag',
                    Encrypted: 'msg-encrypted-data',
                    Role: RoleInt.User,
                    Status: StatusInt.Succeeded,
                };

                const response = await fetch(`${baseUrl}/api/lumo/v1/conversations/${conversationId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody),
                });

                expect(response.status).toBe(200);
                const responseData = await response.json();
                expect(responseData.Code).toBe(1000);
                expect(responseData.Message.ID).toBeDefined();

                // Verify message was added to mock database
                const message = mockDb.getMessage(responseData.Message.ID);
                expect(message).toBeDefined();
                expect(message!.MessageTag).toBe('msg-tag');
                expect(message!.ConversationID).toBe(conversationId);
            });

            it('should get messages via GET', async () => {
                const messageId = await mockDb.getNextMessageId();
                mockDb.addMessage({
                    ID: messageId,
                    ConversationID: 'conv-id',
                    CreateTime: new Date().toISOString(),
                    Role: RoleInt.User,
                    Status: StatusInt.Succeeded,
                    Encrypted: 'msg-data',
                    MessageTag: 'msg-tag',
                });

                const response = await fetch(`${baseUrl}/api/lumo/v1/messages/${messageId}`);
                expect(response.status).toBe(200);

                const responseData = await response.json();
                expect(responseData.Code).toBe(1000);
                expect(responseData.Message.ID).toBe(messageId);
                expect(responseData.Message.MessageTag).toBe('msg-tag');
                // Full message should include encrypted data
                expect(responseData.Message.Encrypted).toBe('msg-data');
            });

            it('should return 409 when message already exists', async () => {
                // noinspection DuplicatedCode
                const conversationId = await mockDb.getNextConversationId();
                mockDb.addConversation({
                    ID: conversationId,
                    SpaceID: 'space-id',
                    CreateTime: new Date().toISOString(),
                    IsStarred: false,
                    Encrypted: 'conv-data',
                    ConversationTag: 'conv-tag',
                });

                const localId = newMessageId();
                const requestBody = {
                    MessageTag: localId,
                    Encrypted: 'msg-encrypted-data',
                    Role: RoleInt.User,
                    Status: StatusInt.Succeeded,
                };

                // First request should succeed
                const response1 = await fetch(`${baseUrl}/api/lumo/v1/conversations/${conversationId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody),
                });
                expect(response1.status).toBe(200);
                const responseData1 = await response1.json();
                expect(responseData1.Code).toBe(1000);
                expect(responseData1.Message.ID).toBeDefined();
                const nbConflictErrors1 = mockDb.getNbConflictErrors(localId);
                expect(nbConflictErrors1).toBe(0);

                // Second request should be rejected (tag already exists)
                const response2 = await fetch(`${baseUrl}/api/lumo/v1/conversations/${conversationId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody),
                });
                expect(response2.status).toBe(409);
                const nbConflictErrors2 = mockDb.getNbConflictErrors(localId);
                expect(nbConflictErrors2).toBeGreaterThan(0);
            });
        });

        describe('Assets API', () => {
            it('should create assets via POST', async () => {
                const spaceId = await mockDb.getNextSpaceId();
                mockDb.addSpace({
                    ID: spaceId,
                    CreateTime: new Date().toISOString(),
                    SpaceKey: 'test-key',
                    SpaceTag: 'test-tag',
                    Encrypted: 'encrypted-data' as Base64,
                });

                const requestBody = {
                    AssetTag: 'asset-tag',
                    Encrypted: 'asset-encrypted-data',
                };

                const response = await fetch(`${baseUrl}/api/lumo/v1/spaces/${spaceId}/assets`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody),
                });

                expect(response.status).toBe(200);
                const responseData = await response.json();
                expect(responseData.Code).toBe(1000);
                expect(responseData.Asset.ID).toBeDefined();

                // Verify asset was added to mock database
                const asset = mockDb.getAsset(responseData.Asset.ID);
                expect(asset).toBeDefined();
                expect(asset!.AssetTag).toBe('asset-tag');
                expect(asset!.SpaceID).toBe(spaceId);
            });

            it('should get assets via GET', async () => {
                const assetId = await mockDb.getNextAssetId();
                mockDb.addAsset({
                    ID: assetId,
                    SpaceID: 'space-id',
                    CreateTime: new Date().toISOString(),
                    Encrypted: 'asset-data' as Base64,
                    AssetTag: 'asset-tag',
                });

                const response = await fetch(`${baseUrl}/api/lumo/v1/assets/${assetId}`);
                expect(response.status).toBe(200);

                const responseData = await response.json();
                expect(responseData.Code).toBe(1000);
                expect(responseData.Asset.ID).toBe(assetId);
                expect(responseData.Asset.AssetTag).toBe('asset-tag');
                // Shallow asset should not include encrypted data
                expect(responseData.Asset.Encrypted).toBeUndefined();
            });

            it('should delete assets via DELETE', async () => {
                const assetId = await mockDb.getNextAssetId();
                mockDb.addAsset({
                    ID: assetId,
                    SpaceID: 'space-id',
                    CreateTime: new Date().toISOString(),
                    Encrypted: 'asset-data' as Base64,
                    AssetTag: 'asset-tag',
                });

                const response = await fetch(`${baseUrl}/api/lumo/v1/assets/${assetId}`, {
                    method: 'DELETE',
                });
                expect(response.status).toBe(200);

                const responseData = await response.json();
                expect(responseData.Code).toBe(1000);

                // Verify asset was soft deleted
                const deletedAsset = mockDb.getAsset(assetId);
                expect(deletedAsset?.DeleteTime).toBeDefined();
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle injected errors', async () => {
            mockErrorHandler.injectError('/api/lumo/v1/spaces', 'POST', 500);

            const response = await fetch(`${baseUrl}/api/lumo/v1/spaces`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    SpaceKey: 'test-key',
                    SpaceTag: 'test-tag',
                    Encrypted: 'encrypted-data',
                }),
            });

            expect(response.status).toBe(500);
        });

        it('should validate parameters for undefined strings', async () => {
            const response = await fetch(`${baseUrl}/api/lumo/v1/spaces/undefined`, {
                method: 'GET',
            });

            expect(response.status).toBe(500);
        });

        it('should validate timestamp parameters', async () => {
            const response = await fetch(`${baseUrl}/api/lumo/v1/spaces?CreateTimeSince=invalid`, {
                method: 'GET',
            });

            expect(response.status).toBe(400);
            const body = await response.json();
            expect(body.Error).toContain('Invalid timestamp format');
        });
    });

    describe('Utility Functions', () => {
        it('should generate deterministic server IDs', async () => {
            const id1 = await serverId(1);
            const id2 = await serverId(1);
            const id3 = await serverId(2);

            expect(id1).toBe(id2);
            expect(id1).not.toBe(id3);
            expect(typeof id1).toBe('string');
            expect(id1.length).toBeGreaterThan(10); // SHA256 base64 should be long
        });
    });
});
