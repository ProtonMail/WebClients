import noop from '@proton/utils/noop';

import type { MaybeNull } from '../../types';
import type { AlarmFactory } from '../../utils/time/alarm';
import { createTimeoutAlarm } from '../../utils/time/alarm';
import type { ClipboardApi, ClipboardService } from './types';

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
