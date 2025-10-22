import { type FC, useEffect } from 'react';

import { InlinePortMessageType } from 'proton-pass-extension/app/content/services/inline/inline.messages';
import { useIFrameAppController, useIFrameAppState } from 'proton-pass-extension/lib/components/Inline/IFrameApp';
import { ListItemIcon } from 'proton-pass-extension/lib/components/Inline/ListItemIcon';
import { PinUnlock } from 'proton-pass-extension/lib/components/Inline/PinUnlock';
import { c } from 'ttag';

import { useRerender } from '@proton/pass/hooks/useRerender';
import { PassIconStatus } from '@proton/pass/types/data/pass-icon';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { onNextTick } from '@proton/pass/utils/time/next-tick';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { FOCUS_RECOVERY_TIMEOUT, useBlurTrap } from './DropdownFocusController';

export const DropdownUnlock: FC = () => {
    const ctrl = useIFrameAppController();
    const blurTrap = useBlurTrap();
    const { visible } = useIFrameAppState();

    const [key, rerender] = useRerender('refocus');

    useEffect(
        blurTrap(() => {
            if (visible) {
                const onFocus = pipe(
                    rerender,
                    onNextTick(() => {
                        if (document.hasFocus()) {
                            ctrl.forwardMessage({
                                type: InlinePortMessageType.DROPDOWN_FOCUSED,
                            });
                        }
                    })
                );

                /** Force blur the parent field if dropdown becomes visible
                 * This helps when the dropdown has trouble gaining focus due
                 * to strict focus management in certain websites */
                const timer = setTimeout(
                    blurTrap(() => {
                        ctrl.forwardMessage({
                            type: document.hasFocus()
                                ? InlinePortMessageType.DROPDOWN_FOCUSED
                                : InlinePortMessageType.DROPDOWN_FOCUS_REQUEST,
                        });
                    }),
                    FOCUS_RECOVERY_TIMEOUT
                );

                const unregister = ctrl.registerHandler(InlinePortMessageType.DROPDOWN_FOCUS, onFocus);

                return () => {
                    unregister();
                    clearTimeout(timer);
                };
            } else rerender();
        }, FOCUS_RECOVERY_TIMEOUT),
        [visible]
    );

    return (
        <PinUnlock
            key={key}
            header={
                <div className="flex items-center gap-3 mb-3">
                    <ListItemIcon type="status" icon={PassIconStatus.LOCKED_DROPDOWN} />
                    <div className="flex-1">
                        <span className="block text-ellipsis">{c('Label').t`Unlock ${PASS_APP_NAME}`}</span>
                        <span className={clsx('block color-weak text-sm text-ellipsis')}>{c('Info')
                            .t`Enter your PIN code`}</span>
                    </div>
                </div>
            }
            onUnlock={() => ctrl.close({ refocus: true })}
        />
    );
};
