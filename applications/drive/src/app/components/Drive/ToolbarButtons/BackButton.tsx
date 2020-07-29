import React from 'react';
import { c } from 'ttag';

import { ToolbarButton } from 'react-components';

import { LinkType } from '../../../interfaces/link';

interface Props {
    shareId: string;
    parentLinkId?: string;
    disabled?: boolean;
    openLink: (shareId: string, linkId: string, type: LinkType) => void;
}

const BackButton = ({ shareId, parentLinkId, disabled, openLink }: Props) => {
    const handleBackClick = () => {
        if (parentLinkId) {
            openLink(shareId, parentLinkId, LinkType.FOLDER);
        }
    };

    return (
        <ToolbarButton
            disabled={disabled}
            title={c('Action').t`Back`}
            onClick={handleBackClick}
            icon="arrow-left"
            data-testid="toolbar-back"
        />
    );
};

export default BackButton;
