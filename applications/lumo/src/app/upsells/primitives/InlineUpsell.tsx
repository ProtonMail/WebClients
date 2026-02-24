import React from 'react';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { SettingsLink } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { LUMO_UPGRADE_TRIGGER_CLASS } from '../../constants';

interface InlineUpsellProps {
    path?: string;
    onUpgrade?: () => void;
    callToActionText: string;
    className?: string;
}

const InlineUpsell = ({ path, onUpgrade, callToActionText, className }: InlineUpsellProps) => {
    if (path) {
        return (
            <SettingsLink
                path={path}
                className={clsx('lumo-addon-button link inline-block', LUMO_UPGRADE_TRIGGER_CLASS, className)}
            >
                {callToActionText}
            </SettingsLink>
        );
    }
    return (
        <InlineLinkButton onClick={onUpgrade} className={clsx(LUMO_UPGRADE_TRIGGER_CLASS, className)}>
            {callToActionText}
        </InlineLinkButton>
    );
};

export default InlineUpsell;
