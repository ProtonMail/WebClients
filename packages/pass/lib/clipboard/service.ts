import type { ClipboardApi, ClipboardService } from '@proton/pass/lib/clipboard/types';
import type { MaybeNull } from '@proton/pass/types';
import type { AlarmFactory } from '@proton/pass/utils/time/alarm';
import { createTimeoutAlarm } from '@proton/pass/utils/time/alarm';
import noop from '@proton/utils/noop';

export const createClipboardService = (
    clipboard: ClipboardApi,
    alarmFactory: AlarmFactory = createTimeoutAlarm
): ClipboardService => {
    let clipboardValue: MaybeNull<string> = null;

    const alarm = alarmFactory('clipboard::clear', async () => {
        const current = await clipboard.read().catch(noop);
        if (current === clipboardValue) clipboard.write('').catch(noop);
        clipboardValue = null;
    });

    return {
        ...clipboard,
        autoClear: (timeoutMs, value) => {
            void alarm.reset();
            clipboardValue = null;

            if (timeoutMs >= 0) {
                clipboardValue = value;
                void alarm.set(Date.now() + timeoutMs);
            }
        },
    };
};
