import type { Ref } from 'react';

import { c } from 'ttag';

import { Kbd, Vr } from '@proton/atoms';
import { DropdownSizeUnit, Icon } from '@proton/components';

import { isConversationMode } from 'proton-mail/helpers/mailSettings';
import useMailModel from 'proton-mail/hooks/useMailModel';
import { useSelectAll } from 'proton-mail/hooks/useSelectAll';

import LabelDropdown, { labelDropdownContentProps } from '../dropdown/LabelDropdown';
import MoveDropdown, { moveDropdownContentProps } from '../dropdown/MoveDropdown';
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
    const mailSettings = useMailModel('MailSettings');
    const { selectAll } = useSelectAll({ labelID });

    if (!selectedIDs.length) {
        return null;
    }

    const titleMove = mailSettings.Shortcuts ? (
        <>
            {c('Title').t`Move to`}
            <br />
            <Kbd shortcut="M" />
        </>
    ) : (
        c('Title').t`Move to`
    );

    const titleLabel = mailSettings.Shortcuts ? (
        <>
            {c('Title').t`Label as`}
            <br />
            <Kbd shortcut="L" />
        </>
    ) : (
        c('Title').t`Label as`
    );

    return (
        <>
            <Vr />
            <ToolbarDropdown
                autoClose={false}
                dropdownSize={{ maxWidth: '22em', maxHeight: DropdownSizeUnit.Viewport }}
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
                        <MoveDropdown
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
                dropdownSize={{ maxWidth: '22em', maxHeight: DropdownSizeUnit.Viewport }}
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
                        <LabelDropdown
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
