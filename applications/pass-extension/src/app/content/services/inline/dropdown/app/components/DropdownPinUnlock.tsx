import { type FC, useEffect } from 'react';

import { c } from 'ttag';

import { PassIconStatus } from '@proton/pass/types/data/pass-icon';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { useIFrameAppController, useIFrameAppState } from '../../../../../../../lib/components/Inline/IFrameApp';
import { ListItemIcon } from '../../../../../../../lib/components/Inline/ListItemIcon';
import { PinUnlock } from '../../../../../../../lib/components/Inline/PinUnlock';
import { InlinePortMessageType } from '../../../inline.messages';
import { useFocusController } from './DropdownFocusController';

export const DropdownPinUnlock: FC = () => {
    const ctrl = useIFrameAppController();
    const focusCtrl = useFocusController();
    const { visible } = useIFrameAppState();

    useEffect(() => {
        if (visible) {
            ctrl.forwardMessage({
                type: InlinePortMessageType.DROPDOWN_FOCUS_REQUEST,
            });
        }
    }, [visible]);

    return (
        <PinUnlock
            ref={focusCtrl.focusRef}
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
