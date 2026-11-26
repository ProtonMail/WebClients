import { type FC, useCallback, useEffect, useState } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { useTelemetryEvent } from '@proton/pass/hooks/useTelemetryEvent';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import noop from '@proton/utils/noop';

import { useIFrameAppController, useIFrameAppState } from '../../../../../../../lib/components/Inline/IFrameApp';
import { contentScriptMessage, sendMessage } from '../../../../../../../lib/message/send-message';
import { WorkerMessageType } from '../../../../../../../types/messages';
import type { InlineToastAction } from '../../../../../constants.runtime';
import type { InlineToastRequest } from '../../toast.app';
import { ToastHeader } from '../components/ToastHeader';

type Props = Extract<InlineToastRequest, { action: InlineToastAction.OFFLINE_SETUP }>;

const DISMISS_TOAST_DURATION = 2_000;

export const OfflineSetup: FC<Props> = ({ data }) => {
    const controller = useIFrameAppController();
    const { visible } = useIFrameAppState();
    const { onTelemetry } = usePassCore();
    const [dismissed, setDismissed] = useState(false);

    useTelemetryEvent(TelemetryEventName.PassNotificationDisplay, {}, { notificationKey: data.id })([visible]);

    /** CTA: ask the service worker to open the popup (or fall back
     * to the settings tab) where the user confirms their password */
    const onEnable = useCallback(() => {
        onTelemetry(TelemetryEventName.PassNotificationCTAClick, {}, { notificationKey: data.id });
        sendMessage(contentScriptMessage({ type: WorkerMessageType.OFFLINE_SETUP_OPEN, payload: data }))
            .then(() => controller.close())
            .catch(noop);
    }, [data, onTelemetry]);

    /* "Not now" and the X both count as dismissals: show the
     * confirmation toast if there's copy for it, then close with
     * `discard` so the toast app's `onClose` records the dismissal
     * in the ledger. Without confirmation copy, close immediately —
     * leaving the prompt on screen would look unresponsive and
     * leave the CTA clickable after dismissal. */
    useEffect(() => {
        if (!dismissed) return;
        if (!data.dismissToast) return controller.close({ discard: true });
        const timer = setTimeout(() => controller.close({ discard: true }), DISMISS_TOAST_DURATION);
        return () => clearTimeout(timer);
    }, [dismissed]);

    if (dismissed && data.dismissToast) {
        return <ToastHeader className="toast-dismissed" title={data.dismissToast} wrapText discardOnClose />;
    }

    return (
        <div className="flex flex-column gap-2">
            <ToastHeader title={data.title} noClose onClose={() => setDismissed(true)} />
            <div className="color-weak text-base pb-2">{data.body}</div>
            <Button color="norm" pill size="small" fullWidth onClick={onEnable}>
                <span className="flex items-center justify-center gap-1 w-full">{data.primary.label}</span>
            </Button>
        </div>
    );
};
