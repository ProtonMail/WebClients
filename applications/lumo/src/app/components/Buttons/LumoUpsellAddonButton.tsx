import { memo } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { SettingsLink } from '@proton/components/index';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LUMO_PLUS_UPGRADE_PATH, LUMO_UPGRADE_TRIGGER_CLASS } from '../../constants';

type UpsellAddonButtonType = 'button' | 'link';

// const DEFAULT_PATH = '/dashboard?addon=lumo';
const DEFAULT_TEXT = c('collider_2025: Link').t`Add ${LUMO_SHORT_APP_NAME} Plus`;

interface Props {
    className?: string;
    type?: UpsellAddonButtonType;
    children?: React.ReactNode;
    customButtonProps?: Record<string, any>;
}

const LumoUpsellAddonButton = memo(({ className = '', type = 'link', children, customButtonProps }: Props) => {
    const content = children || DEFAULT_TEXT;

    if (type === 'button') {
        return (
            <ButtonLike
                as={SettingsLink}
                className={clsx(`flex-shrink-0 ${className} upsell-addon-button`, LUMO_UPGRADE_TRIGGER_CLASS)}
                path={LUMO_PLUS_UPGRADE_PATH}
                {...customButtonProps}
            >
                {content}
            </ButtonLike>
        );
    }

    return (
        <SettingsLink
            path={LUMO_PLUS_UPGRADE_PATH}
            className={clsx(`lumo-addon-button link inline-block`, className, LUMO_UPGRADE_TRIGGER_CLASS)}
        >
            {content}
        </SettingsLink>
    );
});

export default LumoUpsellAddonButton;
