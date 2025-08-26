import { telemetry } from '@proton/shared/lib/telemetry';

export type AuthenticatorPromoFlowId = '2fa-settings';

export const sendAuthenticatorPromoLoad = ({ flowId }: { flowId: AuthenticatorPromoFlowId }) => {
    telemetry.sendCustomEvent(
        /**
         * Event type version should be updated when the data structure changes
         */
        'authenticator_promo_load_v1',
        {
            flowId,
        }
    );
};

export const sendAuthenticatorPromoBannerClick = ({ flowId }: { flowId: AuthenticatorPromoFlowId }) => {
    telemetry.sendCustomEvent(
        /**
         * Event type version should be updated when the data structure changes
         */
        'authenticator_promo_banner_click_v1',
        {
            flowId,
        }
    );
};

export const sendAuthenticatorPromoModalClick = ({ flowId }: { flowId: AuthenticatorPromoFlowId }) => {
    telemetry.sendCustomEvent(
        /**
         * Event type version should be updated when the data structure changes
         */
        'authenticator_promo_modal_click_v1',
        {
            flowId,
        }
    );
};
