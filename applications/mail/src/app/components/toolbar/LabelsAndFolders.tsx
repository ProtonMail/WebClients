import { Ref } from 'react';
import { c } from 'ttag';
import { Icon, useMailSettings } from '@proton/components';
import { Vr } from '@proton/atoms';
import ToolbarDropdown from './ToolbarDropdown';
import MoveDropdown from '../dropdown/MoveDropdown';
import LabelDropdown from '../dropdown/LabelDropdown';
import { Breakpoints } from '../../models/utils';

interface Props {
    labelID: string;
    selectedIDs: string[];
    conversationMode: boolean;
    breakpoints: Breakpoints;
    labelDropdownToggleRef: Ref<() => void>;
    moveDropdownToggleRef: Ref<() => void>;
    onBack: () => void;
}

const LabelsAndFolders = ({
    labelID,
    selectedIDs,
    conversationMode,
    breakpoints,
    labelDropdownToggleRef,
    moveDropdownToggleRef,
    onBack,
}: Props) => {
    const [{ Shortcuts = 0 } = {}] = useMailSettings();

    if (!selectedIDs.length) {
        return null;
    }

    const titleMove = Shortcuts ? (
        <>
            {c('Title').t`Move to`}
            <br />
            <kbd className="border-none">M</kbd>
        </>
    ) : (
        c('Title').t`Move to`
    );

    const titleLabel = Shortcuts ? (
        <>
            {c('Title').t`Label as`}
            <br />
            <kbd className="border-none">L</kbd>
        </>
    ) : (
        c('Title').t`Label as`
    );

    return (
        <>
            <Vr />
            <ToolbarDropdown
                autoClose={false}
                noMaxSize
                disabled={!selectedIDs || !selectedIDs.length}
                content={<Icon className="toolbar-icon" name="folder-arrow-in" />}
                dropDownClassName="move-dropdown"
                className="move-dropdown-button"
                title={titleMove}
                data-testid="toolbar:moveto"
                externalToggleRef={moveDropdownToggleRef}
                hasCaret={false}
            >
                {({ onClose, onLock }) => (
                    <MoveDropdown
                        labelID={labelID}
                        selectedIDs={selectedIDs}
                        conversationMode={conversationMode}
                        onClose={onClose}
                        onLock={onLock}
                        onBack={onBack}
                        breakpoints={breakpoints}
                    />
                )}
            </ToolbarDropdown>
            <ToolbarDropdown
                autoClose={false}
                noMaxSize
                disabled={!selectedIDs || !selectedIDs.length}
                content={<Icon className="toolbar-icon" name="tag" />}
                dropDownClassName="label-dropdown"
                className="label-dropdown-button"
                title={titleLabel}
                data-testid="toolbar:labelas"
                externalToggleRef={labelDropdownToggleRef}
                hasCaret={false}
            >
                {({ onClose, onLock }) => (
                    <LabelDropdown
                        labelID={labelID}
                        selectedIDs={selectedIDs}
                        onClose={onClose}
                        onLock={onLock}
                        breakpoints={breakpoints}
                    />
                )}
            </ToolbarDropdown>
        </>
    );
};

export default LabelsAndFolders;
