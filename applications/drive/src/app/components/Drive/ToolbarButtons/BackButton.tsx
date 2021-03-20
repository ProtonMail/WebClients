import React from 'react';
import { c } from 'ttag';

import { Icon, ToolbarButton } from 'react-components';

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
            data-testid="toolbar-back"
            icon={<Icon name="arrow-left" />}
        />
    );
};

export default BackButton;
