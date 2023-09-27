import browser from '@proton/pass/globals/browser';

export const getExtensionVersion = () => browser.runtime.getManifest().version;
