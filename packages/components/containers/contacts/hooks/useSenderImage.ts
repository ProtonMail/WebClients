import { useEffect, useRef, useState } from 'react';

import { useIsDarkTheme } from '@proton/components';
import { useApi, useAuthentication, useMailSettings } from '@proton/components/hooks';

import { getImageSize, getSenderImageUrl, getSenderLogo } from '../helpers/senderImage';

/**
 * Return the sender image for a given email address
 * @param emailAddress email address to get the sender image for
 * @returns the sender image
 */
const useSenderImage = (emailAddress: string, fallback: boolean, bimiSelector?: string) => {
    const [mailSettings] = useMailSettings();
    const isDarkTheme = useIsDarkTheme();
    const imageSizeRef = useRef(getImageSize());
    const mode = isDarkTheme ? 'dark' : 'light';
    const api = useApi();
    const { UID } = useAuthentication();
    const [url, setUrl] = useState('');
    const [canLoad, setCanLoad] = useState(false);

    useEffect(() => {
        setCanLoad(!!emailAddress && mailSettings?.HideSenderImages === 0);
    }, [emailAddress, mailSettings?.HideSenderImages]);

    useEffect(() => {
        if (!canLoad) {
            return;
        }

        if (fallback) {
            // Load the image with XHR request and create a blob URL
            void getSenderLogo(api, emailAddress, imageSizeRef.current, bimiSelector, mode).then((fallbackUrl) => {
                // Fallback URL can be empty if the network request fails
                if (fallbackUrl.length) {
                    setUrl(fallbackUrl);
                } else {
                    // In that case, we cannot load an image (and fallback to initials)
                    setCanLoad(false);
                }
            });
            return;
        }

        // Load the image with a simple GET request
        setUrl(getSenderImageUrl(UID, emailAddress, imageSizeRef.current, bimiSelector, mode));
    }, [emailAddress, canLoad, mode, bimiSelector, fallback]);

    return { canLoad, url };
};

export default useSenderImage;
