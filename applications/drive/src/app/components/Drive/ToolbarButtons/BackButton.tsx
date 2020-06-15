import React from 'react';
import { c } from 'ttag';

import { ToolbarButton } from 'react-components';

import { LinkType } from '../../../interfaces/link';

interface Props {
    shareId: string;
    parentLinkId: string;
    disabled?: boolean;
    className?: string;
    openLink: (shareId: string, linkId: string, type: LinkType) => void;
}

const BackButton = ({ shareId, parentLinkId, disabled, className, openLink }: Props) => {
    const handleBackClick = () => {
        openLink(shareId, parentLinkId, LinkType.FOLDER);
    };

    return (
        <ToolbarButton
            disabled={disabled}
            className={className}
            title={c('Action').t`Back`}
            onClick={handleBackClick}
            icon="arrow-left"
        />
    );
};

export default BackButton;
