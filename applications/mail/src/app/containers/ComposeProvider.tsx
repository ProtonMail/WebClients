import React, { createContext, ReactNode, useContext } from 'react';
import { OnCompose } from '../hooks/composer/useCompose';
import { mailtoParser } from '../helpers/url';
import { MESSAGE_ACTIONS } from '../constants';

const ComposeProviderContext = createContext<OnCompose>(null as any);

export const useOnCompose = () => {
    return useContext(ComposeProviderContext);
};

export const useOnMailTo = () => {
    const onCompose = useOnCompose();

    return (src: string) => {
        const referenceMessage = mailtoParser(src);
        onCompose({ action: MESSAGE_ACTIONS.NEW, referenceMessage });
    };
};

interface Props {
    children: ReactNode;
    onCompose: OnCompose;
}
export const ComposeProvider = ({ children, onCompose }: Props) => {
    return <ComposeProviderContext.Provider value={onCompose}>{children}</ComposeProviderContext.Provider>;
};
