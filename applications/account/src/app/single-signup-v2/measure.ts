import type { PaymentMethodStatus } from '@proton/payments';
import { PAYMENT_METHOD_TYPES } from '@proton/payments';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import type { CYCLE } from '@proton/shared/lib/constants';
import { PLANS } from '@proton/shared/lib/constants';
import { getPlanFromPlanIDs, hasPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { getPlan } from '@proton/shared/lib/helpers/subscription';
import type { Currency, PlansMap } from '@proton/shared/lib/interfaces';
import { Clients } from '@proton/shared/lib/pass/constants';

import type { SessionData, SignupCacheResult } from '../signup/interfaces';

export type InteractFields = 'username' | 'email' | 'email_confirm' | 'pwd' | 'pwd_confirm';

type TelemetryBoolean = 'yes' | 'no';
type TelemetryPaymentMethods = {
    btc: TelemetryBoolean;
    paypal: TelemetryBoolean;
    cc: TelemetryBoolean;
};

export type TelemetryPayType = 'free' | 'pay_cc' | 'pay_pp' | 'pay_pp_no_cc' | 'pay_btc';

export type TelemetryExtensionPlatform = 'ios' | 'ff' | 'android' | 'chrome' | 'safari' | 'edge' | 'brave' | 'unknown';

export type TelemetryGetExtension = `get_${TelemetryExtensionPlatform}`;
export type TelemetryDownloadExtension = `download_${TelemetryExtensionPlatform}`;

export type SignupFinishEvents = {
    event: TelemetryAccountSignupEvents.signupFinish;
    dimensions: {
        type: TelemetryPayType;
        plan: PLANS;
        cycle: `${CYCLE}`;
        currency: Currency;
    };
    values: {
        amount_charged: number;
    };
};

export type AvailableExternalEvents = {
    event: TelemetryAccountSignupEvents.beAvailableExternal;
    dimensions: {
        available: TelemetryBoolean;
    };
};

export type InteractCreateEvents = {
    event: TelemetryAccountSignupEvents.interactAccountCreate;
    dimensions: {
        field: InteractFields;
    };
};

export type UserCheckoutEvents = {
    event: TelemetryAccountSignupEvents.userCheckout | TelemetryAccountSignupEvents.checkoutError;
    dimensions: {
        type: TelemetryPayType;
        plan: PLANS;
        cycle: `${CYCLE}`;
        currency: Currency;
    };
};

export type TelemetryMeasurementData =
    | {
          event: TelemetryAccountSignupEvents.pageLoad;
          dimensions: {
              signedin: TelemetryBoolean;
              intent: string | undefined;
              plan: PLANS;
          };
      }
    | {
          event: TelemetryAccountSignupEvents.planSelect;
          dimensions: {
              plan: PLANS;
          };
      }
    | {
          event: TelemetryAccountSignupEvents.currencySelect;
          dimensions: {
              currency: Currency;
          };
      }
    | {
          event: TelemetryAccountSignupEvents.cycleSelect;
          dimensions: {
              cycle: `${CYCLE}`;
          };
      }
    | AvailableExternalEvents
    | InteractCreateEvents
    | {
          event: TelemetryAccountSignupEvents.userSignIn;
          dimensions: {
              location: 'step2' | 'error_msg';
          };
      }
    | {
          event: TelemetryAccountSignupEvents.beSignInSuccess;
          dimensions: {
              plan: PLANS;
          };
      }
    | {
          event: TelemetryAccountSignupEvents.beSignOutSuccess;
          dimensions: {};
      }
    | {
          event: TelemetryAccountSignupEvents.bePaymentMethods;
          dimensions: TelemetryPaymentMethods;
      }
    | {
          event: TelemetryAccountSignupEvents.paymentSelect;
          dimensions: {
              type: 'open' | 'select_cc' | 'select_pp' | 'select_btc';
          };
      }
    | {
          event: TelemetryAccountSignupEvents.interactCreditCard;
          dimensions: {
              field: 'cc-number' | 'cc-exp' | 'cc-csc' | 'country' | 'postal-code';
          };
      }
    | UserCheckoutEvents
    | {
          event: TelemetryAccountSignupEvents.loadPaymentBtc;
          dimensions: {};
      }
    | {
          event: TelemetryAccountSignupEvents.hvNeeded;
          dimensions: {
              api_call: string;
          };
      }
    | SignupFinishEvents
    | {
          event: TelemetryAccountSignupEvents.onboardingStart;
          dimensions: {};
      }
    | {
          event: TelemetryAccountSignupEvents.interactRecoveryKit;
          dimensions: {
              click: 'recovery_download' | 'recovery_download_again' | 'recovery_continue';
          };
      }
    | {
          event: TelemetryAccountSignupEvents.onboardShown;
          dimensions: {
              action_shown: TelemetryGetExtension | 'extension_installed';
          };
      }
    | {
          event: TelemetryAccountSignupEvents.interactDownload;
          dimensions: {
              click: TelemetryDownloadExtension;
          };
      }
    | {
          event: TelemetryAccountSignupEvents.onboardFinish;
          dimensions: {};
      };

export const getPaymentMethod = (method: string) => {
    if (method === PAYMENT_METHOD_TYPES.CARD || method === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD) {
        return 'select_cc';
    }
    if (
        method === PAYMENT_METHOD_TYPES.PAYPAL ||
        method === PAYMENT_METHOD_TYPES.PAYPAL_CREDIT ||
        PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL
    ) {
        return 'select_pp';
    }
    if (method === PAYMENT_METHOD_TYPES.BITCOIN || method === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN) {
        return 'select_btc';
    }
};

export const getPaymentMethodType = (method: PAYMENT_METHOD_TYPES | undefined): TelemetryPayType | undefined => {
    if (method === PAYMENT_METHOD_TYPES.CARD || method === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD) {
        return 'pay_cc';
    }
    if (method === PAYMENT_METHOD_TYPES.PAYPAL || method === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL) {
        return 'pay_pp';
    }
    if (method === PAYMENT_METHOD_TYPES.PAYPAL_CREDIT) {
        return 'pay_pp_no_cc';
    }
    if (method === PAYMENT_METHOD_TYPES.BITCOIN || method === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN) {
        return 'pay_btc';
    }
};

export const getPlanNameFromSession = (session: SessionData): PLANS => {
    return getPlan(session.subscription)?.Name || session.organization?.PlanName || PLANS.FREE;
};

export const getPaymentMethodsAvailable = (paymentMethodsAvailable: PaymentMethodStatus): TelemetryPaymentMethods => {
    return {
        btc: paymentMethodsAvailable.Bitcoin ? 'yes' : 'no',
        paypal: paymentMethodsAvailable.Paypal ? 'yes' : 'no',
        cc: paymentMethodsAvailable.Card ? 'yes' : 'no',
    };
};

export const getSignupTelemetryData = (plansMap: PlansMap, cache: SignupCacheResult): SignupFinishEvents => {
    const plan = getPlanFromPlanIDs(plansMap, cache.subscriptionData.planIDs)?.Name as PLANS | undefined;

    if (!plan || !hasPlanIDs(cache.subscriptionData.planIDs)) {
        return {
            event: TelemetryAccountSignupEvents.signupFinish,
            dimensions: {
                type: 'free',
                plan: PLANS.FREE,
                cycle: `${cache.subscriptionData.cycle}`,
                currency: cache.subscriptionData.currency,
            },
            values: {
                amount_charged: 0,
            },
        };
    }

    const type = getPaymentMethodType(cache.subscriptionData.payment?.Type);
    return {
        event: TelemetryAccountSignupEvents.signupFinish,
        dimensions: {
            type: type || 'pay_cc',
            plan,
            cycle: `${cache.subscriptionData.cycle}`,
            currency: cache.subscriptionData.currency,
        },
        values: {
            amount_charged: cache.subscriptionData.checkResult.AmountDue,
        },
    };
};

export const getTelemetryClientType = (clientType: 'safari' | Clients) => {
    if (clientType === 'safari') {
        return 'safari';
    }
    if (clientType === Clients.iOS) {
        return 'ios';
    }
    if (clientType === Clients.Android) {
        return 'android';
    }
    if (clientType === Clients.Chrome) {
        return 'chrome';
    }
    if (clientType === Clients.Brave) {
        return 'brave';
    }
    if (clientType === Clients.Firefox) {
        return 'ff';
    }
    return 'unknown';
};
