import type { FC } from 'react';

import { useDeobfuscatedValue } from '../../../hooks/useDeobfuscatedValue';
import { deobfuscateExtraFields } from '../../../lib/items/item.obfuscation';
import { getItemKey } from '../../../lib/items/item.utils';
import { ExtraFieldsControl } from '../../Form/Field/Control/ExtraFieldsControl';
import { FieldBox } from '../../Form/Field/Layout/FieldBox';
import { FieldsetCluster } from '../../Form/Field/Layout/FieldsetCluster';
import { TextAreaReadonly } from '../../Form/legacy/TextAreaReadonly';
import type { ItemContentProps } from '../../Views/types';
import { useItemFieldExpansion } from '../Containers/ItemFieldExpansion';

export const NoteContent: FC<ItemContentProps<'note'>> = ({
    revision: { data, itemId, shareId, revision },
    viewingHistory,
}) => {
    const note = useDeobfuscatedValue(data.metadata.note);
    const extraFields = deobfuscateExtraFields(data.extraFields);
    const [expanded, setExpanded] = useItemFieldExpansion(getItemKey({ shareId, itemId }), true);

    return (
        <>
            {Boolean(note) && (
                <FieldsetCluster mode="read" as="div">
                    <FieldBox className="pass-input-group--no-focus">
                        {viewingHistory ? (
                            /** `revision` is used as key here to trigger an internal
                             * state reset of `TextAreaReadonly` when toggling between
                             * note revisions when comparing history (resets expansion) */
                            <TextAreaReadonly key={revision} defaultExpanded>
                                {note}
                            </TextAreaReadonly>
                        ) : (
                            <TextAreaReadonly expanded={expanded} onExpandedChange={setExpanded}>
                                {note}
                            </TextAreaReadonly>
                        )}
                    </FieldBox>
                </FieldsetCluster>
            )}
            {Boolean(extraFields.length) && (
                <ExtraFieldsControl extraFields={extraFields} itemId={itemId} shareId={shareId} />
            )}
        </>
    );
};
