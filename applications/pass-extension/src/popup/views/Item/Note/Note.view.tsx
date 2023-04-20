import { type VFC } from 'react';

import type { ItemTypeViewProps } from '../../../../shared/items/types';
import { ItemViewPanel } from '../../../components/Panel/ItemViewPanel';

export const NoteView: VFC<ItemTypeViewProps<'note'>> = ({ vault, revision, ...itemViewProps }) => {
    const { note, name } = revision.data.metadata;

    return (
        <ItemViewPanel type="note" name={name} vault={vault} {...itemViewProps}>
            <pre className="pass-note-view text-break">{note}</pre>
        </ItemViewPanel>
    );
};
