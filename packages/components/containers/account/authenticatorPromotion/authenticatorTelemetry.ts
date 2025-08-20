import { telemetry } from '@proton/shared/lib/telemetry';

export const sendAuthenticatorPromoLoad = () => {
    telemetry.sendCustomEvent(
        /**
         * Event type version should be updated when the data structure changes
         */
        'authenticator_promo_2fa_page_load_v1'
    );
};

export const sendAuthenticatorPromoBannerClick = () => {
    telemetry.sendCustomEvent(
        /**
         * Event type version should be updated when the data structure changes
         */
        'authenticator_promo_banner_2fa_page_click_v1'
    );
};

export const sendAuthenticatorPromoModalClick = () => {
    telemetry.sendCustomEvent(
        /**
         * Event type version should be updated when the data structure changes
         */
        'authenticator_promo_modal_2fa_page_click_v1'
    );
};
