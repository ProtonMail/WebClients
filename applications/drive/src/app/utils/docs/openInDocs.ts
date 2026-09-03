import { splitNodeUid } from '@proton/drive';
import { featureFlagStore } from '@proton/drive/modules/flags';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { handleDocsCustomPassword } from '@proton/shared/lib/drive/sharing/publicDocsSharing';
import { isDevOrBlack } from '@proton/shared/lib/env';
import type { OpenInDocsType, ProtonDocumentType } from '@proton/shared/lib/helpers/mimetype';
import { mimeTypeToOpenInDocsType } from '@proton/shared/lib/helpers/mimetype';
import { getNewWindow } from '@proton/shared/lib/helpers/window';

import { extraThunkArguments } from '../../redux-store/thunk';
import { tmpConvertNewDocTypeToOld } from './tmpConvertNewDocTypeToOld';

export type DocumentType = 'doc' | 'sheet';

/**
 * When coming back from the account sign up or sign in, we are usually coming back after the user initiated the auth
 * by pressing Bookmark or Make Copy button. The `action` param in the URL will tell us where to pick back up once
 * we're back in Docs.
 *
 * DRIVE-DEVS: Do not remove export. Used by drive-store.
 */
export enum RedirectAction {
    Bookmark = 'bookmark',
    MakeCopy = 'make-copy',
}

export const getOpenInDocsInfo = (mediaType: string): OpenInDocsType | undefined => {
    const isODSImportEnabled = featureFlagStore.getState().isEnabled('SheetsODSImportEnabled');
    const isODTEnabled = featureFlagStore.getState().isEnabled('DocsODTEnabled') || isDevOrBlack();
    const isSheetsDisabled = featureFlagStore.getState().isEnabled('DocsSheetsDisabled');
    const isDocsDisabled = featureFlagStore.getState().isEnabled('DriveDocsDisabled');

    const openInDocsType = mimeTypeToOpenInDocsType(mediaType, isODSImportEnabled, isODTEnabled);

    if (
        !openInDocsType ||
        (openInDocsType.type === 'document' && isDocsDisabled) ||
        (openInDocsType.type === 'spreadsheet' && isSheetsDisabled)
    ) {
        return undefined;
    }

    return openInDocsType;
};

type DocumentUrlParams = {
    type: DocumentType | ProtonDocumentType;
} & (
    | {
          mode: 'open' | 'convert' | 'download' | 'history';
          linkId: string;
          volumeId: string;
      }
    | {
          mode: 'create';
          parentLinkId: string;
          volumeId: string;
      }
    | {
          mode: 'new';
      }
    | {
          mode: 'open-url';
          action?: RedirectAction;
          linkId?: string;
          token: string;
          urlPassword: string;
      }
    | {
          mode: 'open-url-download';
          action?: RedirectAction;
          linkId?: string;
          token: string;
          urlPassword: string;
      }
    | {
          mode: 'open-url-reauth';
          action?: RedirectAction;
          linkId?: string;
          token: string;
      }
    | {
          mode: 'copy-public';
      }
);

export const buildDocumentUrl = (params: DocumentUrlParams): URL => {
    const { type: originalType, mode } = params;
    const type = tmpConvertNewDocTypeToOld(originalType);

    const getLocalID = () => {
        return extraThunkArguments.authentication?.getLocalID?.();
    };

    const href = getAppHref(`/${type}`, APPS.PROTONDOCS, getLocalID());
    const url = new URL(href);

    url.searchParams.append('mode', mode);

    if ('volumeId' in params && params.volumeId) {
        url.searchParams.append('volumeId', params.volumeId);
    } else if ('token' in params && params.token) {
        url.searchParams.append('token', params.token);
    }

    if ('linkId' in params && params.linkId) {
        url.searchParams.append('linkId', params.linkId);
    } else if ('parentLinkId' in params && params.parentLinkId) {
        url.searchParams.append('parentLinkId', params.parentLinkId);
    }

    if ('urlPassword' in params && params.urlPassword) {
        url.hash = params.urlPassword;
    }

    return url;
};

export const createDocument = async ({
    parentUid,
    type,
    openBehavior = 'tab',
}: {
    parentUid: string;
    type: DocumentType | ProtonDocumentType;
    openBehavior?: 'tab' | 'redirect';
}) => {
    const { volumeId, nodeId } = splitNodeUid(parentUid);
    const url = buildDocumentUrl({ type, mode: 'create', volumeId, parentLinkId: nodeId });
    if (openBehavior === 'tab') {
        getNewWindow(url.toString());
    } else {
        window.location.assign(url);
    }
};

