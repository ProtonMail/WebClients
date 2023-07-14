import type { MaybeNull, SafeLoginItem } from '@proton/pass/types';

import type { FieldHandle } from './form';
import type { IFrameAppService } from './iframe';

export enum DropdownAction {
    AUTOFILL = 'AUTOFILL',
    AUTOSUGGEST_PASSWORD = 'AUTOSUGGEST_PASSWORD',
    AUTOSUGGEST_ALIAS = 'AUTOSUGGEST_ALIAS',
}

export type DropdownActions =
    | { action: DropdownAction.AUTOFILL; items: SafeLoginItem[]; needsUpgrade: boolean }
    | { action: DropdownAction.AUTOSUGGEST_PASSWORD }
    | { action: DropdownAction.AUTOSUGGEST_ALIAS; domain: string; prefix: string };

export type DropdownOpenOptions = {
    action: DropdownAction;
    field: FieldHandle;
    autofocused?: boolean;
};

export interface InjectedDropdown extends IFrameAppService<DropdownOpenOptions> {
    getCurrentField: () => MaybeNull<FieldHandle>;
}
