import { splitNodeUid } from '@proton/drive';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import type { OpenInDocsType, ProtonDocumentType } from '@proton/shared/lib/helpers/mimetype';
import { mimeTypeToOpenInDocsType } from '@proton/shared/lib/helpers/mimetype';
import { getCurrentTab, getNewWindow } from '@proton/shared/lib/helpers/window';

import type { DocumentType, RedirectAction } from '../../hooks/docs/useOpenDocument';
import { tmpConvertNewDocTypeToOld } from '../../hooks/docs/useOpenDocument';
import { extraThunkArguments } from '../../redux-store/thunk';
import { unleashVanillaStore } from '../../zustand/unleash/unleash.store';

export const getOpenInDocsInfo = (mediaType: string): OpenInDocsType | undefined => {
    const isODSImportEnabled = unleashVanillaStore.getState().isEnabled('SheetsODSImportEnabled');
    const isSheetsDisabled = unleashVanillaStore.getState().isEnabled('DocsSheetsDisabled');
    const isDocsDisabled = unleashVanillaStore.getState().isEnabled('DriveDocsDisabled');

    const openInDocsType = mimeTypeToOpenInDocsType(mediaType, isODSImportEnabled);

    if (
        !openInDocsType ||
        (openInDocsType.type === 'document' && isDocsDisabled) ||
        (openInDocsType.type === 'spreadsheet' && isSheetsDisabled)
    ) {
        return undefined;
    }

    return openInDocsType;
};

type OpenDocumentWindowParams = {
    type: DocumentType | ProtonDocumentType;
    windowHandle: Window;
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

const openDocumentWindow = (params: OpenDocumentWindowParams) => {
    const { type: originalType, mode, windowHandle } = params;
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

    windowHandle.location.assign(url);
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
    const w = openBehavior === 'tab' ? getNewWindow() : getCurrentTab();
    const { volumeId, nodeId } = splitNodeUid(uid);
    try {
        openDocumentWindow({
            type,
            mode: 'open',
            windowHandle: w.handle,
            volumeId,
            linkId: nodeId,
        });
    } catch (e) {
        w.close();
        throw e;
    }
};

const openPublicDocument = async ({
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
    const w = openBehavior === 'tab' ? getNewWindow() : getCurrentTab();
    const { nodeId } = splitNodeUid(uid);
    try {
        openDocumentWindow({
            type,
            mode: 'open-url',
            windowHandle: w.handle,
            linkId: nodeId,
            token,
            urlPassword,
        });
    } catch (e) {
        w.close();
        throw e;
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
    const w = openBehavior === 'tab' ? getNewWindow() : getCurrentTab();
    const { volumeId, nodeId } = splitNodeUid(uid);
    try {
        openDocumentWindow({
            type,
            mode: 'download',
            windowHandle: w.handle,
            volumeId,
            linkId: nodeId,
        });
    } catch (e) {
        w.close();
        throw e;
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
    const w = openBehavior === 'tab' ? getNewWindow() : getCurrentTab();
    const { nodeId } = splitNodeUid(uid);
    try {
        openDocumentWindow({
            type,
            mode: 'open-url-download',
            windowHandle: w.handle,
            linkId: nodeId,
            token,
            urlPassword,
        });
    } catch (e) {
        w.close();
        throw e;
    }
};

const convertDocument = async ({ uid, type }: { uid: string; type: DocumentType | ProtonDocumentType }) => {
    const w = getNewWindow();
    const { volumeId, nodeId } = splitNodeUid(uid);

    try {
        openDocumentWindow({
            type,
            mode: 'convert',
            windowHandle: w.handle,
            volumeId,
            linkId: nodeId,
        });
    } catch (e) {
        w.close();
        throw e;
    }
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
}: {
    uid: string;
    type: ProtonDocumentType;
    isNative: boolean;
    openBehavior?: 'tab' | 'redirect';
    token: string;
    urlPassword: string;
}) => {
    if (isNative) {
        await openPublicDocument({ uid, type, openBehavior, token, urlPassword });
    } else {
        await convertDocument({ uid, type });
    }
};
