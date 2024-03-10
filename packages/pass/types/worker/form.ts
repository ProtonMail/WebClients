import type { FormType } from '@proton/pass/fathom';
import type { MaybeNull } from '@proton/pass/types/utils';

import type { WithAutosavePrompt } from './autosave';
import type { TabId } from './runtime';

export type FormIdentifier = `${TabId}:${string}`;

export enum FormEntryStatus {
    STAGING,
    COMMITTED,
}

export type FormEntryBase = {
    domain: string;
    subdomain: MaybeNull<string>;
    /* Cast the enum to a string union to avoid importing it
     * in the service-worker, preventing any fathom-related code
     * from being added to the build chunk */
    type: `${FormType}`;
    action?: string /* form action attribute */;
    scheme?: string;
};

export type FormEntryData = FormEntryBase &
    (
        | { partial: true; data: { username?: string; password?: string } }
        | { partial: false; data: { username: string; password: string } }
    );

export type NewFormEntry = Pick<FormEntryData, 'data' | 'action' | 'type'>;

export type FormEntry<T extends FormEntryStatus = FormEntryStatus> = Extract<
    | ({ status: FormEntryStatus.STAGING } & FormEntryData)
    | ({ status: FormEntryStatus.COMMITTED } & Extract<FormEntryData, { partial: false }>),
    { status: T }
>;

export type FormEntryPrompt = WithAutosavePrompt<FormEntry<FormEntryStatus.COMMITTED>, true>;
