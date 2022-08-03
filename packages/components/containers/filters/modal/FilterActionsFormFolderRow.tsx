import { Fragment } from 'react';

import { c } from 'ttag';

import { buildTreeview, formatFolderName } from '@proton/shared/lib/helpers/folder';
import { Folder, FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';

import { Button, Icon, IconName, InputFieldTwo, Option, SelectTwo, useModalState } from '../../../components';
import { classnames } from '../../../helpers';
import EditLabelModal, { LabelModel } from '../../labels/modals/EditLabelModal';
import { getDefaultFolderOptions, noFolderOption, noFolderValue } from '../constants';
import { Actions } from '../interfaces';

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

export type SelectOption = {
    type: 'label' | 'option';
    value?: string;
    text: string;
    disabled?: boolean;
};

const formatOption = ({ Path, Name }: FolderWithSubFolders, level = 0) =>
    ({
        type: 'option',
        value: Path || '',
        text: formatFolderName(level, Name, ' • '),
    } as SelectOption);

const reducer = (acc: SelectOption[] = [], folder: FolderWithSubFolders, level = 0): SelectOption[] => {
    acc.push(formatOption(folder, level));

    if (Array.isArray(folder.subfolders)) {
        folder.subfolders.forEach((folder) => reducer(acc, folder, level + 1));
    }

    return acc;
};

const FilterActionsFormFolderRow = ({ folders, isNarrow, actions, handleUpdateActions }: Props) => {
    const treeview = buildTreeview(folders);

    const reducedFolders = treeview.reduce<SelectOption[]>((acc, folder) => {
        return reducer(acc, folder, 0);
    }, []);

    const defaultFolders = getDefaultFolderOptions();
    const options = [noFolderOption, ...defaultFolders].concat([
        { type: 'label', text: c('Option group').t`Custom folders` },
        ...reducedFolders,
    ]);

    const { moveTo } = actions;
    const { isOpen } = moveTo;

    const [editLabelProps, setEditLabelModalOpen] = useModalState();

    const folderOptions = options.map((option) => {
        const { type, text, value, disabled } = option;
        if (type === 'label') {
            return (
                <label className="text-semibold px0-5 py0-25 block" key={text}>
                    {text}
                </label>
            );
        }

        return <Option value={value} title={text} key={value} disabled={disabled} />;
    });

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

    const handleCreateFolder = (folder: LabelModel) => {
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
                    <Icon name={moveTo.folder as IconName} className="mr0-5" />
                    {options.find((o) => o.value === moveTo?.folder)?.text}
                </span>
            );
        } else {
            selectedFolder = moveTo?.folder.split('/').map((f: string, i: number) => (
                <Fragment key={f}>
                    {i !== 0 && (
                        <Icon
                            name="chevron-down"
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
        <div
            className="border-bottom flex flex-nowrap on-mobile-flex-column align-items-center pt1 pb1"
            data-testid="filter-modal:folder-row"
        >
            <button type="button" className={classnames(['w20 text-left', isNarrow && 'mb1'])} onClick={toggleSection}>
                <Icon name="chevron-down" className={classnames([isOpen && 'rotateX-180'])} />
                <span className={classnames(['ml0-5', actions.error && 'color-danger'])}>{c('Label').t`Move to`}</span>
            </button>
            <div className={classnames(['flex flex-column flex-item-fluid', !isNarrow && 'ml1'])}>
                {isOpen ? (
                    <div className="w100">
                        <InputFieldTwo
                            as={SelectTwo}
                            id="memberSelect"
                            value={moveTo.folder || noFolderValue}
                            onValue={(value: any) => handleChangeModel({ folder: value })}
                        >
                            {folderOptions}
                        </InputFieldTwo>
                        <Button shape="outline" className="mt1" onClick={() => setEditLabelModalOpen(true)}>
                            {c('Action').t`Create folder`}
                        </Button>
                        <EditLabelModal {...editLabelProps} onAdd={handleCreateFolder} type="folder" />
                    </div>
                ) : (
                    renderClosed()
                )}
            </div>
        </div>
    );
};

export default FilterActionsFormFolderRow;
