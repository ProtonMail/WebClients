import { type VFC, useCallback, useLayoutEffect, useRef, useState } from 'react';

import { type MaybeNull, WorkerStatus } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp';

import { type DropdownActions, type IFrameMessage, IFrameMessageType } from '../../../../types';
import { useIFrameContext, useRegisterMessageHandler } from '../../context/IFrameContextProvider';
import { DropdownSwitch } from '../components/DropdownSwitch';

export const DropdownContent: VFC = () => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { workerState, visible, locale, resizeIFrame, closeIFrame, postMessage } = useIFrameContext();
    const [dropdownState, setDropdownState] = useState<MaybeNull<DropdownActions>>(null);

    const onReset = () => setDropdownState(null);

    const onClose = pipe(closeIFrame, onReset);
    const onResize = useCallback(() => resizeIFrame(dropdownRef.current), [resizeIFrame]);

    const handleAction = useCallback(
        ({ payload }: IFrameMessage<IFrameMessageType.DROPDOWN_ACTION>) => setDropdownState(payload),
        []
    );

    useLayoutEffect(() => onResize(), [onResize, dropdownState, workerState]);

    useRegisterMessageHandler(IFrameMessageType.DROPDOWN_ACTION, handleAction);
    useRegisterMessageHandler(IFrameMessageType.IFRAME_OPEN, onResize);

    return (
        <DropdownSwitch
            ref={dropdownRef}
            state={dropdownState}
            status={workerState?.status ?? WorkerStatus.IDLE}
            loggedIn={workerState?.loggedIn ?? false}
            onMessage={postMessage}
            onClose={onClose}
            onResize={onResize}
            onReset={onReset}
            visible={visible}
            key={locale}
        />
    );
};