const openDocument = async ({
    uid,
    openBehavior = 'tab',
    type,
}: {
    uid: string;
    openBehavior?: 'tab' | 'redirect';
    type: DocumentType | ProtonDocumentType;
}) => {
    const { volumeId, nodeId } = splitNodeUid(uid);
    const url = buildDocumentUrl({ type, mode: 'open', volumeId, linkId: nodeId });
    if (openBehavior === 'tab') {
        getNewWindow(url.toString());
    } else {
        window.location.assign(url);
    }
};

const openPublicDocument = async ({
    uid,
    openBehavior = 'tab',
    type,
    token,
    urlPassword,
    customPassword,
}: {
    uid: string;
    openBehavior?: 'tab' | 'redirect';
    type: DocumentType | ProtonDocumentType;
    token: string;
    urlPassword: string;
    customPassword?: string;
}) => {
    const { nodeId } = splitNodeUid(uid);
    const url = buildDocumentUrl({ type, mode: 'open-url', linkId: nodeId, token, urlPassword });
    if (openBehavior === 'redirect') {
        window.location.assign(url);
    } else if (customPassword) {
        // handleDocsCustomPassword opens a blank window before showing the password
        // prompt — the two-step pattern is intentional here.
        const w = handleDocsCustomPassword(customPassword);
        try {
            w.handle.location.assign(url);
        } catch (e) {
            w.close();
            throw e;
        }
    } else {
        getNewWindow(url.toString());
    }
};

export const downloadDocument = async ({
    uid,
    openBehavior = 'tab',
    type,
}: {
    uid: string;
    openBehavior?: 'tab' | 'redirect';
    type: DocumentType | ProtonDocumentType;
}) => {
    const { volumeId, nodeId } = splitNodeUid(uid);
    const url = buildDocumentUrl({ type, mode: 'download', volumeId, linkId: nodeId });
    if (openBehavior === 'tab') {
        getNewWindow(url.toString());
    } else {
        window.location.assign(url);
    }
};

export const downloadPublicDocument = async ({
    uid,
    openBehavior = 'tab',
    type,
    token,
    urlPassword,
}: {
    uid: string;
    openBehavior?: 'tab' | 'redirect';
    type: DocumentType | ProtonDocumentType;
    token: string;
    urlPassword: string;
}) => {
    const { nodeId } = splitNodeUid(uid);
    const url = buildDocumentUrl({ type, mode: 'open-url-download', linkId: nodeId, token, urlPassword });
    if (openBehavior === 'tab') {
        getNewWindow(url.toString());
    } else {
        window.location.assign(url);
    }
};

const convertDocument = async ({ uid, type }: { uid: string; type: DocumentType | ProtonDocumentType }) => {
    const { volumeId, nodeId } = splitNodeUid(uid);
    getNewWindow(buildDocumentUrl({ type, mode: 'convert', volumeId, linkId: nodeId }).toString());
};

export const openDocumentHistory = async ({ uid, type }: { uid: string; type: DocumentType | ProtonDocumentType }) => {
    const { volumeId, nodeId } = splitNodeUid(uid);
    getNewWindow(buildDocumentUrl({ type, mode: 'history', volumeId, linkId: nodeId }).toString());
};

export const openDocsOrSheetsDocument = async ({
    uid,
    type,
    isNative,
    openBehavior = 'tab',
}: {
    uid: string;
    type: ProtonDocumentType;
    isNative: boolean;
    openBehavior?: 'tab' | 'redirect';
}) => {
    if (isNative) {
        await openDocument({ uid, type, openBehavior });
    } else {
        await convertDocument({ uid, type });
    }
};

export const openPublicDocsOrSheetsDocument = async ({
    uid,
    type,
    isNative,
    openBehavior = 'tab',
    token,
    urlPassword,
    customPassword,
}: {
    uid: string;
    type: ProtonDocumentType;
    isNative: boolean;
    openBehavior?: 'tab' | 'redirect';
    token: string;
    urlPassword: string;
    customPassword?: string;
}) => {
    if (isNative) {
        await openPublicDocument({ uid, type, openBehavior, token, urlPassword, customPassword });
    } else {
        await convertDocument({ uid, type });
    }
};
