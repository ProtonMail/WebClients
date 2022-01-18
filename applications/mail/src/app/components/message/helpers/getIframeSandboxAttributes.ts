import { isSafari } from '@proton/shared/lib/helpers/browser';

const getIframeSandboxAttributes = (isPrint: boolean) => {
    /**
     * "allow-modals" : For being able to print emails
     *
     * "allow-scripts" : allows react portals to execute correctly in Safari
     *
     * "allow-popups-to-escape-sandbox" allows to open links in non modal sandboxed mode
     */
    const sandboxAttributes: string = [
        'allow-same-origin',
        'allow-popups',
        'allow-popups-to-escape-sandbox',
        ...(isPrint ? ['allow-modals'] : []),
        ...(isSafari() ? ['allow-scripts'] : []),
    ].join(' ');

    return sandboxAttributes;
};

export default getIframeSandboxAttributes;
