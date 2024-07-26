import type { PasswordAutosuggestOptions } from '@proton/pass/lib/password/types';
import type { MaybeNull } from '@proton/pass/types';

import type { FieldHandle } from './form';
import type { IFrameAppService } from './iframe';

export enum DropdownAction {
    AUTOFILL_LOGIN = 'AUTOFILL_LOGIN',
    AUTOSUGGEST_PASSWORD = 'AUTOSUGGEST_PASSWORD',
    AUTOSUGGEST_ALIAS = 'AUTOSUGGEST_ALIAS',
}

export type DropdownActions =
    | { action: DropdownAction.AUTOFILL_LOGIN; domain: string }
    | { action: DropdownAction.AUTOSUGGEST_ALIAS; domain: string; prefix: string }
    | ({ action: DropdownAction.AUTOSUGGEST_PASSWORD; domain: string } & PasswordAutosuggestOptions);

export type DropdownOpenOptions = {
    action: DropdownAction;
    field: FieldHandle;
    autofocused?: boolean;
};

export interface InjectedDropdown extends IFrameAppService<DropdownOpenOptions> {
    getCurrentField: () => MaybeNull<FieldHandle>;
    sync: () => Promise<void>;
}
