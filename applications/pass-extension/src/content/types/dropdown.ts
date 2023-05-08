import type { Maybe, Realm, SafeLoginItem } from '@proton/pass/types';

import type { FieldHandle } from './form';
import type { IFrameAppService } from './iframe';

export enum DropdownAction {
    AUTOFILL = 'AUTOFILL',
    AUTOSUGGEST_PASSWORD = 'AUTOSUGGEST_PASSWORD',
    AUTOSUGGEST_ALIAS = 'AUTOSUGGEST_ALIAS',
}

export type DropdownSetActionPayload =
    | { action: DropdownAction.AUTOFILL; items: SafeLoginItem[] }
    | { action: DropdownAction.AUTOSUGGEST_PASSWORD }
    | { action: DropdownAction.AUTOSUGGEST_ALIAS; realm: Realm };

export type OpenDropdownOptions = {
    field: FieldHandle;
    action: DropdownAction;
    autofocused?: boolean;
};

export interface InjectedDropdown extends IFrameAppService<OpenDropdownOptions> {
    getCurrentField: () => Maybe<FieldHandle>;
}
