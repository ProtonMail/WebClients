import { useRef } from 'react';

import { useTheme } from '@proton/components';
import { useConfig } from '@proton/components/hooks';
import useAuthentication from '@proton/components/hooks/useAuthentication';

import { getImageSize, getSenderImageUrl } from '../helpers/senderImage';

/**
 * Return the sender image URL for a given email address
 * @param emailAddress email address to get the sender image for
 * @param bimiSelector
 * @returns the sender image URL
 */
const useSenderImage = (emailAddress: string, bimiSelector?: string) => {
    const theme = useTheme();
    const imageSizeRef = useRef(getImageSize());
    const mode = theme.information.dark ? 'dark' : 'light';
    const { UID } = useAuthentication();
    const { API_URL } = useConfig();
    return emailAddress ? getSenderImageUrl(API_URL, UID, emailAddress, imageSizeRef.current, bimiSelector, mode) : '';
};

export default useSenderImage;
