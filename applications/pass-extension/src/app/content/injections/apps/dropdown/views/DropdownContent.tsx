import { type FC, useCallback, useEffect, useRef, useState } from 'react';

import { Localized } from '@proton/pass/components/Core/Localized';
import { AppStatus, type MaybeNull } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';

import { type DropdownActions, type IFrameMessage, IFrameMessageType } from '../../../../types';
import { useIFrameContext, useRegisterMessageHandler } from '../../context/IFrameContextProvider';
import { DropdownSwitch } from '../components/DropdownSwitch';

export const DropdownContent: FC = () => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { workerState, visible, resizeIFrame, closeIFrame, postMessage } = useIFrameContext();
    const [dropdownState, setDropdownState] = useState<MaybeNull<DropdownActions>>(null);

    const onReset = () => setDropdownState(null);
    const onClose = pipe(closeIFrame, onReset);
    const onResize = resizeIFrame;

    const handleAction = useCallback(
        ({ payload }: IFrameMessage<IFrameMessageType.DROPDOWN_ACTION>) => setDropdownState(payload),
        []
    );

    useRegisterMessageHandler(IFrameMessageType.DROPDOWN_ACTION, handleAction);

    useEffect(() => {
        if (dropdownRef.current) {
            const obs = new ResizeObserver(([entry]) => onResize(entry.contentRect.height));
            obs.observe(dropdownRef.current);
            return () => obs.disconnect();
        }
    });

    return (
        <Localized>
            <DropdownSwitch
                loggedIn={workerState?.loggedIn ?? false}
                onClose={onClose}
                onMessage={postMessage}
                onReset={onReset}
                ref={dropdownRef}
                state={dropdownState}
                status={workerState?.status ?? AppStatus.IDLE}
                visible={visible}
            />
        </Localized>
    );
};
