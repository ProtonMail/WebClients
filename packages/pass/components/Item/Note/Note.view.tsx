import { type VFC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import { TextAreaReadonly } from '@proton/pass/components/Form/legacy/TextAreaReadonly';
import type { ItemViewProps } from '@proton/pass/components/Views/types';

import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { useDeobfuscatedValue } from '../../../hooks/useDeobfuscatedValue';
import { ItemViewPanel } from '../../Layout/Panel/ItemViewPanel';

export const NoteView: VFC<ItemViewProps<'note'>> = ({ vault, revision, ...itemViewProps }) => {
    const { name } = revision.data.metadata;
    const note = useDeobfuscatedValue(revision.data.metadata.note);
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
