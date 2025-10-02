import type { Ref } from 'react';

import { c, msgid } from 'ttag';

import { Kbd, Vr } from '@proton/atoms';
import { DropdownSizeUnit, Icon } from '@proton/components';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

import { isConversationMode } from 'proton-mail/helpers/mailSettings';
import { useSelectAll } from 'proton-mail/hooks/useSelectAll';

import { MoveToFolderDropdown, moveDropdownContentProps } from '../actions/MoveToFolderDropdown';
import { MoveToLabelDropdown, labelDropdownContentProps } from '../actions/MoveToLabelDropdown';
import ToolbarDropdown from './ToolbarDropdown';

interface Props {
    labelID: string;
    selectedIDs: string[];
    labelDropdownToggleRef: Ref<() => void>;
    moveDropdownToggleRef: Ref<() => void>;
    onCheckAll?: (check: boolean) => void;
}

const LabelsAndFolders = ({
    labelID,
    selectedIDs,
    labelDropdownToggleRef,
    moveDropdownToggleRef,
    onCheckAll,
}: Props) => {
    const [mailSettings] = useMailSettings();
    const { selectAll } = useSelectAll({ labelID });

    if (!selectedIDs.length) {
        return null;
    }

    const selectedItems = selectedIDs.length;
    const messageTitle = c('Title').ngettext(msgid`Move message to`, `Move messages to`, selectedItems);
    const labelTitle = c('Title').ngettext(msgid`Label message as`, `Label messages as`, selectedItems);

    const titleMove = mailSettings.Shortcuts ? (
        <>
            {messageTitle}
            <br />
            <Kbd shortcut="M" />
        </>
    ) : (
        messageTitle
    );

    const titleLabel = mailSettings.Shortcuts ? (
        <>
            {labelTitle}
            <br />
            <Kbd shortcut="L" />
        </>
    ) : (
        labelTitle
    );

    return (
        <>
            <Vr />
            <ToolbarDropdown
                autoClose={false}
                dropdownSize={{
                    maxHeight: DropdownSizeUnit.Viewport,
                    width: '19rem',
                    maxWidth: '19rem',
                }}
                disabled={!selectedIDs || !selectedIDs.length}
                content={<Icon className="toolbar-icon" name="folder-arrow-in" />}
                dropDownClassName="move-dropdown"
                className="move-dropdown-button"
                title={titleMove}
                data-testid="toolbar:moveto"
                externalToggleRef={moveDropdownToggleRef}
                hasCaret={false}
            >
                {{
                    contentProps: moveDropdownContentProps,
                    render: ({ onClose, onLock }) => (
                        <MoveToFolderDropdown
                            labelID={labelID}
                            selectedIDs={selectedIDs}
                            onClose={onClose}
                            onLock={onLock}
                            isMessage={!isConversationMode(labelID, mailSettings)}
                            selectAll={selectAll}
                            onCheckAll={onCheckAll}
                        />
                    ),
                }}
            </ToolbarDropdown>
            <ToolbarDropdown
                autoClose={false}
                dropdownSize={{
                    maxHeight: DropdownSizeUnit.Viewport,
                    width: '19rem',
                    maxWidth: '19rem',
                }}
                disabled={!selectedIDs || !selectedIDs.length}
                content={<Icon className="toolbar-icon" name="tag" />}
                dropDownClassName="label-dropdown"
                className="label-dropdown-button"
                title={titleLabel}
                data-testid="toolbar:labelas"
                externalToggleRef={labelDropdownToggleRef}
                hasCaret={false}
            >
                {{
                    contentProps: labelDropdownContentProps,
                    render: ({ onClose, onLock }) => (
                        <MoveToLabelDropdown
                            labelID={labelID}
                            selectedIDs={selectedIDs}
                            onClose={onClose}
                            onLock={onLock}
                            selectAll={selectAll}
                            onCheckAll={onCheckAll}
                        />
                    ),
                }}
            </ToolbarDropdown>
        </>
    );
};

export default LabelsAndFolders;
