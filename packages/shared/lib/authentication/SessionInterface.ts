import type { OfflineKey } from '@proton/shared/lib/authentication/offlineKey';

export type PersistedSessionBlob =
    | {
          keyPassword: string;
          type?: 'default';
      }
    | {
          type: 'offline';
          keyPassword: string;
          offlineKeyPassword: OfflineKey['password'];
      };

export interface DefaultPersistedSession {
    UserID: string;
    UID: string;
    blob?: string;
    isSubUser: boolean;
    persistent: boolean;
    trusted: boolean;
    payloadVersion: 2 | 1;
    payloadType: 'default';
    persistedAt: number;
}

export interface OfflinePersistedSession extends Omit<DefaultPersistedSession, 'payloadType'> {
    offlineKeySalt: string;
    payloadType: 'offline';
}

export type PersistedSession = OfflinePersistedSession | DefaultPersistedSession;

export type PersistedSessionWithLocalID = PersistedSession & {
    localID: number;
};
