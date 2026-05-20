import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { onContextReady, withContext } from 'proton-pass-extension/app/worker/context/inject';
import type { MessageHandlerCallback } from 'proton-pass-extension/lib/message/message-broker';
import { parseSender } from 'proton-pass-extension/lib/utils/sender';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { getItemTOTPUri, intoLoginItemPreview } from '@proton/pass/lib/items/item.utils';
import { generateTOTPCode } from '@proton/pass/lib/otp/otp';
import { selectOTPCandidate } from '@proton/pass/store/selectors/autofill';
import { selectItem } from '@proton/pass/store/selectors/items';
import type { Maybe } from '@proton/pass/types/utils/index';
import { logger } from '@proton/pass/utils/logger';
import { getEpoch } from '@proton/pass/utils/time/epoch';

/* Although clients should store a complete OTP URI in the `totpUri` field.
 * We take this with a grain of salt to account from possible faulty imports.
 * And treat the `totpUri` field value as if it was user input, either:
 * - a valid OTP URI
 * - a valid secret from which we can create a valid TOTP URI with our defaults
 * - an invalid string
 * Each of the following OTP-related operations may throw. */
export const createOTPService = () => {
    const onOTPRequest = withContext<MessageHandlerCallback<WorkerMessageType.OTP_CODE_GENERATE>>(
        (ctx, { payload }) => {
            try {
                const totpUri: Maybe<string> = (() => {
                    if (payload.type === 'uri') return payload.totpUri;
                    if (payload.type === 'item') {
                        const { shareId, itemId } = payload.item;
                        const state = ctx.service.store.getState();
                        const item = selectItem<'login'>(shareId, itemId)(state);
                        if (item) return getItemTOTPUri(item);
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
        }
    );

    WorkerMessageBroker.registerMessage(WorkerMessageType.OTP_CODE_GENERATE, onOTPRequest);

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.AUTOFILL_OTP_CHECK,
        onContextReady(async (ctx, _, sender) => {
            const { url, tabId } = await parseSender(sender);
            const submission = ctx.service.formTracker.get(tabId, url);
            const state = ctx.service.store.getState();
            const match = selectOTPCandidate({ ...url, submission })(state);

            if (match) {
                const { autofill } = await ctx.service.settings.resolve();
                /* Don't prompt if `twofaCopy` setting is enabled
                 * and code was copied from autofill <30s ago */
                const recentlyCopied =
                    Boolean(autofill.twofaCopy) && match.lastUseTime && match.lastUseTime > getEpoch() - 30;
                if (recentlyCopied) return { shouldPrompt: false };
                return { shouldPrompt: true, ...intoLoginItemPreview(match) };
            } else {
                return { shouldPrompt: false };
            }
        })
    );

    return { generateTOTPCode };
};

export type OTPService = ReturnType<typeof createOTPService>;
