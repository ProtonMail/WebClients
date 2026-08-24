import type { FC, ReactNode } from 'react';
import { useEffect, useMemo } from 'react';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import noop from '@proton/utils/noop';

import type { SpotlightMessage } from '../../types';
import { pipe } from '../../utils/fp/pipe';
import { usePassCore } from '../Core/PassCoreProvider';

export type WithSpotlightRenderProps = {
    acknowledge: () => void;
    close: () => void;
    open: boolean;
};

type Props = {
    type: SpotlightMessage;
    children: (props: WithSpotlightRenderProps) => ReactNode;
};

export const useSpotlightFor = (type: SpotlightMessage) => {
    const { spotlight } = usePassCore();
    const [{ open, onClose }, setOpen] = useModalState();

    useEffect(() => {
        (async () => (await spotlight.check(type)) ?? false)().then(setOpen).catch(noop);
    }, [type]);

    return useMemo<WithSpotlightRenderProps>(() => {
        const acknowledge = () => spotlight.acknowledge(type);
        return { open, acknowledge, close: pipe(onClose, acknowledge) };
    }, [onClose, type, open]);
};

export const WithSpotlight: FC<Props> = ({ type, children }) => {
    const spotlightFor = useSpotlightFor(type);
    return spotlightFor.open && children(spotlightFor);
};
