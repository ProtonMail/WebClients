import { type FC } from 'react';

import { ExtraFieldsControl } from '@proton/pass/components/Form/Field/Control/ExtraFieldsControl';
import { FieldBox } from '@proton/pass/components/Form/Field/Layout/FieldBox';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextAreaReadonly } from '@proton/pass/components/Form/legacy/TextAreaReadonly';
import type { ItemContentProps } from '@proton/pass/components/Views/types';
import { useDeobfuscatedValue } from '@proton/pass/hooks/useDeobfuscatedValue';
import { deobfuscateExtraFields } from '@proton/pass/lib/items/item.obfuscation';

export const NoteContent: FC<ItemContentProps<'note'>> = ({ revision: { data, itemId, shareId } }) => {
    const note = useDeobfuscatedValue(data.metadata.note);
    const extraFields = deobfuscateExtraFields(data.extraFields);

    return (
        <>
            {Boolean(note) && (
                <FieldsetCluster mode="read" as="div">
                    <FieldBox>
                        <TextAreaReadonly>{note}</TextAreaReadonly>
                    </FieldBox>
                </FieldsetCluster>
            )}
            {Boolean(extraFields.length) && (
                <ExtraFieldsControl extraFields={extraFields} itemId={itemId} shareId={shareId} />
            )}
        </>
    );
};
