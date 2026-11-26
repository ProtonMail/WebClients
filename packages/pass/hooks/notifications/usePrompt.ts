import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { HOUR } from '@proton/shared/lib/constants';

import { promptDismissed } from '../../store/notifications/prompts/actions';
import { projectPrompt } from '../../store/notifications/prompts/definitions';
import type { PromptClientConditions, PromptDescriptor } from '../../store/notifications/prompts/definitions';
import { selectPromptDismissal } from '../../store/notifications/prompts/selectors';
import type { PromptId } from '../../store/notifications/prompts/types';
import type { MaybeNull } from '../../types/utils';
import { useEpoch } from '../useEpoch';

type Prompt = { prompt: MaybeNull<PromptDescriptor>; dismiss: () => void };

/** Connected prompt projection for a surface: resolves the definition
 * against the dismissal ledger and the caller-supplied client
 * conditions. Returns the resulting descriptor (or null when not
 * eligible) plus a dismissal dispatcher — the surface owns the client
 * conditions bag and the `primary.action` mapping. */
export const usePrompt = (id: PromptId, client: PromptClientConditions): Prompt => {
    const dispatch = useDispatch();
    const now = useEpoch(HOUR);

    const dismissal = useSelector(selectPromptDismissal(id));
    const prompt = projectPrompt(id, dismissal, client, now);

    const dismiss = useCallback(() => dispatch(promptDismissed(id)), [dispatch, id]);

    return { prompt, dismiss };
};
