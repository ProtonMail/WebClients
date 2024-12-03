import type { FC, ReactNode } from 'react';
import { useEffect } from 'react';

import { type ModalStateProps, useModalState } from '@proton/components/index';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import type { SpotlightMessage } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export type SpotlightModalProps = {
    onClose: ModalStateProps['onClose'];
    acknowledge: () => void;
};

type Props = { type: SpotlightMessage; children: (props: SpotlightModalProps) => ReactNode };

export const WithSpotlightModal: FC<Props> = ({ type, children }) => {
    const { spotlight } = usePassCore();
    const [{ open, onClose }, setModal] = useModalState();

    const acknowledge = () => spotlight.acknowledge(type);

    useEffect(() => {
        (async () => (await spotlight.check(type)) ?? false)().then(setModal).catch(noop);
    }, [type]);

    return open && children({ acknowledge, onClose });
};
