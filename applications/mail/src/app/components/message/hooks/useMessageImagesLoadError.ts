import { useRef } from 'react';

import { useApi } from '@proton/components';

import { useMailDispatch } from 'proton-mail/store/hooks';
import { failedRemoteDirectLoading, loadRemoteProxy } from 'proton-mail/store/messages/images/messagesImagesActions';
import type { MessageImage } from 'proton-mail/store/messages/messagesTypes';

interface Props {
    localID: string;
    useProxy: boolean;
}

const useMessageImagesLoadError = ({ localID, useProxy }: Props) => {
    const dispatch = useMailDispatch();
    const api = useApi();
    const hasLoadedAfterError = useRef({ hasLoadedProxy: false, hasLoadedDirect: false });

    return async (image: MessageImage) => {
        const { type } = image;
        // If the image fails to load from the URL, we have no way to know why it has failed
        // But depending on the error, we want to handle it differently
        // In that case, we try to load the image "the old way", we will have more control on the error
        // Only make this call when user is using proxy.
        // - Without proxy we are already trying to load direct
        // - With EO, we are also already trying to load direct
        // However, if we are trying to load the image without the proxy, we don't want to trigger the load remote onError
        if (type === 'remote' && useProxy && !hasLoadedAfterError.current.hasLoadedProxy) {
            hasLoadedAfterError.current.hasLoadedProxy = true;
            await dispatch(loadRemoteProxy({ ID: localID, imageToLoad: image, api }));
        } else if (type === 'remote' && !hasLoadedAfterError.current.hasLoadedDirect) {
            // Instead, we want to add an error to the image in the state to display a placeholder
            hasLoadedAfterError.current.hasLoadedDirect = true;
            await dispatch(failedRemoteDirectLoading({ ID: localID, image }));
        }
    };
};

export default useMessageImagesLoadError;
