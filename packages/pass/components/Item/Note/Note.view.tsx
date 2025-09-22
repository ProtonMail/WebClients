import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import { FileAttachmentsContentView } from '@proton/pass/components/FileAttachments/FileAttachmentsView';
import { ItemHistoryStats } from '@proton/pass/components/Item/History/ItemHistoryStats';
import { NoteContent } from '@proton/pass/components/Item/Note/Note.content';
import { ItemViewPanel } from '@proton/pass/components/Layout/Panel/ItemViewPanel';
import { SecureLinkCardList } from '@proton/pass/components/SecureLink/SecureLinkCardList';
import { useCopyToClipboard } from '@proton/pass/components/Settings/Clipboard/ClipboardProvider';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import { useDeobfuscatedValue } from '@proton/pass/hooks/useDeobfuscatedValue';

export const NoteView: FC<ItemViewProps<'note'>> = (itemViewProps) => {
    const { revision, handleHistoryClick } = itemViewProps;
    const { shareId, itemId, modifyTime, createTime } = revision;
    const note = useDeobfuscatedValue(revision.data.metadata.note);

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
                              disabled={revision.optimistic}
                              title={c('Action').t`Copy to clipboard`}
                          >
                              <Icon name="squares" alt={c('Action').t`Copy to clipboard`} size={5} />
                          </Button>,
                      ]
                    : []
            }
            {...itemViewProps}
        >
            <SecureLinkCardList shareId={shareId} itemId={itemId} />
            <NoteContent revision={revision} />
            <FileAttachmentsContentView revision={revision} />
            <ItemHistoryStats createTime={createTime} modifyTime={modifyTime} handleHistoryClick={handleHistoryClick} />
        </ItemViewPanel>
    );
};
