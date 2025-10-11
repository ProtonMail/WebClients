import { type FC, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, useParams } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Alert from '@proton/components/components/alert/Alert';
import Icon from '@proton/components/components/icon/Icon';
import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { FileAttachment } from '@proton/pass/components/FileAttachments/FileAttachment';
import { FileAttachmentsView } from '@proton/pass/components/FileAttachments/FileAttachmentsView';
import { AliasContent } from '@proton/pass/components/Item/Alias/Alias.content';
import { CreditCardContent } from '@proton/pass/components/Item/CreditCard/CreditCard.content';
import { IdentityContent } from '@proton/pass/components/Item/Identity/Identity.content';
import { LoginContent } from '@proton/pass/components/Item/Login/Login.content';
import { NoteContent } from '@proton/pass/components/Item/Note/Note.content';
import { ButtonBar } from '@proton/pass/components/Layout/Button/ButtonBar';
import { ItemHistoryPanel } from '@proton/pass/components/Layout/Panel/ItemHistoryPanel';
import { useSelectItem } from '@proton/pass/components/Navigation/NavigationActions';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { getItemHistoryRoute } from '@proton/pass/components/Navigation/routing';
import type { ItemContentProps } from '@proton/pass/components/Views/types';
import { useFileRevision } from '@proton/pass/hooks/files/useFileRevision';
import { useConfirm } from '@proton/pass/hooks/useConfirm';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { isShareWritable } from '@proton/pass/lib/shares/share.predicates';
import { itemEdit } from '@proton/pass/store/actions';
import { selectShare } from '@proton/pass/store/selectors';
import { selectItemFilesForRevision } from '@proton/pass/store/selectors/files';
import type { ItemEditIntent, ItemRevision, ItemType } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { epochToRelativeDaysAgo } from '@proton/pass/utils/time/format';

import { CustomContent } from '../Custom/Custom.content';
import { useItemHistory } from './ItemHistoryContext';

const itemTypeContentMap: { [T in ItemType]: FC<ItemContentProps<T>> } = {
    login: LoginContent,
    note: NoteContent,
    alias: AliasContent,
    creditCard: CreditCardContent,
    identity: IdentityContent,
    sshKey: CustomContent,
    wifi: CustomContent,
    custom: CustomContent,
};

export const RevisionDiff: FC = () => {
    const scope = useItemScope();
    const selectItem = useSelectItem();
    const dispatch = useDispatch();
    const params = useParams<{ revision: string }>();

    const { item: latestItem, revisions } = useItemHistory();
    const { shareId, itemId } = latestItem;
    const share = useSelector(selectShare(shareId));
    const canRestore = share && isShareWritable(share);

    const latest = latestItem.revision;
    const previous = parseInt(params.revision, 10);
    const [selected, setSelected] = useState<number>(previous);

    const previousItem = useMemo(() => revisions.find((item) => item.revision === previous), [revisions, previous]);
    const selectedItem = (selected === latest ? latestItem : previousItem) ?? latestItem;

    const latestFiles = useMemoSelector(selectItemFilesForRevision, [shareId, itemId, latest]);
    const latestFileUUIDs = useMemo(() => new Set(latestFiles.map(prop('fileUID'))), [latestFiles]);

    const { files, getFilesToRestore, restoreFile, restoring } = useFileRevision({
        shareId,
        itemId,
        revision: selectedItem.revision,
    });

    const restore = useConfirm(({ data: item, itemId, shareId }: ItemRevision) => {
        const baseItem = { itemId, shareId, lastRevision: latest, files: getFilesToRestore() };
        const editIntent: ItemEditIntent =
            item.type === 'alias' ? { ...item, ...baseItem, extraData: null } : { ...item, ...baseItem };

        dispatch(itemEdit.intent(editIntent));
        selectItem(shareId, itemId, { mode: 'replace', scope });
    });

    if (!(Number.isFinite(previous) && selectedItem && previousItem)) {
        return <Redirect to={getItemHistoryRoute(shareId, itemId, { scope })} push={false} />;
    }

    const { type, metadata } = selectedItem.data;
    const { name } = metadata;
    const Content = itemTypeContentMap[type] as FC<ItemContentProps>;

    return (
        <ItemHistoryPanel
            type={latestItem.data.type}
            title={
                <div className="flex flex-nowrap items-center gap-4">
                    <Button
                        key="cancel-button"
                        icon
                        pill
                        shape="solid"
                        color="weak"
                        className="shrink-0"
                        onClick={() => selectItem(shareId, itemId, { view: 'history', scope })}
                        title={c('Action').t`Back`}
                    >
                        <Icon name="chevron-left" alt={c('Action').t`Back`} />
                    </Button>
                    <h2 className="text-2xl text-bold text-ellipsis mb-0-5">{name}</h2>
                </div>
            }
            actions={
                selected === previous
                    ? [
                          <Button
                              key="restore-button"
                              className="text-sm"
                              pill
                              shape="solid"
                              color="weak"
                              disabled={!canRestore}
                              onClick={() => restore.prompt(previousItem)}
                          >
                              <Icon name="clock-rotate-left" className="mr-1" />
                              <span>{c('Action').t`Restore`}</span>
                          </Button>,
                      ]
                    : undefined
            }
            footer={
                <ButtonBar className="text-semibold text-sm md:text-rg">
                    <Button onClick={() => setSelected(previous)} selected={selected === previous} fullWidth>
                        {epochToRelativeDaysAgo(previousItem.revisionTime)}
                    </Button>
                    <Button onClick={() => setSelected(latest)} selected={selected === latest} fullWidth>{c('Info')
                        .t`Current version`}</Button>
                </ButtonBar>
            }
        >
            <Content revision={selectedItem} viewingHistory={true} />

            {files.length > 0 && (
                <FileAttachmentsView filesCount={files.length}>
                    {files.map((file) => (
                        <FileAttachment
                            key={file.fileUID}
                            file={file}
                            loading={restoring.has(file.fileID)}
                            disabled={selected === latest || !file.revisionRemoved || latestFileUUIDs.has(file.fileUID)}
                            onRestore={
                                canRestore ? () => restoreFile({ shareId, itemId, fileId: file.fileID }) : undefined
                            }
                        />
                    ))}
                </FileAttachmentsView>
            )}

            <ConfirmationModal
                open={restore.pending}
                onClose={restore.cancel}
                onSubmit={restore.confirm}
                submitText={c('Action').t`Restore`}
                title={c('Title').t`Restore this version?`}
            >
                <Alert className="mb-4" type="info">
                    {c('Info').t`This version will be added to the history as the newest version.`}
                </Alert>
            </ConfirmationModal>
        </ItemHistoryPanel>
    );
};
