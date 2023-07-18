import { type VFC, useCallback, useLayoutEffect, useRef, useState } from 'react';

import { type Callback, type MaybeNull, WorkerStatus } from '@proton/pass/types';
import { pipe, tap } from '@proton/pass/utils/fp';

import { type DropdownActions, type IFrameMessage, IFrameMessageType } from '../../../../types';
import { useIFrameContext, useRegisterMessageHandler } from '../../context/IFrameContextProvider';
import { DropdownSwitch } from '../components/DropdownSwitch';

export const DropdownContent: VFC = () => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { workerState, visible, resizeIFrame, closeIFrame, postMessage } = useIFrameContext();
    const [dropdownState, setDropdownState] = useState<MaybeNull<DropdownActions>>(null);

    const withStateReset = <F extends Callback>(fn: F): F =>
        pipe(
            fn,
            tap(() => setDropdownState(null))
        ) as F;

    const handleAction = useCallback(
        ({ payload }: IFrameMessage<IFrameMessageType.DROPDOWN_ACTION>) => setDropdownState(payload),
        []
    );

    const triggerResize = useCallback(() => resizeIFrame(dropdownRef.current), [resizeIFrame]);
    useLayoutEffect(() => triggerResize(), [triggerResize, dropdownState, workerState]);

    useRegisterMessageHandler(IFrameMessageType.DROPDOWN_ACTION, handleAction);
    useRegisterMessageHandler(IFrameMessageType.IFRAME_OPEN, triggerResize);

    return (
        <DropdownSwitch
            ref={dropdownRef}
            state={dropdownState}
            status={workerState?.status ?? WorkerStatus.IDLE}
            loggedIn={workerState?.loggedIn ?? false}
            onMessage={withStateReset(postMessage)}
            onClose={withStateReset(closeIFrame)}
            onResize={triggerResize}
            visible={visible}
        />
    );
};
