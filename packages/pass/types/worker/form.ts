import type { FormType } from '../../fathom';
import type { MaybeNull } from '../utils';
import type { WithAutoSavePromptOptions } from './autosave';
import type { TabId } from './runtime';

export type FormIdentifier = `${TabId}:${string}`;

export enum FormEntryStatus {
    STAGING,
    COMMITTED,
}

export type FormEntryBase = {
    domain: string;
    subdomain: MaybeNull<string>;
    type: FormType;
    action?: string /* form action attribute */;
};

export type FormEntryData = FormEntryBase &
    (
        | {
              partial: true;
              data: { username: string; password: undefined };
          }
        | {
              partial: false;
              data: { username: string; password: string };
          }
    );

export type NewFormEntry = Pick<FormEntryData, 'data' | 'action' | 'type'>;

export type FormEntry<T extends FormEntryStatus = FormEntryStatus> = Extract<
    | ({
          status: FormEntryStatus.STAGING;
      } & FormEntryData)
    | ({
          status: FormEntryStatus.COMMITTED;
      } & Extract<FormEntryData, { partial: false }>),
    { status: T }
>;

export type FormEntryPrompt = WithAutoSavePromptOptions<FormEntry<FormEntryStatus.COMMITTED>, true>;
