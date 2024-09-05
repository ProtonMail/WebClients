import { createContext, useContext } from 'react';

import type { UseAsyncModalHandle } from '@proton/pass/hooks/useAsyncModalHandles';
import type { GeneratePasswordConfig } from '@proton/pass/lib/password/generator';
import type { PasswordItem } from '@proton/pass/store/reducers';
import type { MaybeNull } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import { type BaseProps as PasswordGeneratorModalProps } from './PasswordGeneratorModal';

export type PasswordModalState = Omit<PasswordGeneratorModalProps, 'onSubmit'>;

export type PasswordContextValue = {
    /** Current password options in store */
    config: MaybeNull<GeneratePasswordConfig>;
    /** Generates a random password */
    generate: UseAsyncModalHandle<string, PasswordModalState>;
    /** Password history handles */
    history: {
        /** Pushes a password to the history */
        add: (pw: PasswordItem) => void;
        /** Clears the whole password history */
        clear: () => void;
        /** Opens the password history modal */
        open: () => void;
        /** Removes a password history item by id */
        remove: (id: string) => void;
    };
};

export const PasswordContext = createContext<PasswordContextValue>({
    config: null,
    generate: async () => {},
    history: {
        add: noop,
        clear: noop,
        open: noop,
        remove: noop,
    },
});

export const usePasswordContext = () => useContext(PasswordContext);
