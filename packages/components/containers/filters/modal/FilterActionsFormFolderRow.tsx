import { Fragment } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon, { type IconName } from '@proton/components/components/icon/Icon';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Option from '@proton/components/components/option/Option';
import SearchableSelect from '@proton/components/components/selectTwo/SearchableSelect';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import { useUser } from '@proton/components/hooks';
import { buildTreeview, formatFolderName, hasReachedFolderLimit } from '@proton/shared/lib/helpers/folder';
import type { Folder, FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';
import clsx from '@proton/utils/clsx';

import type { LabelModel } from '../../labels/modals/EditLabelModal';
import EditLabelModal from '../../labels/modals/EditLabelModal';
import { getDefaultFolderOptions, noFolderOption, noFolderValue } from '../constants';
import type { Actions } from '../interfaces';

interface Props {
    folders: Folder[];
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
    }) as SelectOption;

const reducer = (acc: SelectOption[] = [], folder: FolderWithSubFolders, level = 0): SelectOption[] => {
    acc.push(formatOption(folder, level));

    if (Array.isArray(folder.subfolders)) {
        folder.subfolders.forEach((folder) => reducer(acc, folder, level + 1));
    }

    return acc;
};

const FilterActionsFormFolderRow = ({ folders, actions, handleUpdateActions }: Props) => {
    const [user] = useUser();
    const treeview = buildTreeview(folders);

    const canCreateLabel = !hasReachedFolderLimit(user, folders);

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

    const [editLabelProps, setEditLabelModalOpen, renderEditLabelModal] = useModalState();

    const folderOptions = options.map((option) => {
        const { type, text, value, disabled } = option;
        if (type === 'label') {
            return (
                <label className="text-semibold px-2 py-1 block" key={text}>
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
            return <em className="color-weak">{c('Info').t`No folder selected`}</em>;
        }

        let selectedFolder;

        if (['archive', 'inbox', 'spam', 'trash'].includes(moveTo?.folder)) {
            selectedFolder = (
                <span className="inline-flex items-center mr-8">
                    <Icon name={moveTo.folder as IconName} className="mr-2" />
                    {options.find((o) => o.value === moveTo?.folder)?.text}
                </span>
            );
        } else {
            selectedFolder = moveTo?.folder.split('/').map((f: string, i: number) => (
                <Fragment key={f}>
                    {i !== 0 && (
                        <Icon
                            name="chevron-down"
                            className="ml-2"
                            style={{
                                transform: 'rotate(-90deg)',
                            }}
                        />
                    )}
                    <span className={clsx(['max-w-full flex-nowrap inline-flex items-center', i !== 0 && 'ml-2'])}>
                        <Icon name="folder" className="mr-2" />
                        <span className="text-ellipsis" title={f}>
                            {f}
                        </span>
                    </span>
                </Fragment>
            ));
        }

        return <div className="flex items-center max-w-full">{selectedFolder}</div>;
    };

    return (
        <div
            className="border-bottom flex flex-column md:flex-row flex-nowrap align-items-center py-4 gap-4"
            data-testid="filter-modal:folder-row"
        >
            <button type="button" className="w-full md:w-1/4 text-left" onClick={toggleSection}>
                <Icon name="chevron-down" className={clsx([isOpen && 'rotateX-180'])} />
                <span className={clsx(['ml-2', actions.error && 'color-danger'])}>{c('Label').t`Move to`}</span>
            </button>
            <div className="flex flex-column flex-nowrap w-full">
                {isOpen ? (
                    <div className="w-full">
                        <InputFieldTwo
                            as={SearchableSelect<string>}
                            id="move-to-select"
                            value={moveTo.folder || noFolderValue}
                            onChange={({ value }: any) => {
                                handleChangeModel({ folder: value });
                            }}
                        >
                            {folderOptions}
                        </InputFieldTwo>
                        {canCreateLabel && (
                            <Button shape="outline" onClick={() => setEditLabelModalOpen(true)}>
                                {c('Action').t`Create folder`}
                            </Button>
                        )}
                        {renderEditLabelModal && (
                            <EditLabelModal {...editLabelProps} onAdd={handleCreateFolder} type="folder" />
                        )}
                    </div>
                ) : (
                    renderClosed()
                )}
            </div>
        </div>
    );
};

export default FilterActionsFormFolderRow;
