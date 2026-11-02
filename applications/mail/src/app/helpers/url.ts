import { MAILTO_PROTOCOL_HANDLER_PATH } from '../constants';

export const registerMailToProtocolHandler = () => {
    if ('registerProtocolHandler' in navigator) {
        try {
            navigator.registerProtocolHandler(
                'mailto',
                `${window.location.origin}${MAILTO_PROTOCOL_HANDLER_PATH}`,
                // @ts-expect-error third arg is still recommended (cf. https://developer.mozilla.org/en-US/docs/Web/API/Navigator/registerProtocolHandler)
                'ProtonMail'
            );
        } catch (e: any) {
            console.error(e);
        }
    }
};
