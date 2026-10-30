import type { PrivateAuthenticationStore } from '@proton/components/containers/app/interface';
import type { LoadRemoteResults, MessageRemoteImage } from '@proton/mail-message/store/messages/messagesTypes';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import uniqueBy from '@proton/utils/uniqueBy';

import { loadFakeProxy, loadRemoteDirectFromURL, loadRemoteProxyFromURL } from './messagesImagesActions';

export const handleDispatchLoadImagesProxy = (
    ID: string,
    imagesToLoad: MessageRemoteImage[],
    authentication: PrivateAuthenticationStore,
    dispatch: (action: any) => void
) => {
    const dispatchResult = dispatch(loadRemoteProxyFromURL({ ID, imagesToLoad, uid: authentication.getUID() }));
    return dispatchResult as any as Promise<LoadRemoteResults[]>;
};

export const handleDispatchLoadFakeImagesProxy = (
    ID: string,
    imagesToLoad: MessageRemoteImage[],
    api: Api,
    dispatch: (action: any) => void,
    firstLoad?: boolean
) => {
    // Make one call per image, it's possible that several images in the message have the same URL.
    const uniqueImages = uniqueBy(imagesToLoad, (image) => image.url);
    const dispatchResult = dispatch(loadFakeProxy({ ID, imagesToLoad: uniqueImages, api, firstLoad }));
    return dispatchResult as any as Promise<LoadRemoteResults[]>;
};

export const handleDispatchLoadRemoteImagesDirect = (
    ID: string,
    imagesToLoad: MessageRemoteImage[],
    dispatch: (action: any) => void
) => {
    const dispatchResult = dispatch(loadRemoteDirectFromURL({ ID, imagesToLoad }));
    return dispatchResult as any as Promise<LoadRemoteResults[]>;
};
