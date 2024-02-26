import { type FC, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Alert, Icon } from '@proton/components/index';
import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { AliasContent } from '@proton/pass/components/Item/Alias/Alias.content';
import { CreditCardContent } from '@proton/pass/components/Item/CreditCard/CreditCardContent';
import { LoginContent } from '@proton/pass/components/Item/Login/Login.content';
import { NoteContent } from '@proton/pass/components/Item/Note/Note.content';
import { PassButtonGroup } from '@proton/pass/components/Layout/Button/PassButtonGroup';
import { ItemHistoryPanel } from '@proton/pass/components/Layout/Panel/ItemHistoryPanel';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import type { ItemContentProps } from '@proton/pass/components/Views/types';
import { useConfirm } from '@proton/pass/hooks/useConfirm';
import { itemEditIntent } from '@proton/pass/store/actions';
import type { ItemEditIntent, ItemRevision, ItemType } from '@proton/pass/types';
import { getRelativeDateFromTimestamp } from '@proton/pass/utils/time/format';

type Props = {
    previousRevision: ItemRevision;
    currentRevision: ItemRevision;
    onClose: () => void;
};

const itemTypeContentMap: { [T in ItemType]: FC<ItemContentProps<T>> } = {
    login: LoginContent,
    note: NoteContent,
    alias: AliasContent,
    creditCard: CreditCardContent,
};

export const ItemHistoryRestore: FC<Props> = ({ previousRevision, currentRevision, onClose }) => {
    const { selectItem } = useNavigation();
    const dispatch = useDispatch();
    const [selectedRevision, setSelectedRevision] = useState<ItemRevision>(previousRevision);

    const isPreviousRevisionSelected = previousRevision.revision === selectedRevision.revision;

    const handleRestoreClick = useConfirm(
        useCallback(() => {
            if (previousRevision === null) return;

            const { data: item, itemId, shareId } = previousRevision;
            const { revision: lastRevision } = currentRevision;

            const data: ItemEditIntent =
                item.type === 'alias'
                    ? { itemId, shareId, lastRevision, ...item, extraData: undefined }
                    : { itemId, shareId, lastRevision, ...item };

            dispatch(itemEditIntent(data));
            selectItem(currentRevision.shareId, currentRevision.itemId, { mode: 'replace' });
        }, [previousRevision, currentRevision.shareId, currentRevision.itemId])
    );

    const ItemTypeContentComponent = itemTypeContentMap[previousRevision.data.type] as FC<ItemContentProps>;

    return (
        <ItemHistoryPanel
            type={previousRevision.data.type}
            title={
                <div className="flex flex-nowrap items-center gap-4">
                    <Button
                        key="cancel-button"
                        icon
                        pill
                        shape="solid"
                        color="weak"
                        className="shrink-0"
                        onClick={onClose}
                        title={c('Action').t`Close`}
                    >
                        <Icon name="cross" alt={c('Action').t`Close`} />
                    </Button>
                    <h2 className="text-2xl text-bold text-ellipsis mb-0-5">
                        {isPreviousRevisionSelected
                            ? previousRevision.data.metadata.name
                            : currentRevision.data.metadata.name}
                    </h2>
                </div>
            }
            actions={
                isPreviousRevisionSelected
                    ? [
                          <Button
                              key="restore-button"
                              className="text-sm"
                              pill
                              shape="solid"
                              color="weak"
                              onClick={handleRestoreClick.prompt}
                          >
                              <Icon name="clock-rotate-left" className="mr-1" />
                              <span>{c('Action').t`Restore`}</span>
                          </Button>,
                      ]
                    : undefined
            }
            bottom={
                <PassButtonGroup>
                    <Button
                        onClick={() => setSelectedRevision(previousRevision)}
                        selected={isPreviousRevisionSelected}
                        color="norm"
                        fullWidth
                    >
                        {getRelativeDateFromTimestamp(previousRevision.revisionTime)}
                    </Button>
                    <Button
                        onClick={() => setSelectedRevision(currentRevision)}
                        selected={!isPreviousRevisionSelected}
                        color="norm"
                        fullWidth
                    >{c('Info').t`Current version`}</Button>
                </PassButtonGroup>
            }
        >
            <ItemTypeContentComponent revision={selectedRevision} />

            <ConfirmationModal
                open={handleRestoreClick.pending}
                onClose={handleRestoreClick.cancel}
                onSubmit={handleRestoreClick.confirm}
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
