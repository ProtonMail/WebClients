/* eslint-disable no-nested-ternary */
import { getClientID } from '@proton/shared/lib/apps/helper';
import { getAppVersionHeaders } from '@proton/shared/lib/fetch/headers';

import config from '../config';
import { ClientError, ConflictClientError } from '../redux/sagas';
import type { Base64, MasterKey, MessageId, ProtonApiResponse } from '../types';
import { LUMO_ELIGIBILITY, isProtonApiResponse, isRemoteId } from '../types';
import { listify } from '../util/collections';
import { dateToUnixTimestamp } from '../util/date';
import { objectFilterV } from '../util/objects';
import {
    convertAssetFromApi,
    convertConversationFromApi,
    convertMasterKeysFromApi,
    convertMessageFromApi,
    convertSpaceFromApi,
    convertSpacesFromApi,
    convertUserSettingsFromApi,
} from './conversion';
import { type Priority, RequestScheduler } from './scheduler';
import type {
    ConversationTag,
    ConversationToApi,
    GetConversationRemote,
    GetSpaceRemote,
    ListSpacesRemote,
    LocalId,
    MasterKeyFromApi,
    MasterKeyToApi,
    MessageToApi,
    NewAssetToApi,
    NewConversationToApi,
    NewMessageToApi,
    NewSpaceToApi,
    RemoteDeletedAsset,
    RemoteDeletedAttachment,
    RemoteFilledAsset,
    RemoteFilledAttachment,
    RemoteId,
    RemoteMessage,
    SerializedUserSettings,
    SpaceTag,
    SpaceToApi,
    UserSettingsFromApi,
    UserSettingsToApi,
} from './types';
import { objectToPascalCaseKeys, oldestDateReducer } from './util';

export type RemoteStatus = 'ok' | 'deleted';
export type ResourceName =
    | 'masterkeys'
    | 'spaces'
    | 'conversations'
    | 'messages'
    | 'assets'
    | 'personalization'
    | 'settings';

// prettier-ignore
type PostableResource =
    | NewMessageToApi
    | NewConversationToApi
    | NewSpaceToApi
    | NewAssetToApi
    | MasterKeyFromApi
    | UserSettingsToApi
    ;

// prettier-ignore
type PuttableResource =
    | ConversationToApi
    | SpaceToApi
    | { ID: RemoteId; SpaceID: RemoteId; Encrypted?: Base64; AssetTag: string }; // AssetToApi

export type ListSpacesParams = {
    createTimeUntil?: number; // unix timestamp (seconds)
    createTimeSince?: number; // unix timestamp (seconds)
};

const idExtractorMap: Record<ResourceName, (json: object) => RemoteId | undefined> = {
    messages: (json) => (json as any)?.Message?.ID,
    conversations: (json) => (json as any)?.Conversation?.ID,
    spaces: (json) => (json as any)?.Space?.ID,
    assets: (json) => (json as any)?.Asset?.ID,
    masterkeys: () => undefined,
    personalization: () => undefined,
    settings: () => undefined,
};

export interface LumoApi {
    postSpace(spaceArgs: NewSpaceToApi, priority: Priority): Promise<RemoteId | null>;
    putSpace(spaceArgs: SpaceToApi, priority: Priority): Promise<RemoteStatus>;
    deleteSpace(spaceId: RemoteId, priority: Priority): Promise<RemoteStatus>;
    listSpaces(): Promise<ListSpacesRemote>;
    getSpace(spaceId: RemoteId): Promise<GetSpaceRemote | null>;

    postConversation(convArgs: NewConversationToApi, priority: Priority): Promise<RemoteId | null>;
    putConversation(convArgs: ConversationToApi, priority: Priority): Promise<RemoteStatus>;
    deleteConversation(convId: RemoteId, priority: Priority): Promise<RemoteStatus>;
    getConversation(convId: RemoteId, spaceId: LocalId): Promise<GetConversationRemote | null>;

    postMessage(messageArgs: NewMessageToApi, priority: Priority): Promise<RemoteId | null>;
    getMessage(
        messageId: RemoteId,
        conversationId: LocalId,
        parentId: LocalId | undefined,
        remoteConversationId: RemoteId | undefined
    ): Promise<RemoteMessage | null>;

