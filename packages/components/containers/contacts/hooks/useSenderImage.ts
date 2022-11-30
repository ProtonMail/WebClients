import { useEffect, useMemo, useRef, useState } from 'react';

import { FeatureCode, useIsDarkTheme } from '@proton/components';
import { useApi, useAuthentication, useFeature, useMailSettings } from '@proton/components/hooks';

import { getImageSize, getSenderImageUrl, getSenderLogo } from '../helpers/senderImage';

/**
 * Return the sender image for a given email address
 * @param emailAddress email address to get the sender image for
 * @returns the sender image
 */
const useSenderImage = (emailAddress: string, fallback: boolean, bimiSelector?: string) => {
    const [mailSettings] = useMailSettings();
    const isDarkTheme = useIsDarkTheme();
    const { feature } = useFeature(FeatureCode.ShowSenderImages);
    const imageSizeRef = useRef(getImageSize());
    const mode = isDarkTheme ? 'dark' : 'light';
    const api = useApi();
    const { UID } = useAuthentication();
    const [url, setUrl] = useState('');
    const canLoad = useMemo(
        () => emailAddress && mailSettings?.HideSenderImages === 0 && feature?.Value,
        [emailAddress, mailSettings?.HideSenderImages, feature?.Value]
    );

    useEffect(() => {
        if (!canLoad) {
            return;
        }

        if (fallback) {
            void getSenderLogo(api, emailAddress, imageSizeRef.current, bimiSelector, mode).then(setUrl);
            return;
        }

        setUrl(getSenderImageUrl(UID, emailAddress, imageSizeRef.current, bimiSelector, mode));
    }, [emailAddress, canLoad, mode, bimiSelector, fallback]);

    return { canLoad, url };
};

export default useSenderImage;
