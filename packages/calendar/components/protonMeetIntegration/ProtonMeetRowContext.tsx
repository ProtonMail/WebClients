import { createContext, useContext } from 'react';

export const ProtonMeetRowContext = createContext<{
    passphrase?: string;
    savePassphrase?: (passphrase: string) => Promise<void>;
    fetchingDetailsFailed: boolean;
    refetchMeeting?: () => Promise<void>;
    hidePassphrase: boolean;
}>({
    passphrase: undefined,
    savePassphrase: undefined,
    fetchingDetailsFailed: false,
    refetchMeeting: undefined,
    hidePassphrase: false,
});

export const useProtonMeetRowContext = () => {
    const context = useContext(ProtonMeetRowContext);

    return context;
};
