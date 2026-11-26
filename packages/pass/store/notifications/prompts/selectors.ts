import type { State } from '../../types';
import type { PromptId } from './types';

export const selectPromptDismissal =
    (id: PromptId) =>
    ({ prompts }: State) =>
        prompts[id];
