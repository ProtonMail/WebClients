import type { Item, ItemRevision } from '../data';
import type { FormEntryPrompt } from './form';

export enum AutoSaveType {
    NEW,
    UPDATE,
}

export type AutoSavePromptOptions =
    | { shouldPrompt: false }
    | {
          shouldPrompt: true;
          data: { action: AutoSaveType.NEW } | { action: AutoSaveType.UPDATE; item: ItemRevision<'login'> };
      };

export type WithAutoSavePromptOptions<T, U = boolean> = T & {
    autosave: Extract<AutoSavePromptOptions, { shouldPrompt: U }>;
};

export type AutosavePayload = { item: Item<'login'>; submission: FormEntryPrompt };