    postAttachment(attachmentArgs: NewAssetToApi, priority: Priority): Promise<RemoteId | null>;
    deleteAttachment(attachmentId: RemoteId, priority: Priority): Promise<RemoteStatus>;
    getAttachment(
        attachmentId: RemoteId,
        spaceId: LocalId
    ): Promise<RemoteFilledAttachment | RemoteDeletedAttachment | null>;

    postAsset(assetArgs: NewAssetToApi, priority: Priority): Promise<RemoteId | null>;
    deleteAsset(assetId: RemoteId, priority: Priority): Promise<RemoteStatus>;
    getAsset(assetId: RemoteId, spaceId: LocalId): Promise<RemoteFilledAsset | RemoteDeletedAsset | null>;

    // User settings methods
    getUserSettings(): Promise<SerializedUserSettings | null>;
    postUserSettings(userSettingsArgs: UserSettingsToApi): Promise<RemoteStatus>;
    putUserSettings(userSettingsArgs: UserSettingsToApi): Promise<RemoteStatus>;
}

export class LumoApi {
    private uid: string | undefined;

    private scheduler = new RequestScheduler(5);

    constructor(uid?: string) {
        this.uid = uid;
    }

    private protonHeaders() {
        if (!this.uid) {
            throw new Error('UID must be set before making API calls.');
        }

        return {
            ...getAppVersionHeaders(getClientID(config.APP_NAME), config.APP_VERSION),
            'x-pm-uid': this.uid,
        };
    }

    public setUid(uid: string) {
        this.uid = uid;
    }

    private async callPostJson(
        resourceName: ResourceName,
        resource: PostableResource,
        path?: string
    ): Promise<RemoteId> {
        const response = await this.sendPostJson(resourceName, resource, path);
        const json = await response.json();
        if (!response.ok) {
            if (response.status === 409) {
                throw new ConflictClientError(`Error during POST ${resourceName}: resource already exists`);
            } else if (response.status >= 400 && response.status < 500) {
                // 4xx don't retry
                throw new ClientError(`Error during POST ${resourceName}: got ${response.status}`);
            }
            throw new Error(`Error during POST ${resourceName}: got ${response.status}`);
        }
        const idExtractor = idExtractorMap[resourceName];
        if (!idExtractor) {
            throw new Error('Unknown resource name');
        }

        const remoteId = idExtractor(json);
        if (!remoteId) {
            throw new Error("POST: can't find remote ID in response");
        }
        if (!isRemoteId(remoteId)) {
            throw new Error('POST: invalid remote ID in response');
        }

        return remoteId;
    }

