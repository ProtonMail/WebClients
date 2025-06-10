import { type FC } from 'react';

import { ExtraFieldsControl } from '@proton/pass/components/Form/Field/Control/ExtraFieldsControl';
import { TextAreaReadonly } from '@proton/pass/components/Form/legacy/TextAreaReadonly';
import type { ItemContentProps } from '@proton/pass/components/Views/types';
import { useDeobfuscatedValue } from '@proton/pass/hooks/useDeobfuscatedValue';
import { deobfuscateExtraFields } from '@proton/pass/lib/items/item.obfuscation';

export const NoteContent: FC<ItemContentProps<'note'>> = ({ revision: { data, itemId, shareId } }) => {
    const note = useDeobfuscatedValue(data.metadata.note);
    const extraFields = deobfuscateExtraFields(data.extraFields);

    return (
        <>
            {Boolean(note) && <TextAreaReadonly contained>{note}</TextAreaReadonly>}
            {Boolean(extraFields.length) && (
                <ExtraFieldsControl extraFields={extraFields} itemId={itemId} shareId={shareId} />
            )}
        </>
    );
};
