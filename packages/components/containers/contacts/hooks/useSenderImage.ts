import { useEffect, useState } from 'react';

import { FeatureCode } from '@proton/components';
import { useApi, useFeature, useMailSettings } from '@proton/components/hooks';

import { getSenderLogo } from '../helpers/senderImage';

const IMAGE_SIZE = 128;

/**
 * Return the sender image for a given email address
 * @param emailAddress email address to get the sender image for
 * @returns the sender image
 */
const useSenderImage = (emailAddress?: string) => {
    const [mailSettings] = useMailSettings();
    const { feature } = useFeature(FeatureCode.ShowSenderImages);
    const [url, setUrl] = useState('');
    const api = useApi();

    useEffect(() => {
        if (!emailAddress || !feature?.Value || mailSettings?.HideSenderImages) {
            return;
        }

        void getSenderLogo(api, emailAddress, IMAGE_SIZE).then(setUrl);
    }, [mailSettings?.HideSenderImages, feature?.Value, emailAddress]);

    return url;
};

export default useSenderImage;
