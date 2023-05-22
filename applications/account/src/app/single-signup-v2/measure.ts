import { PAYMENT_METHOD_TYPES, PaymentMethodStatus } from '@proton/components/payments/core';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { CYCLE, PLANS } from '@proton/shared/lib/constants';
import { hasPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { getPlan } from '@proton/shared/lib/helpers/subscription';
import { Currency, Plan } from '@proton/shared/lib/interfaces';
import { Clients } from '@proton/shared/lib/pass/constants';

import { getPlanFromPlanIDs } from '../signup/helper';
import { SessionData, SignupCacheResult } from '../signup/interfaces';

export type InteractFields = 'email' | 'email_confirm' | 'pwd' | 'pwd_confirm';

type TelemetryPaymentMethods = {
    BTC: 'true' | 'false';
    Paypal: 'true' | 'false';
    CC: 'true' | 'false';
};

export type TelemetryPayType = 'pay_cc' | 'pay_pp' | 'pay_pp_no_cc' | 'pay_btc';

export type TelemetryExtensionPlatform = 'ios' | 'ff' | 'android' | 'chrome' | 'safari' | 'edge' | 'brave' | 'unknown';

export type TelemetryGetExtension = `get_${TelemetryExtensionPlatform}`;
export type TelemetryDownloadExtension = `download_${TelemetryExtensionPlatform}`;

export type SignupFinishEvents =
    | {
          event: TelemetryAccountSignupEvents.signupFinish;
          dimensions: {
              type: 'free';
              plan: 'free';
          };
      }
    | {
          event: TelemetryAccountSignupEvents.signupFinish;
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
          dimensions:
              | {
                    signedin: 'yes';
                    intent: string | undefined;
                    plan: PLANS;
                }
              | {
                    signedin: 'no';
                    intent: string | undefined;
                };
      }
    | {
          event: TelemetryAccountSignupEvents.selectPlan;
          dimensions: {
              plan_name: PLANS;
          };
      }
    | {
          event: TelemetryAccountSignupEvents.selectCurrency;
          dimensions: {
              currency: Currency;
          };
      }
    | {
          event: TelemetryAccountSignupEvents.selectCycle;
          dimensions: {
              cycle: `${CYCLE}`;
          };
      }
    | {
          event: TelemetryAccountSignupEvents.beAvailableExternal;
          dimensions: {
              availableExternal: 'true' | 'false';
          };
      }
    | {
          event: TelemetryAccountSignupEvents.interactAccountCreate;
          dimensions: {
              field: InteractFields;
          };
      }
    | {
          event: TelemetryAccountSignupEvents.userCheckout;
          dimensions: {
              type: 'free';
          };
      }
    | {
          event: TelemetryAccountSignupEvents.userSignIn;
          dimensions: {
              location: 'step2' | 'error_msg';
          };
      }
    | {
          event: TelemetryAccountSignupEvents.userSignInSuccess;
          dimensions: {
              current_plan: PLANS;
          };
      }
    | {
          event: TelemetryAccountSignupEvents.bePaymentMethods;
          dimensions: TelemetryPaymentMethods;
      }
    | {
          event: TelemetryAccountSignupEvents.paymentSelect;
          dimensions: {
              action: 'open' | 'select_cc' | 'select_pp' | 'select_btc';
          };
      }
    | {
          event: TelemetryAccountSignupEvents.interactCreditCard;
          dimensions: {
              field: 'cc-number' | 'cc-exp' | 'cc-csc' | 'country' | 'postal-code';
          };
      }
    | {
          event: TelemetryAccountSignupEvents.userCheckout | TelemetryAccountSignupEvents.checkoutError;
          dimensions: {
              type: TelemetryPayType;
              plan: PLANS;
              cycle: `${CYCLE}`;
              currency: Currency;
          };
      }
    | {
          event: TelemetryAccountSignupEvents.loadPaymentBtc;
          dimensions: {};
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
    if (method === PAYMENT_METHOD_TYPES.CARD) {
        return 'select_cc';
    }
    if (method === PAYMENT_METHOD_TYPES.PAYPAL || method === PAYMENT_METHOD_TYPES.PAYPAL_CREDIT) {
        return 'select_pp';
    }
    if (method === PAYMENT_METHOD_TYPES.BITCOIN) {
        return 'select_btc';
    }
};

export const getPaymentMethodType = (method: PAYMENT_METHOD_TYPES | undefined): TelemetryPayType | undefined => {
    if (method === PAYMENT_METHOD_TYPES.CARD) {
        return 'pay_cc';
    }
    if (method === PAYMENT_METHOD_TYPES.PAYPAL) {
        return 'pay_pp';
    }
    if (method === PAYMENT_METHOD_TYPES.PAYPAL_CREDIT) {
        return 'pay_pp_no_cc';
    }
    if (method === PAYMENT_METHOD_TYPES.BITCOIN) {
        return 'pay_btc';
    }
};

export const getPlanNameFromSession = (session: SessionData): PLANS => {
    return getPlan(session.subscription)?.Name || session.organization?.PlanName || PLANS.FREE;
};

export const getPaymentMethodsAvailable = (paymentMethodsAvailable: PaymentMethodStatus): TelemetryPaymentMethods => {
    return {
        BTC: paymentMethodsAvailable.Bitcoin ? 'true' : 'false',
        Paypal: paymentMethodsAvailable.Paypal ? 'true' : 'false',
        CC: paymentMethodsAvailable.Card ? 'true' : 'false',
    };
};

export const getSignupTelemetryData = (plans: Plan[], cache: SignupCacheResult): SignupFinishEvents => {
    const plan = getPlanFromPlanIDs(plans, cache.subscriptionData.planIDs)?.Name as PLANS | undefined;

    if (!plan || !hasPlanIDs(cache.subscriptionData.planIDs)) {
        return {
            event: TelemetryAccountSignupEvents.signupFinish,
            dimensions: {
                type: 'free',
                plan: 'free',
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
