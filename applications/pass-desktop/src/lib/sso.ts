import { type OnHeadersReceivedListenerDetails } from 'electron';
import logger from 'electron-log/main';

import * as config from '../app/config';

// Fix SSO callback URL
export const fixSSOUrl = ({ responseHeaders, url }: OnHeadersReceivedListenerDetails) => {
    if (!responseHeaders || !url.endsWith('/auth/saml')) return;

    const location = (responseHeaders.Location || responseHeaders.location)?.[0];

    if (location && !location.startsWith(config.SSO_URL)) {
        delete responseHeaders.location;
        delete responseHeaders.Location;
        const url = new URL(location);
        const newLocation = `${config.SSO_URL}${url.pathname}${url.search}${url.hash}`;
        responseHeaders.location = [newLocation];
        logger.debug(`[onHeadersReceived] rewriting SSO callback URL from '${location}' to '${newLocation}'`);
    }
};
