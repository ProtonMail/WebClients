import { OneTimeCodeSource } from '@proton/mail-message/helpers/message/otp/OneTimeCodeDetector';
import { OtpGateSource } from '@proton/mail-message/helpers/message/otp/shouldRunOtpExtraction';
import { TelemetryMailOneTimeCodeEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { defineEvent } from '@proton/telemetry-tracker/lib/defineEvent';
import { allowed, bool } from '@proton/telemetry-tracker/lib/dimensions';

export enum OneTimeCodeLocation {
    LIST = 'list',
    MESSAGE = 'message',
}

export enum OneTimeCodeSetting {
    DETECTION = 'detection',
    MOVE_TO_TRASH = 'move_to_trash',
}

export const ABSENT_CODE_SOURCE = 'n/a';

/**
 * The `mail.web.one_time_code` events, declared in `definitions/mail/one_time_code.yaml` in the
 * telemetry repo. Enum values are the wire strings. No code, sender, subject or email ID is sent.
 */
const baseEvent = {
    target: 'telemetry',
    group: TelemetryMeasurementGroups.mailOneTimeCode,
    delay: false,
} as const;

const location = allowed(Object.values(OneTimeCodeLocation));
const gateSource = allowed(Object.values(OtpGateSource));

export const codeFoundEvent = defineEvent({
    ...baseEvent,
    event: TelemetryMailOneTimeCodeEvents.code_found,
    dimensions: { location, gateSource, codeSource: allowed(Object.values(OneTimeCodeSource)) },
});

export const codeNotFoundEvent = defineEvent({
    ...baseEvent,
    event: TelemetryMailOneTimeCodeEvents.code_not_found,
    dimensions: { location, gateSource, codeSource: allowed([ABSENT_CODE_SOURCE]) },
});

export const codeCopiedEvent = defineEvent({
    ...baseEvent,
    event: TelemetryMailOneTimeCodeEvents.code_copied,
    dimensions: { location, gateSource, isMovedToTrash: bool() },
});

export const settingToggledEvent = defineEvent({
    ...baseEvent,
    event: TelemetryMailOneTimeCodeEvents.setting_toggled,
    dimensions: { setting: allowed(Object.values(OneTimeCodeSetting)), isEnabled: bool() },
});
