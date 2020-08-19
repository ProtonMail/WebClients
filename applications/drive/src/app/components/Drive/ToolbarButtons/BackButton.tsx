import React from 'react';
import { c } from 'ttag';

import { ToolbarButton } from 'react-components';

import useNavigate from '../../../hooks/drive/useNavigate';
import { LinkType } from '../../../interfaces/link';

interface Props {
    shareId: string;
    parentLinkId?: string;
    disabled?: boolean;
}

const BackButton = ({ shareId, parentLinkId, disabled }: Props) => {
    const { navigateToLink } = useNavigate();
    const handleBackClick = () => {
        if (parentLinkId) {
            navigateToLink(shareId, parentLinkId, LinkType.FOLDER);
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
