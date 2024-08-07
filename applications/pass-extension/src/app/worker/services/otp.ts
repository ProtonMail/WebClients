import { isExtraOTPField } from '@proton/pass/lib/items/item.predicates';
import { generateTOTPCode } from '@proton/pass/lib/otp/otp';
import { selectItem, selectOTPCandidate } from '@proton/pass/store/selectors';
import type { Maybe, OtpRequest } from '@proton/pass/types';
import { type OtpCode, WorkerMessageType } from '@proton/pass/types';
import { withPayload } from '@proton/pass/utils/fp/lens';
import { logger } from '@proton/pass/utils/logger';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { parseSender } from '@proton/pass/utils/url/parser';

import WorkerMessageBroker from '../channel';
import { onContextReady } from '../context';
import store from '../store';

/* Although clients should store a complete OTP URI in the `totpUri` field.
 * We take this with a grain of salt to account from possible faulty imports.
 * And treat the `totpUri` field value as if it was user input, either:
 * - a valid OTP URI
 * - a valid secret from which we can create a valid TOTP URI with our defaults
 * - an invalid string
 * Each of the following OTP-related operations may throw. */
export const createOTPService = () => {
    const handleTOTPRequest = (payload: OtpRequest): OtpCode => {
        try {
            const totpUri: Maybe<string> = (() => {
                if (payload.type === 'uri') return payload.totpUri;
                if (payload.type === 'item') {
                    const { shareId, itemId } = payload.item;
                    const item = selectItem<'login'>(shareId, itemId)(store.getState());

                    /** First check if we have a top-level totp URI */
                    if (item?.data.content.totpUri.v) return deobfuscate(item.data.content.totpUri);

                    /** Check if any extra fields are of type TOTP */
                    const extraOTPs = item?.data.extraFields.filter(isExtraOTPField);
                    if (extraOTPs && extraOTPs.length > 0) return deobfuscate(extraOTPs[0].data.totpUri);
                }
            })();

            if (totpUri) {
                const otp = generateTOTPCode(totpUri);
                if (otp) return otp;
            }

            throw new Error('Cannot generate an OTP code from such item');
        } catch (err: unknown) {
            logger.error(`[Worker::OTP] OTP generation error`);
            throw err;
        }
    };

    WorkerMessageBroker.registerMessage(WorkerMessageType.OTP_CODE_GENERATE, withPayload(handleTOTPRequest));

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.AUTOFILL_OTP_CHECK,
        onContextReady((ctx, _, sender) => {
            const { url, tabId } = parseSender(sender);
            const submission = ctx.service.formTracker.get(tabId, url?.domain ?? '');
            const match = selectOTPCandidate({ ...url, submission })(store.getState());
            return match
                ? { shouldPrompt: true, shareId: match.shareId, itemId: match.itemId }
                : { shouldPrompt: false };
        })
    );

    return {};
};

export type OTPService = ReturnType<typeof createOTPService>;
