import { type CYCLE, type PLANS } from '@proton/payments';
import { type Currency } from '@proton/payments';
import type { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';

export type InteractFields = 'username' | 'email' | 'email_confirm' | 'pwd' | 'pwd_confirm';

type TelemetryBoolean = 'yes' | 'no';
type TelemetryPaymentMethods = {
    btc: TelemetryBoolean;
    paypal: TelemetryBoolean;
    cc: TelemetryBoolean;
};

export type TelemetryPayType = 'free' | 'pay_cc' | 'pay_pp' | 'pay_pp_no_cc' | 'pay_btc';

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

export type InteractCreateEvents = {
    event: TelemetryAccountSignupEvents.interactAccountCreate;
    dimensions: {
        field: InteractFields;
    };
};

export type TelemetryMeasurementData =
    | {
          event: TelemetryAccountSignupEvents.pageLoad;
          dimensions: {};
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
    | {
          event: TelemetryAccountSignupEvents.beAvailableExternal;
          dimensions: {
              available: TelemetryBoolean;
          };
      }
    | InteractCreateEvents
    | {
          event: TelemetryAccountSignupEvents.userSignIn;
          dimensions: {
              location: 'step2' | 'error_msg';
          };
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
    | {
          event: TelemetryAccountSignupEvents.userCheckout | TelemetryAccountSignupEvents.checkoutError;
          dimensions: {
              type: TelemetryPayType;
              plan: PLANS;
              cycle: `${CYCLE}`;
              currency: Currency;
          };
      }
    | SignupFinishEvents
    | {
          event: TelemetryAccountSignupEvents.interactUpsell;
          dimensions: {
              upsell_from: string;
              upsell_to: string;
          };
      }
    | {
          event: TelemetryAccountSignupEvents.onboardingStart;
          dimensions: {};
      }
    | {
          event: TelemetryAccountSignupEvents.interactPassword;
          dimensions: {
              click: 'copy' | 'continue_custom' | 'continue_suggested' | 'set_custom';
          };
      }
    | {
          event: TelemetryAccountSignupEvents.onboardFinish;
          dimensions: {};
      };
