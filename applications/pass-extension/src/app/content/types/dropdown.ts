import type { PasswordAutosuggestOptions } from '@proton/pass/lib/password/types';
import type { MaybeNull } from '@proton/pass/types';

import type { FieldHandle } from './form';
import type { IFrameAppService } from './iframe';

export enum DropdownAction {
    AUTOFILL_IDENTITY = 'AUTOFILL_IDENTITY',
    AUTOFILL_LOGIN = 'AUTOFILL_LOGIN',
    AUTOSUGGEST_ALIAS = 'AUTOSUGGEST_ALIAS',
    AUTOSUGGEST_PASSWORD = 'AUTOSUGGEST_PASSWORD',
}

export type DropdownActions =
    | { action: DropdownAction.AUTOFILL_IDENTITY; domain: string }
    | { action: DropdownAction.AUTOFILL_LOGIN; domain: string; startsWith: string }
    | { action: DropdownAction.AUTOSUGGEST_ALIAS; domain: string; prefix: string }
    | ({ action: DropdownAction.AUTOSUGGEST_PASSWORD; domain: string } & PasswordAutosuggestOptions);

export type DropdownRequest = {
    action: DropdownAction;
    field: FieldHandle;
    autofocused?: boolean;
};

export interface InjectedDropdown extends IFrameAppService<DropdownRequest> {
    getCurrentField: () => MaybeNull<FieldHandle>;
}
