import { Clients } from '@proton/pass/constants';
import { type CYCLE, PLANS } from '@proton/payments/core/constants';
import type { Currency, PaymentStatus } from '@proton/payments/core/interface';
import { hasPlanIDs } from '@proton/payments/core/planIDs';
import { getPlan } from '@proton/payments/core/subscription/helpers';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { getPlanFromPlanIDs } from '@proton/shared/lib/payments/plan/helpers';
import type { PlansMap } from '@proton/shared/lib/payments/plan/interface';

import type { SessionData, SubscriptionData } from '../signup/interfaces';

type InteractFields = 'username' | 'email' | 'email_confirm' | 'pwd' | 'pwd_confirm';

type TelemetryBoolean = 'yes' | 'no';
type TelemetryPaymentMethods = {
    btc: TelemetryBoolean;
    paypal: TelemetryBoolean;
    cc: TelemetryBoolean;
};

export type TelemetryExtensionPlatform = 'ios' | 'ff' | 'android' | 'chrome' | 'safari' | 'edge' | 'brave' | 'unknown';

type TelemetryGetExtension = `get_${TelemetryExtensionPlatform}`;
export type TelemetryDownloadExtension = `download_${TelemetryExtensionPlatform}`;

type SignupFinishEvents = {
    event: TelemetryAccountSignupEvents.signupFinish;
    dimensions: {
        plan: PLANS;
        cycle: `${CYCLE}`;
        currency: Currency;
    };
    values: {
        amount_charged: number;
    };
};

type AvailableExternalEvents = {
    event: TelemetryAccountSignupEvents.beAvailableExternal;
    dimensions: {
        available: TelemetryBoolean;
    };
};

type InteractCreateEvents = {
    event: TelemetryAccountSignupEvents.interactAccountCreate;
    dimensions: {
        field: InteractFields;
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

export const getPlanNameFromSession = (session: SessionData): PLANS => {
    return getPlan(session.subscription)?.Name || session.organization?.PlanName || PLANS.FREE;
};

export const getPaymentMethodsAvailable = (
    paymentMethodsAvailable: PaymentStatus['VendorStates']
): TelemetryPaymentMethods => {
    return {
        btc: paymentMethodsAvailable.Bitcoin ? 'yes' : 'no',
        paypal: paymentMethodsAvailable.Paypal ? 'yes' : 'no',
        cc: paymentMethodsAvailable.Card ? 'yes' : 'no',
    };
};

export const getSignupTelemetryData = (plansMap: PlansMap, subscriptionData: SubscriptionData): SignupFinishEvents => {
    const plan = getPlanFromPlanIDs(plansMap, subscriptionData.planIDs)?.Name as PLANS | undefined;

    if (!plan || !hasPlanIDs(subscriptionData.planIDs)) {
        return {
            event: TelemetryAccountSignupEvents.signupFinish,
            dimensions: {
                plan: PLANS.FREE,
                cycle: `${subscriptionData.cycle}`,
                currency: subscriptionData.currency,
            },
            values: {
                amount_charged: 0,
            },
        };
    }

    return {
        event: TelemetryAccountSignupEvents.signupFinish,
        dimensions: {
            plan,
            cycle: `${subscriptionData.cycle}`,
            currency: subscriptionData.currency,
        },
        values: {
            amount_charged: subscriptionData.checkResult.AmountDue,
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
