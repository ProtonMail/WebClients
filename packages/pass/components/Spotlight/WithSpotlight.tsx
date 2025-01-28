import type { FC, ReactNode } from 'react';
import { useEffect } from 'react';

import { type ModalStateProps, useModalState } from '@proton/components/index';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import type { SpotlightMessage } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import noop from '@proton/utils/noop';

export type SpotlightModalProps = {
    onClose: ModalStateProps['onClose'];
    acknowledge: () => void;
    closeAndAcknowledge: () => void;
};

type Props = { type: SpotlightMessage; children: (props: SpotlightModalProps) => ReactNode };

export const WithSpotlight: FC<Props> = ({ type, children }) => {
    const { spotlight } = usePassCore();
    const [{ open, onClose }, setOpen] = useModalState();

    const acknowledge = () => spotlight.acknowledge(type);

    const closeAndAcknowledge = pipe(onClose, acknowledge);

    useEffect(() => {
        (async () => (await spotlight.check(type)) ?? false)().then(setOpen).catch(noop);
    }, [type]);

    return open && children({ acknowledge, onClose, closeAndAcknowledge });
};
