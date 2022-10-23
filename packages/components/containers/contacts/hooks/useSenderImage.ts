import { useEffect, useRef, useState } from 'react';

import { FeatureCode, useIsDarkTheme } from '@proton/components';
import { useApi, useFeature, useMailSettings } from '@proton/components/hooks';

import { getSenderLogo } from '../helpers/senderImage';

const getImageSize = () => {
    if (window.devicePixelRatio >= 4) {
        return 128;
    }

    if (window.devicePixelRatio > 1) {
        return 64;
    }

    return 32;
};

/**
 * Return the sender image for a given email address
 * @param emailAddress email address to get the sender image for
 * @returns the sender image
 */
const useSenderImage = (emailAddress?: string, bimiSelector?: string) => {
    const [mailSettings] = useMailSettings();
    const isDarkTheme = useIsDarkTheme();
    const { feature } = useFeature(FeatureCode.ShowSenderImages);
    const [url, setUrl] = useState('');
    const imageSizeRef = useRef(getImageSize());
    const api = useApi();
    const mode = isDarkTheme ? 'dark' : 'light';

    useEffect(() => {
        if (!emailAddress || !feature?.Value || mailSettings?.HideSenderImages) {
            return;
        }

        void getSenderLogo(api, emailAddress, imageSizeRef.current, bimiSelector, mode).then(setUrl);
    }, [mailSettings?.HideSenderImages, feature?.Value, emailAddress, bimiSelector, mode]);

    return url;
};

export default useSenderImage;
