import { ReactNode, createContext, useState } from 'react';

import noop from '@proton/utils/noop';

interface Props {
    children: ReactNode;
}

export const SpotlightContext = createContext<{
    spotlight?: string;
    addSpotlight: Function;
}>({ addSpotlight: noop });

const SpotlightProvider = ({ children }: Props) => {
    const [spotlight, setSpotlight] = useState<string>();

    const addSpotlight = (value: string) => {
        setSpotlight((prevValue) => prevValue || value);
    };

    return <SpotlightContext.Provider value={{ spotlight, addSpotlight }}>{children}</SpotlightContext.Provider>;
};

export default SpotlightProvider;
