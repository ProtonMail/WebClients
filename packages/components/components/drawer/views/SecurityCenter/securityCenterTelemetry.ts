import { TelemetryMeasurementGroups, TelemetrySecurityCenterEvents } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { Api } from '@proton/shared/lib/interfaces';

type Options =
    | {
          event: TelemetrySecurityCenterEvents.proton_pass_discover_banner;
          dimensions: {
              action: 'visit' | 'dismiss';
          };
      }
    | {
          event: TelemetrySecurityCenterEvents.proton_pass_create_alias;
          dimensions: {
              first_alias: 'yes' | 'no';
          };
      }
    | {
          event: TelemetrySecurityCenterEvents.proton_sentinel_toggle;
          dimensions: {
              action: 'enable' | 'disable';
          };
      }
    | {
          event: TelemetrySecurityCenterEvents.account_security_card;
          dimensions: {
              card: 'account_recovery' | 'data_recovery' | 'two_factor_authentication';
              action: 'clicked' | 'dismissed';
          };
      };

export const sendSecurityCenterReport = async (api: Api, options: Options) => {
    await sendTelemetryReport({
        api,
        measurementGroup: TelemetryMeasurementGroups.securityCenter,
        event: options.event,
        silence: true,
        ...('dimensions' in options ? { dimensions: options.dimensions } : {}),
    });
};
