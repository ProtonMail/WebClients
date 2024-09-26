import { isDuckDuckGo, isSafari } from '@proton/shared/lib/helpers/browser';

const getIframeSandboxAttributes = (isPrint: boolean) => {
    /**
     * "allow-same-origin"
     *      Because iframe origin is set to protonmail.com we need
     *      to be able to access it's origin
     * "allow-modals"
     *      Allow to be able to print emails
     * "allow-scripts"
     *      allows react portals to execute correctly in Safari
     * "allow-popups"
     *      allows target="_blank" links to work
     * "allow-popups-to-escape-sandbox"
     *      allows to open links in non sandboxed mode
     *      for ex : if allow-scripts is not present opened links are allowed to execute scripts
     *
     * ATM we do not need to allow the following options
     * - allow-forms
     * - allow-pointer-lock
     * - allow-top-navigation
     */
    const sandboxAttributes: string = [
        'allow-same-origin',
        'allow-popups',
        'allow-popups-to-escape-sandbox',
        ...(isPrint ? ['allow-modals'] : []),
        ...(isSafari() || isDuckDuckGo() ? ['allow-scripts'] : []),
    ].join(' ');

    return sandboxAttributes;
};

export default getIframeSandboxAttributes;
