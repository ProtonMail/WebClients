import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { DropdownMenuButton, LabelsUpsellModal, SimpleDropdown, useModalState } from '@proton/components';
import { IcThreeDotsHorizontal } from '@proton/icons';
import { MAIL_UPSELL_PATHS, MAX_FOLDER_NESTING_LEVEL } from '@proton/shared/lib/constants';
import type { Folder, Label } from '@proton/shared/lib/interfaces';

import CreateFolderButton from './CreateFolderButton';
import { useLabelActionsContext } from './EditLabelContext';

interface Props {
    type: 'folder' | 'label';
    level?: number;
    folders?: Folder[];
    element: Label;
    onToggleDropdown: (value: boolean) => void;
}

const SidebarLabelActions = ({ type, level, folders, element, onToggleDropdown }: Props) => {
    const { editLabel, deleteLabel } = useLabelActionsContext();
    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    const showCreateFolder =
        type === 'folder' && level !== undefined && folders?.length && level < MAX_FOLDER_NESTING_LEVEL;

    return (
        <>
            <span
                title={type === 'folder' ? c('Title').t`Folder options` : c('Title').t`Label options`}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                onFocus={(e) => {
                    e.stopPropagation();
                }}
                className="block"
            >
                <SimpleDropdown
                    as={Button}
                    className="rounded-sm"
                    icon
                    hasCaret={false}
                    shape="ghost"
                    size="small"
                    content={
                        <IcThreeDotsHorizontal alt={type === 'folder' ? c('Title').t`Folder options` : c('Title').t`Label options`} />
                    }
                    onToggle={onToggleDropdown}
                >
                    {showCreateFolder && (
                        <CreateFolderButton
                            folders={folders}
                            parentFolderId={element.ID}
                            onShowUpsellModal={() => handleUpsellModalDisplay(true)}
                        />
                    )}
                    <DropdownMenuButton
                        className="text-left"
                        onClick={() => {
                            editLabel(type, element);
                        }}
                    >
                        {type === 'folder' ? c('Action').t`Edit folder` : c('Action').t`Edit label`}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        className="text-left color-danger"
                        onClick={() => {
                            deleteLabel(type, element);
                        }}
                    >
                        {type === 'folder' ? c('Action').t`Delete folder` : c('Action').t`Delete label`}
                    </DropdownMenuButton>
                </SimpleDropdown>
            </span>
            {renderUpsellModal && (
                <LabelsUpsellModal modalProps={upsellModalProps} feature={MAIL_UPSELL_PATHS.UNLIMITED_FOLDERS} />
            )}
        </>
    );
};

export default SidebarLabelActions;