    private async sendPostJson(
        resourceName: ResourceName,
        resource: PostableResource,
        path?: string
    ): Promise<Response> {
        path = !path ? `/${resourceName}` : path.startsWith('/') ? path : `/${path}`;
        const url = `/api/lumo/v1${path}`;
        console.log(`lumo api: http post ${url} <-`, resource);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.protonHeaders(),
            },
            body: JSON.stringify(resource),
        });

        if (response.ok) {
            return response;
        } else {
            if (response.status >= 400 && response.status < 500) {
                return response;
            }
            throw new Error(`Error during POST ${resourceName}: got ${response.status}`);
        }
    }

    private async sendPutJson(
        resourceName: ResourceName,
        resource: PostableResource,
        path?: string
    ): Promise<Response> {
        path = !path ? `/${resourceName}` : path.startsWith('/') ? path : `/${path}`;
        const url = `/api/lumo/v1${path}`;
        console.log(`lumo api: http put ${url} <-`, resource);
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...this.protonHeaders(),
            },
            body: JSON.stringify(resource),
        });
        return response;
    }

    private async callPutJson(
        resourceName: ResourceName,
        resource: PuttableResource,
        path?: string
    ): Promise<RemoteStatus> {
        path = !path ? `/${resourceName}/${resource.ID}` : path.startsWith('/') ? path : `/${path}`;
        const url = `/api/lumo/v1${path}`;
        console.log(`lumo api: http put ${url} <-`, resource);
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...this.protonHeaders(),
            },
            body: JSON.stringify(resource),
        });
        if (response.status === 422) {
            const json = response.json();
            if (!isProtonApiResponse(json)) {
                throw new Error('Proton response error: expected an object of type ProtonApiResponse');
            }
            if (json.Code === 2501) {
                return 'deleted';
            } else {
                throw new Error(`Proton response error: unexpected error code ${json.Code}`);
            }
        } else if (response.ok) {
            return 'ok';
        } else {
            throw new Error(`HTTP error: got ${response.status}`);
        }
    }

    private async callListJson(resourceName: ResourceName, params?: Record<string, any>): Promise<any> {
        let url = `/api/lumo/v1/${resourceName}`;
        if (params) {
            params = objectFilterV(params, (v) => v !== undefined);
            const urlParams = new URLSearchParams(params);
            url += `?${urlParams}`;
        }
        console.log(`lumo api: http get ${url} <- params:`, params || 'none');
        const response = await fetch(url, {
            method: 'GET',
            headers: this.protonHeaders(),
        });
        if (response.ok) {
            return response.json();
        } else {
            throw new Error(`HTTP error: got ${response.status}`);
        }
    }

    private async callGetJson(resourceName: ResourceName, id: RemoteId): Promise<ProtonApiResponse | null> {
        const url = `/api/lumo/v1/${resourceName}/${id}`;
        console.log(`lumo api: http get ${url}`);
        const response = await fetch(url, {
            method: 'GET',
            headers: this.protonHeaders(),
        });
        if (response.status === 422) {
            const json = await response.json();
            if (!isProtonApiResponse(json)) {
                throw new Error('Proton response error: expected an object of type ProtonApiResponse');
            }
            if (json.Code === 2501) {
                return null;
            } else {
                throw new Error(`Proton response error: unexpected error code ${json.Code}`);
            }
        } else if (response.ok) {
            const json = await response.json();
            if (!isProtonApiResponse(json)) {
                throw new Error('Proton response error: expected an object of type ProtonApiResponse');
            }
            if (json.Code !== 1000) {
                throw new Error(`Proton response error: unexpected code ${json.Code}`);
            }
            return json;
        } else {
            throw new Error(`HTTP error: got ${response.status}`);
        }
    }

    private async callDelete(resourceName: ResourceName, id: RemoteId): Promise<RemoteStatus> {
        const url = `/api/lumo/v1/${resourceName}/${id}`;
        console.log(`lumo api: http delete ${url}`);
        const response = await fetch(url, {
            method: 'DELETE',
            headers: this.protonHeaders(),
        });
        if (response.ok) {
            return 'ok';
        } else if (response.status === 422) {
            const json = await response.json();
            if (!isProtonApiResponse(json)) {
                throw new Error('Proton response error: expected an object of type ProtonApiResponse');
            }
            if (json.Code === 2501) {
                return 'deleted';
            } else {
                throw new Error(`Proton response error: unexpected error code ${json.Code}`);
            }
        } else if (response.status >= 400 && response.status < 500) {
            // 4xx don't retry
            throw new ClientError(`Error during DELETE ${resourceName}: got ${response.status}`);
        } else {
            throw new Error(`HTTP error: got ${response.status}`);
        }
    }

    public async callDeleteAllSpaces(): Promise<RemoteStatus> {
        const url = `/api/lumo/v1/spaces`;
        console.log(`lumo api: http delete all space ${url}`);
        const response = await fetch(url, {
            method: 'DELETE',
            headers: this.protonHeaders(),
        });
        if (response.ok) {
            return 'ok';
        } else if (response.status === 422) {
            const json = await response.json();
            if (!isProtonApiResponse(json)) {
                throw new Error('Proton response error: expected an object of type ProtonApiResponse');
            }
            if (json.Code === 2501) {
                return 'deleted';
            } else {
                throw new Error(`Proton response error: unexpected error code ${json.Code}`);
            }
        } else if (response.status >= 400 && response.status < 500) {
            // 4xx don't retry
            throw new ClientError(`Error during DELETE all spaces: got ${response.status}`);
        } else {
            throw new Error(`HTTP error: got ${response.status}`);
        }
    }

    // BE response dependent on FF
    public async getMasterKey(): Promise<{ eligibility: number; key: Base64 | null }> {
        const data = await this.callListJson('masterkeys');
        const eligibility = data.Eligibility;

        if (eligibility !== LUMO_ELIGIBILITY.Eligible) {
            return { eligibility, key: null };
        }

        const keys = convertMasterKeysFromApi(data.MasterKeys);

        if (keys.length === 0) {
            return { eligibility, key: null };
        }

        const key = this.findBestKey(keys);
        return { eligibility, key: key.masterKey };
    }

    private findBestKey(keys: []): undefined;
    private findBestKey(keys: MasterKey[]): MasterKey;
    private findBestKey(keys: MasterKey[]): MasterKey | undefined {
        return keys.reduce((best: MasterKey | undefined, current: MasterKey) => {
            if (!best) return current;
            if (current.isLatest && !best.isLatest) {
                return current;
            } else if (!current.isLatest && best.isLatest) {
                return best;
            } else if (current.version > best.version) {
                return current;
            } else if (current.version < best.version) {
                return best;
            } else {
                // Compare by createdAt if isLatest and version are the same
                const currentCreatedAt = new Date(current.createdAt);
                const bestCreatedAt = new Date(best.createdAt);
                if (currentCreatedAt > bestCreatedAt) {
                    return current;
                } else if (currentCreatedAt < bestCreatedAt) {
                    return best;
                } else {
                    // In case createdAt is the same(!) we need to make a choice,
                    // let's take the lowest id
                    if (current.id < best.id) {
                        return current;
                    } else {
                        return best;
                    }
                }
            }
        }, undefined);
    }

    public async postMasterKey(masterKeyToApi: MasterKeyToApi) {
        const response = await this.sendPostJson('masterkeys', masterKeyToApi);
        if (!response.ok) {
            throw new Error(`Failed to POST master key: got ${response.status}`);
        }
    }

    // User settings methods
    public async getUserSettings(): Promise<SerializedUserSettings | null> {
        try {
            const data = await this.callListJson('settings');
            const userSettingsFromApi = data?.UserSettings as UserSettingsFromApi;

            if (!userSettingsFromApi) {
                return null;
            }
            return convertUserSettingsFromApi(userSettingsFromApi);
        } catch (error) {
            console.warn('Failed to get user settings:', error);
            return null;
        }
    }

    public async postUserSettings(userSettingsArgs: UserSettingsToApi): Promise<RemoteStatus> {
        const response = await this.sendPostJson('settings', userSettingsArgs);
        if (!response.ok) {
            throw new Error(`Failed to POST user settings: got ${response.status}`);
        }
        return 'ok';
    }

    public async putUserSettings(userSettingsArgs: UserSettingsToApi): Promise<RemoteStatus> {
        const response = await this.sendPutJson('settings', userSettingsArgs);
        if (!response.ok) {
            throw new Error(`Failed to PUT user settings: got ${response.status}`);
        }
        return 'ok';
    }

    public postSpace(space: NewSpaceToApi, priority: Priority): Promise<RemoteId> {
        const fn = () => this.callPostJson('spaces', space);
        return this.scheduler.schedule(fn, priority);
    }

    public postConversation(conversation: NewConversationToApi, priority: Priority): Promise<RemoteId> {
        const path = `/spaces/${conversation.SpaceID}/conversations`;
        const fn = () => this.callPostJson('conversations', conversation, path);
        return this.scheduler.schedule(fn, priority);
    }

    public postMessage(message: MessageToApi | NewMessageToApi, priority: Priority): Promise<RemoteId> {
        const path = `/conversations/${message.ConversationID}/messages`;
        const fn = () => this.callPostJson('messages', message, path);
        return this.scheduler.schedule(fn, priority);
    }

    public putSpace(space: SpaceToApi, priority: Priority): Promise<RemoteStatus> {
        const fn = () => this.callPutJson('spaces', space);
        return this.scheduler.schedule(fn, priority);
    }

    public putConversation(conversation: ConversationToApi, priority: Priority): Promise<RemoteStatus> {
        const fn = () => this.callPutJson('conversations', conversation);
        return this.scheduler.schedule(fn, priority);
    }

    public postAsset(asset: NewAssetToApi, priority: Priority): Promise<RemoteId> {
        const path = `/spaces/${asset.SpaceID}/assets`;
        const fn = () => this.callPostJson('assets', asset, path);
        return this.scheduler.schedule(fn, priority);
    }

    public postAttachment(attachmentArgs: NewAssetToApi, priority: Priority): Promise<RemoteId> {
        return this.postAsset(attachmentArgs, priority);
    }

    public deleteSpace(id: RemoteId, priority: Priority): Promise<RemoteStatus> {
        const fn = () => this.callDelete('spaces', id);
        return this.scheduler.schedule(fn, priority);
    }

    public deleteConversation(id: RemoteId, priority: Priority): Promise<RemoteStatus> {
        const fn = () => this.callDelete('conversations', id);
        return this.scheduler.schedule(fn, priority);
    }

    public deleteMessage(id: RemoteId, priority: Priority): Promise<RemoteStatus> {
        const fn = () => this.callDelete('messages', id);
        return this.scheduler.schedule(fn, priority);
    }

    public deleteAsset(attachmentId: RemoteId, priority: Priority): Promise<RemoteStatus> {
        const fn = () => this.callDelete('assets', attachmentId);
        return this.scheduler.schedule(fn, priority);
    }

    public deleteAttachment(attachmentId: RemoteId, priority: Priority): Promise<RemoteStatus> {
        return this.deleteAsset(attachmentId, priority);
    }

    public async listSpaces(params?: ListSpacesParams): Promise<ListSpacesRemote> {
        const casedParams = params && objectToPascalCaseKeys(params);
        const data = await this.callListJson('spaces', casedParams);
        console.log('listSpaces: data =', data);
        return convertSpacesFromApi(data.Spaces);
    }

    public async listSpacesPaginate(): Promise<ListSpacesRemote> {
        let result: ListSpacesRemote = {
            spaces: {},
            conversations: {},
            deletedSpaces: {},
            deletedConversations: {},
            assets: {},
            deletedAssets: {},
        };
        let lastTimestamp: Date | undefined;
        while (true) {
            const createTimeUntil = lastTimestamp ? dateToUnixTimestamp(lastTimestamp) : undefined;
            const next = await this.listSpaces({ createTimeUntil });
            const newLastTimestamp = listify({ ...next.spaces, ...next.deletedSpaces })
                .map((s) => new Date(s.createdAt))
                .reduce(oldestDateReducer, lastTimestamp);
            if (!newLastTimestamp || (lastTimestamp && newLastTimestamp >= lastTimestamp)) break;
            lastTimestamp = newLastTimestamp;
            result = {
                spaces: { ...result.spaces, ...next.spaces },
                conversations: { ...result.conversations, ...next.conversations },
                deletedSpaces: { ...result.deletedSpaces, ...next.deletedSpaces },
                deletedConversations: { ...result.deletedConversations, ...next.deletedConversations },
                assets: { ...result.assets, ...(next.assets || {}) },
                deletedAssets: { ...result.deletedAssets, ...(next.deletedAssets || {}) },
            };
        }
        return result;
    }

    public async getSpace(spaceId: RemoteId): Promise<GetSpaceRemote | null> {
        const data = await this.callGetJson('spaces', spaceId);
        if (data === null) return null;
        return convertSpaceFromApi(data.Space);
    }

    public async getConversation(id: RemoteId, spaceTag: SpaceTag): Promise<GetConversationRemote | null> {
        const data = await this.callGetJson('conversations', id);
        if (data === null) return null;
        return convertConversationFromApi(data.Conversation, spaceTag);
    }

    public async getMessage(
        id: RemoteId,
        conversationTag: ConversationTag,
        parentId: MessageId | undefined,
        remoteConversationId: RemoteId
    ): Promise<RemoteMessage | null> {
        const data = await this.callGetJson('messages', id);
        if (data === null) return null;
        return convertMessageFromApi(data.Message, conversationTag, parentId, remoteConversationId);
    }

    public async getAsset(id: RemoteId, spaceTag: SpaceTag): Promise<RemoteFilledAsset | RemoteDeletedAsset | null> {
        const data = await this.callGetJson('assets', id);
        if (data === null) return null;
        const asset = convertAssetFromApi(data.Asset, spaceTag);
        if (asset.deleted) return asset;
        if (!asset.encrypted) {
            console.log('getAsset: remote asset does not have the `Encrypted` field set');
            return null;
        }
        // Sorry for the weird juggling below; if I do `return asset`, TypeScript complains that `asset.encrypted`
        // can be undefined, which clearly it cannot because of the `if (!asset.encrypted) return` above.
        // Anyway, this is type safe: it guarantees the return type is cleanly satisfied.
        return { ...asset, encrypted: asset.encrypted };
    }

    public getAttachment(
        attachmentId: RemoteId,
        spaceId: LocalId
    ): Promise<RemoteFilledAttachment | RemoteDeletedAttachment | null> {
        return this.getAsset(attachmentId, spaceId);
    }
}
