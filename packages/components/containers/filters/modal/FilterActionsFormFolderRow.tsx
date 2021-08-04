import { Fragment, ChangeEvent } from 'react';
import { c } from 'ttag';
import { buildTreeview, formatFolderName } from '@proton/shared/lib/helpers/folder';
import { Folder, FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';
import { Button, Select, Icon } from '../../../components';
import { useModals } from '../../../hooks';
import { classnames } from '../../../helpers';

import EditLabelModal from '../../labels/modals/EditLabelModal';

import { Actions } from '../interfaces';
import { getDefaultFolders } from '../constants';

interface Props {
    folders: Folder[];
    isNarrow: boolean;
    actions: Actions;
    handleUpdateActions: (onUpdateActions: Partial<Actions>) => void;
}

type ChangePayload = {
    folder?: string;
    isOpen: boolean;
};

type SelectOption = {
    value: string;
    text: string;
    group: string;
    disabled?: boolean;
};

const formatOption = ({ Path, Name }: FolderWithSubFolders, level = 0) => ({
    value: Path || '',
    text: formatFolderName(level, Name, ' • '),
    group: c('Option group').t`Custom folders`,
});

const reducer = (acc: SelectOption[] = [], folder: FolderWithSubFolders, level = 0): SelectOption[] => {
    acc.push(formatOption(folder, level));

    if (Array.isArray(folder.subfolders)) {
        folder.subfolders.forEach((folder) => reducer(acc, folder, level + 1));
    }

    return acc;
};

const FilterActionsFormFolderRow = ({ folders, isNarrow, actions, handleUpdateActions }: Props) => {
    const { createModal } = useModals();
    const treeview = buildTreeview(folders);

    const reducedFolders = treeview.reduce<SelectOption[]>((acc, folder) => {
        return reducer(acc, folder, 0);
    }, []);

    const defaultFolders = getDefaultFolders();
    const options = [...defaultFolders].concat(reducedFolders);

    const { moveTo } = actions;
    const { isOpen } = moveTo;

    const handleChangeModel = (payload: Partial<ChangePayload>) => {
        handleUpdateActions({
            moveTo: {
                ...actions.moveTo,
                ...payload,
            },
        });
    };

    const toggleSection = () => {
        handleChangeModel({ isOpen: !isOpen });
    };

    const handleCreateFolder = async () => {
        const folder: Folder = await new Promise((resolve, reject) => {
            createModal(
                <EditLabelModal onAdd={resolve as () => undefined} onClose={reject as () => undefined} type="folder" />
            );
        });

        handleChangeModel({ folder: folder.Path });
    };

    const renderClosed = () => {
        if (!moveTo?.folder) {
            return <em className={classnames(['pt0-5', 'color-weak'])}>{c('Info').t`No folder selected`}</em>;
        }

        let selectedFolder;

        if (['archive', 'inbox', 'spam', 'trash'].includes(moveTo?.folder)) {
            selectedFolder = (
                <span className="inline-flex flex-align-items-center mr2">
                    <Icon name={moveTo?.folder} className="mr0-5" />
                    {options.find((o) => o.value === moveTo?.folder)?.text}
                </span>
            );
        } else {
            selectedFolder = moveTo?.folder.split('/').map((f: string, i: number) => (
                <Fragment key={f}>
                    {i !== 0 && (
                        <Icon
                            name="caret"
                            className="ml0-5"
                            style={{
                                transform: 'rotate(-90deg)',
                            }}
                        />
                    )}
                    <span
                        className={classnames([
                            'max-w100 flex-nowrap inline-flex flex-align-items-center',
                            i !== 0 && 'ml0-5',
                        ])}
                    >
                        <Icon name="folder" className="mr0-5" />
                        <span className="text-ellipsis" title={f}>
                            {f}
                        </span>
                    </span>
                </Fragment>
            ));
        }

        return <div className="pt0-5 flex flex-align-items-center max-w100">{selectedFolder}</div>;
    };

    return (
        <div className="border-bottom flex flex-nowrap on-mobile-flex-column align-items-center pt1 pb1">
            <button type="button" className={classnames(['w20 text-left', isNarrow && 'mb1'])} onClick={toggleSection}>
                <Icon name="caret" className={classnames([isOpen && 'rotateX-180'])} />
                <span className={classnames(['ml0-5', actions.error && 'color-danger'])}>{c('Label').t`Move to`}</span>
            </button>
            <div className={classnames(['flex flex-column flex-item-fluid', !isNarrow && 'ml1'])}>
                {isOpen ? (
                    <div className="w100">
                        <Select
                            id="memberSelect"
                            value={moveTo.folder || ''}
                            options={options}
                            onChange={({ target: { value } }: ChangeEvent<HTMLSelectElement>) =>
                                handleChangeModel({ folder: value })
                            }
                        />
                        <Button shape="outline" className="mt1" onClick={handleCreateFolder}>
                            {c('Action').t`Create folder`}
                        </Button>
                    </div>
                ) : (
                    renderClosed()
                )}
            </div>
        </div>
    );
};

export default FilterActionsFormFolderRow;
