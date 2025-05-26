import type { FC, ReactNode } from 'react';
import { useEffect, useMemo } from 'react';

import { useModalState } from '@proton/components';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import type { SpotlightMessage } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import noop from '@proton/utils/noop';

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
