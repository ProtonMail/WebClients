import type { Maybe, Realm, SafeLoginItem } from '@proton/pass/types';

import type { FieldHandle } from './form';
import type { IFrameAppService } from './iframe';

export enum DropdownAction {
    AUTOFILL,
    AUTOSUGGEST_PASSWORD,
    AUTOSUGGEST_ALIAS,
}

export type DropdownSetActionPayload =
    | { action: DropdownAction.AUTOFILL; items: SafeLoginItem[] }
    | { action: DropdownAction.AUTOSUGGEST_PASSWORD }
    | { action: DropdownAction.AUTOSUGGEST_ALIAS; realm: Realm };

export type DropdownState = { field: Maybe<FieldHandle> };

export type OpenDropdownOptions = {
    field: FieldHandle;
    action: DropdownAction;
    focus?: boolean;
};

export interface InjectedDropdown extends IFrameAppService<OpenDropdownOptions> {}
