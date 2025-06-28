import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';

import { mailtoParser } from '../helpers/url';
import type { OnCompose } from '../hooks/composer/useCompose';
import { ComposeTypes } from '../hooks/composer/useCompose';

const ComposeProviderContext = createContext<OnCompose>(null as any);

export const useOnCompose = () => {
    return useContext(ComposeProviderContext);
};

export const useOnMailTo = () => {
    const onCompose = useOnCompose();

    return (src: string) => {
        const referenceMessage = mailtoParser(src);
        void onCompose({ type: ComposeTypes.newMessage, action: MESSAGE_ACTIONS.NEW, referenceMessage });
    };
};

interface Props {
    children: ReactNode;
    onCompose: OnCompose;
}

export const ComposeProvider = ({ children, onCompose }: Props) => {
    return <ComposeProviderContext.Provider value={onCompose}>{children}</ComposeProviderContext.Provider>;
};
