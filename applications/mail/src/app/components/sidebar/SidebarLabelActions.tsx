import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { DropdownMenuButton, Icon, SimpleDropdown, Tooltip } from '@proton/components';
import type { Label } from '@proton/shared/lib/interfaces';

import { useLabelActionsContext } from './EditLabelContext';

interface Props {
    type: 'folder' | 'label';
    element: Label;
    onToggleDropdown: (value: boolean) => void;
}

const SidebarLabelActions = ({ type, element, onToggleDropdown }: Props) => {
    const { editLabel, deleteLabel } = useLabelActionsContext();
    return (
        <span
            // Stop click propagation to avoid Label/Folder selection
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
            // To keep dropdown keyboard interactions working
            onFocus={(e) => {
                e.stopPropagation();
            }}
            className="block"
        >
            <Tooltip title={type === 'folder' ? c('Title').t`Folder options` : c('Title').t`Label options`}>
                <SimpleDropdown
                    as={Button}
                    className="rounded-sm"
                    icon
                    hasCaret={false}
                    shape="ghost"
                    size="small"
                    content={<Icon name="three-dots-horizontal" />}
                    onToggle={onToggleDropdown}
                >
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
            </Tooltip>
        </span>
    );
};

export default SidebarLabelActions;
