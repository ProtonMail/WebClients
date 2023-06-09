import type { MaybeNull } from '../utils';
import type { WithAutoSavePromptOptions } from './autosave';
import type { TabId } from './runtime';

export type FormIdentifier = `${TabId}:${string}`;
/* Form types based on protonpass-fathom
 * predicted form types */
export enum FormType {
    LOGIN = 'login',
    REGISTER = 'register',
    PASSWORD_CHANGE = 'password-change',
    RECOVERY = 'recovery',
    MFA = 'mfa',
    NOOP = 'noop',
}

/* Form field types based on protonpass-fathom
 * predicted form field */
export enum FormField {
    EMAIL = 'email',
    USERNAME = 'username',
    USERNAME_HIDDEN = 'username-hidden',
    PASSWORD_CURRENT = 'password',
    PASSWORD_NEW = 'new-password',
    NOOP = 'noop',
}

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

export type PromptedFormEntry = WithAutoSavePromptOptions<FormEntry<FormEntryStatus.COMMITTED>, true>;
