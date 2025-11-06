import { useRef } from 'react';

import { c } from 'ttag';

import { DropdownMenu, DropdownMenuButton } from '@proton/components';
import { FeatureCode, useFeature } from '@proton/features';
import { IcCircleSlash } from '@proton/icons/icons/IcCircleSlash';
import { IcThreeDotsHorizontal } from '@proton/icons/icons/IcThreeDotsHorizontal';
import noop from '@proton/utils/noop';

import { useGetElementsFromIDs } from '../../hooks/mailbox/useElements';
import useBlockSender from '../../hooks/useBlockSender';
import type { Element } from '../../models/element';
import ToolbarDropdown from './ToolbarDropdown';

interface Props {
    selectedIDs: string[];
}

const MoreActions = ({ selectedIDs }: Props) => {
    const externalCloseRef = useRef<() => void>(noop);
    const { feature: blockSenderInToolbarFeature } = useFeature(FeatureCode.BlockSenderInToolbar);

    const closeDropdown = () => {
        externalCloseRef.current?.();
    };

    const getElementsFromIDs = useGetElementsFromIDs();
    const { canShowBlockSender, handleClickBlockSender, blockSenderModal } = useBlockSender({
        elements: [...(getElementsFromIDs(selectedIDs) || ({} as Element))],
        onCloseDropdown: closeDropdown,
    });

    const blockSenderMenuButton = (
        <DropdownMenuButton
            className="flex items-center text-left"
            onClick={handleClickBlockSender}
            data-testid="toolbar:block-sender"
            disabled={!canShowBlockSender}
        >
            <IcCircleSlash className="mr-2" />
            {c('Action').t`Block senders`}
        </DropdownMenuButton>
    );

    const dropdownMenuButtons = [blockSenderMenuButton];

    // If there is no sender to block, disable the button
    // If we add more actions in this dropdown, need to update this condition
    const isToolbarButtonDisabled = !canShowBlockSender;

    if (!selectedIDs.length || !blockSenderInToolbarFeature?.Value) {
        return null;
    }

    return (
        <>
            <ToolbarDropdown
                disabled={isToolbarButtonDisabled}
                content={<IcThreeDotsHorizontal className="toolbar-icon" />}
                dropDownClassName="move-dropdown"
                className="move-dropdown-button"
                title={c('Title').t`More actions`}
                data-testid="toolbar:more-actions"
                hasCaret={false}
                externalCloseRef={externalCloseRef}
            >
                {{ render: () => <DropdownMenu>{dropdownMenuButtons.map((button) => button)}</DropdownMenu> }}
            </ToolbarDropdown>
            {blockSenderModal}
        </>
    );
};

export default MoreActions;
