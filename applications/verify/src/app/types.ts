import { HumanVerificationMethodType } from '@proton/shared/lib/interfaces';

export interface VerificationSearchParameters {
    /*
     * Human verification start token
     */
    token?: string;
    /*
     * Available human verification methods
     * captcha | payment | sms | email | invite | coupon
     */
    methods?: HumanVerificationMethodType[];
    /*
     * Force embed in case the checks fail to detect it for some reason
     */
    embed?: boolean;
    /* Which language to display the app in */
    locale?: string;
    /* Default country, used in defaulting the phone number for example */
    defaultCountry?: string;
    /* Default email value, used in email input display */
    defaultEmail?: string;
    /* Default phone number, used in the phone input display */
    defaultPhone?: string;
    /* Whether the embedder requires the verify app to display in vpn-branding mode */
    vpn?: boolean;
}
