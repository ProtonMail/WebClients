import { useRef } from 'react';

import useAuthentication from '../../../hooks/useAuthentication';
import useConfig from '../../../hooks/useConfig';
import { useTheme } from '../../themes/ThemeProvider';
import { getImageSize, getSenderImageUrl } from '../helpers/senderImage';

interface Props {
    emailAddress: string;
    bimiSelector?: string;
    overrideSize?: number;
}

/**
 * Return the sender image URL for a given email address
 * @param emailAddress email address to get the sender image for
 * @param bimiSelector
 * @returns the sender image URL
 */
const useSenderImage = ({ emailAddress, bimiSelector, overrideSize }: Props) => {
    const theme = useTheme();
    const imageSizeRef = useRef(getImageSize(overrideSize));
    const mode = theme.information.dark ? 'dark' : 'light';
    const { UID } = useAuthentication();
    const { API_URL } = useConfig();
    return emailAddress
        ? getSenderImageUrl({
              apiUrl: API_URL,
              UID,
              emailAddress,
              size: imageSizeRef.current,
              bimiSelector,
              mode,
          })
        : '';
};

export default useSenderImage;
