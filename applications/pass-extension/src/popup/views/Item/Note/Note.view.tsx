import { type VFC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';

import { TextAreaReadonly } from '../../../../shared/components/fields/TextAreaReadonly';
import type { ItemTypeViewProps } from '../../../../shared/items/types';
import { ItemViewPanel } from '../../../components/Panel/ItemViewPanel';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';

export const NoteView: VFC<ItemTypeViewProps<'note'>> = ({ vault, revision, ...itemViewProps }) => {
    const { note, name } = revision.data.metadata;
    const copyToClipboard = useCopyToClipboard();

    return (
        <ItemViewPanel
            type="note"
            name={name}
            vault={vault}
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
                              disabled={itemViewProps.optimistic}
                              title={c('Action').t`Copy to clipboard`}
                          >
                              <Icon name="squares" alt={c('Action').t`Copy to clipboard`} size={20} />
                          </Button>,
                      ]
                    : []
            }
            {...itemViewProps}
        >
            <TextAreaReadonly>{note}</TextAreaReadonly>
        </ItemViewPanel>
    );
};
