import type { OfflineKey } from './offlineKey';
import type { SessionAccessTypeMask } from './sessionAccessType';

export enum SessionSource {
    Proton,
    Saml,
    Oauth,
    Msp,
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
    accessTypeMask: SessionAccessTypeMask;
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

/**
 * The minimal amount of data needed to match a session listed by `auth/v4/sessions/local` to one
 * this client persisted. Everything else about such a session, the access type included, comes from
 * the API response.
 */
export type PersistedSessionLite = Pick<PersistedSession, 'localID'>;

/**
 * What the `iaas` cookie still carries per session. The access type is written only for clients
 * that read it from the cookie rather than from `auth/v4/sessions/local`; once those are gone this
 * collapses into {@link PersistedSessionLite}.
 */
export type PersistedSessionCookieData = Pick<PersistedSession, 'localID' | 'accessTypeMask'>;
