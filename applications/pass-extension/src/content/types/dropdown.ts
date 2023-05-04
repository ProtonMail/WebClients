import type { AliasState } from '@proton/pass/store';
import type { Maybe, Realm, SafeLoginItem } from '@proton/pass/types';

import type { FieldHandle, FormField, FormType } from './form';
import type { IFrameAppService } from './iframe';

export enum DropdownAction {
    AUTOFILL,
    AUTOSUGGEST_PASSWORD,
    AUTOSUGGEST_ALIAS,
}

export type DropdownSetActionPayload =
    | { action: DropdownAction.AUTOFILL; items: SafeLoginItem[] }
    | { action: DropdownAction.AUTOSUGGEST_PASSWORD }
    | { action: DropdownAction.AUTOSUGGEST_ALIAS; options: AliasState['aliasOptions']; realm: Realm };

export type DropdownState = { field: Maybe<FieldHandle<FormType, FormField>> };

export type OpenDropdownOptions = {
    field: FieldHandle;
    action: DropdownAction;
    focus?: boolean;
};

export interface InjectedDropdown extends IFrameAppService<OpenDropdownOptions> {}
