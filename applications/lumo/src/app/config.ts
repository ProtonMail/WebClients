import { isTauriApp } from '@proton/shared/lib/helpers/desktop';
import { getProtonConfig } from '@proton/shared/lib/interfaces/config';

const config = getProtonConfig({
    APP_NAME: 'proton-lumo', //needed for persistence.test
    API_URL: '/api',
});

// Sentry releases and source maps must use the web build version, without desktop metadata.
export const WEB_APP_VERSION = config.APP_VERSION;

const injectedDesktopVersion = isTauriApp ? window.lumoDesktopVersion : undefined;
const desktopVersionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

if (typeof injectedDesktopVersion === 'string' && desktopVersionPattern.test(injectedDesktopVersion)) {
    const desktopVersion = injectedDesktopVersion.replace(/\+/g, '.');
    const metadataIndex = config.APP_VERSION.indexOf('+');
    config.APP_VERSION =
        metadataIndex === -1
            ? `${config.APP_VERSION}+${desktopVersion}`
            : `${config.APP_VERSION.slice(0, metadataIndex)}+${desktopVersion}.${config.APP_VERSION.slice(metadataIndex + 1)}`;
}

export default config;
