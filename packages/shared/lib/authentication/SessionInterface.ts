import type { AccessType } from '@proton/shared/lib/authentication/accessType';
import type { OfflineKey } from '@proton/shared/lib/authentication/offlineKey';

export enum SessionSource {
    Proton,
    Saml,
    Oauth,
}

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
    localID: number;
    UserID: string;
    UID: string;
    blob?: string;
    accessType: AccessType;
    persistent: boolean;
    trusted: boolean;
    payloadVersion: 2 | 1;
    payloadType: 'default';
    persistedAt: number;
    source: SessionSource;
}

export interface OfflinePersistedSession extends Omit<DefaultPersistedSession, 'payloadType'> {
    offlineKeySalt: string;
    payloadType: 'offline';
}

export type PersistedSession = OfflinePersistedSession | DefaultPersistedSession;

// The minimal amount of data needed to render the session list
export type PersistedSessionLite = Pick<PersistedSession, 'localID' | 'accessType'>;
