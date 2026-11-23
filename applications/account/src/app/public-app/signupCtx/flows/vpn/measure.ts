import type { CYCLE, PLANS } from '@proton/payments/core/constants';
import type { Currency } from '@proton/payments/core/interface';
import type { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';

type InteractFields = 'username' | 'email' | 'email_confirm' | 'pwd' | 'pwd_confirm';

type TelemetryBoolean = 'yes' | 'no';
type TelemetryPaymentMethods = {
    btc: TelemetryBoolean;
    paypal: TelemetryBoolean;
    cc: TelemetryBoolean;
};

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

type InteractCreateEvents = {
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
