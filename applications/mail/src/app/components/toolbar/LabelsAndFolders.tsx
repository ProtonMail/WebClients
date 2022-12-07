import { Ref } from 'react';

import { c } from 'ttag';

import { Kbd, Vr } from '@proton/atoms';
import { DropdownSizeUnit, Icon, useMailSettings } from '@proton/components';

import { Breakpoints } from '../../models/utils';
import LabelDropdown, { labelDropdownContentProps } from '../dropdown/LabelDropdown';
import MoveDropdown, { moveDropdownContentProps } from '../dropdown/MoveDropdown';
import ToolbarDropdown from './ToolbarDropdown';

interface Props {
    labelID: string;
    selectedIDs: string[];
    breakpoints: Breakpoints;
    labelDropdownToggleRef: Ref<() => void>;
    moveDropdownToggleRef: Ref<() => void>;
}

const LabelsAndFolders = ({
    labelID,
    selectedIDs,
    breakpoints,
    labelDropdownToggleRef,
    moveDropdownToggleRef,
}: Props) => {
    const [{ Shortcuts = 0 } = {}] = useMailSettings();

    if (!selectedIDs.length) {
        return null;
    }

    const titleMove = Shortcuts ? (
        <>
            {c('Title').t`Move to`}
            <br />
            <Kbd shortcut="M" />
        </>
    ) : (
        c('Title').t`Move to`
    );

    const titleLabel = Shortcuts ? (
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
                dropdownSize={{ maxWidth: DropdownSizeUnit.Viewport, maxHeight: DropdownSizeUnit.Viewport }}
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
                            breakpoints={breakpoints}
                        />
                    ),
                }}
            </ToolbarDropdown>
            <ToolbarDropdown
                autoClose={false}
                dropdownSize={{ maxWidth: DropdownSizeUnit.Viewport, maxHeight: DropdownSizeUnit.Viewport }}
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
                            breakpoints={breakpoints}
                        />
                    ),
                }}
            </ToolbarDropdown>
        </>
    );
};

export default LabelsAndFolders;
