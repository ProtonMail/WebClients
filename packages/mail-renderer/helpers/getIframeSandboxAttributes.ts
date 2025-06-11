import { isDuckDuckGo, isSafari } from '@proton/shared/lib/helpers/browser';

const getIframeSandboxAttributes = (isPrint: boolean) => {
    const sandboxAttributes: string = [
        /**
         * Because iframe origin is set to protonmail.com we need
         * to be able to access it's origin
         */
        'allow-same-origin',
        /**
         * allows target="_blank" links to work
         */
        'allow-popups',
        /**
         * Allows to open links in non sandboxed mode
         * for ex : if allow-scripts is not present opened links are allowed to execute scripts
         */
        'allow-popups-to-escape-sandbox',
        /**
         * Modals are a requirement when printing
         */
        ...(isPrint ? ['allow-modals'] : []),
        /**
         * Allows react portals to execute correctly in Safari
         * WebKit is smart enought to allow parent script execution over
         * sandboxed child frames with the same origin.
         * This works, even though an error is shown in the console. It allows us
         * to benefit from an extra protection about potential child frame to
         * parent frame script execution
         * It is not reported in Sentry and does not impede image loading.
         * If this becomes a problem in the future we should consider `allow-scripts`
         * on all engines
         */
        ...(isSafari() || isDuckDuckGo() ? ['allow-scripts'] : []),
    ].join(' ');

    /**
     * The following options do not currently need to be allowed
     * - allow-forms
     * - allow-pointer-lock
     * - allow-top-navigation
     */
    return sandboxAttributes;
};

export default getIframeSandboxAttributes;
