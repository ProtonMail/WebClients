import { generateTOTPCode } from '@proton/pass/lib/otp/otp';
import { selectAutofillCandidates, selectItem } from '@proton/pass/store/selectors';
import type { Maybe, OtpRequest, WorkerMessageResponse } from '@proton/pass/types';
import { type OtpCode, WorkerMessageType } from '@proton/pass/types';
import { withPayload } from '@proton/pass/utils/fp/lens';
import { logger } from '@proton/pass/utils/logger';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import type { ParsedSender } from '@proton/pass/utils/url/parser';
import { parseSender } from '@proton/pass/utils/url/parser';

import WorkerMessageBroker from '../channel';
import { withContext } from '../context';
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
                    const item = selectItem(shareId, itemId)(store.getState());
                    if (item?.data.type === 'login') return deobfuscate(item.data.content.totpUri);
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

    const handleOTPCheck = withContext<
        (sender: ParsedSender) => WorkerMessageResponse<WorkerMessageType.AUTOFILL_OTP_CHECK>
    >(({ service: { formTracker } }, { tabId, url }) => {
        const submission = formTracker.get(tabId, url.domain ?? '');
        const candidates = selectAutofillCandidates(url)(store.getState());
        const otpItems = candidates.filter((item) => Boolean(item.data.content.totpUri.v));

        const match = submission
            ? otpItems.find((item) => deobfuscate(item.data.content.username) === submission.data.username)
            : otpItems[0];

        return match ? { shouldPrompt: true, shareId: match.shareId, itemId: match.itemId } : { shouldPrompt: false };
    });

    WorkerMessageBroker.registerMessage(WorkerMessageType.OTP_CODE_GENERATE, withPayload(handleTOTPRequest));
    WorkerMessageBroker.registerMessage(WorkerMessageType.AUTOFILL_OTP_CHECK, (_, sender) =>
        handleOTPCheck(parseSender(sender))
    );
    return {};
};

export type OTPService = ReturnType<typeof createOTPService>;
