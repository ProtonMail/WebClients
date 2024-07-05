import { WasmProtonWalletApiClient } from '@proton/andromeda';
import type { CalendarModelEventManager } from '@proton/calendar';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';

export interface MailThunkArguments extends ProtonThunkArguments {
    calendarModelEventManager: CalendarModelEventManager;
    walletApi: WasmProtonWalletApiClient;
}

export const extraThunkArguments = {} as MailThunkArguments;
