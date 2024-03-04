import { type FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import { NoteContent } from '@proton/pass/components/Item/Note/Note.content';
import type { ItemViewProps } from '@proton/pass/components/Views/types';

import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { useDeobfuscatedValue } from '../../../hooks/useDeobfuscatedValue';
import { ItemViewPanel } from '../../Layout/Panel/ItemViewPanel';

export const NoteView: FC<ItemViewProps<'note'>> = (itemViewProps) => {
    const note = useDeobfuscatedValue(itemViewProps.revision.data.metadata.note);
    const copyToClipboard = useCopyToClipboard();

    return (
        <ItemViewPanel
            type="note"
            actions={
                Boolean(note.length)
                    ? [
                          <Button
                              icon
                              pill
                              color="weak"
                              key="copy-to-clipboard-button"
                              shape="solid"
                              size="medium"
                              onClick={() => copyToClipboard(note)}
                              disabled={itemViewProps.revision.optimistic}
                              title={c('Action').t`Copy to clipboard`}
                          >
                              <Icon name="squares" alt={c('Action').t`Copy to clipboard`} size={5} />
                          </Button>,
                      ]
                    : []
            }
            {...itemViewProps}
        >
            <NoteContent revision={itemViewProps.revision} />
        </ItemViewPanel>
    );
};
