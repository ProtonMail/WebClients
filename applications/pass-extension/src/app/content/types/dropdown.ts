import type { GeneratePasswordOptions } from '@proton/pass/lib/password/generator';
import type { MaybeNull, SafeLoginItem } from '@proton/pass/types';

import type { FieldHandle } from './form';
import type { IFrameAppService } from './iframe';

export enum DropdownAction {
    AUTOFILL = 'AUTOFILL',
    AUTOSUGGEST_PASSWORD = 'AUTOSUGGEST_PASSWORD',
    AUTOSUGGEST_ALIAS = 'AUTOSUGGEST_ALIAS',
}

export type DropdownActions =
    | { action: DropdownAction.AUTOFILL; hostname: string; items: SafeLoginItem[]; needsUpgrade: boolean }
    | { action: DropdownAction.AUTOSUGGEST_PASSWORD; hostname: string; options: GeneratePasswordOptions }
    | { action: DropdownAction.AUTOSUGGEST_ALIAS; hostname: string; prefix: string };

export type DropdownOpenOptions = {
    action: DropdownAction;
    field: FieldHandle;
    autofocused?: boolean;
};

export interface InjectedDropdown extends IFrameAppService<DropdownOpenOptions> {
    getCurrentField: () => MaybeNull<FieldHandle>;
    sync: () => Promise<void>;
}
