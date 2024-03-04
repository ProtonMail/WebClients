import { type FC } from 'react';

import { TextAreaReadonly } from '@proton/pass/components/Form/legacy/TextAreaReadonly';
import type { ItemContentProps } from '@proton/pass/components/Views/types';

import { useDeobfuscatedValue } from '../../../hooks/useDeobfuscatedValue';

export const NoteContent: FC<ItemContentProps<'note'>> = ({ revision }) => {
    const note = useDeobfuscatedValue(revision.data.metadata.note);

    return <TextAreaReadonly>{note}</TextAreaReadonly>;
};
