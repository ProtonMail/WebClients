import { type VFC } from 'react';

import { c } from 'ttag';

import type { ButtonLikeShape } from '@proton/atoms';
import { Button } from '@proton/atoms';
import { Icon, InlineLinkButton } from '@proton/components/components';
import browser from '@proton/pass/globals/browser';
import clsx from '@proton/utils/clsx';

import { SSO_URL } from '../../../app/config';

const UPGRADE_PLAN_PATH = `${SSO_URL}/pass/upgrade`;

type UpgradeButtonProps = { inline?: boolean };

export const navigateToUpgrade = () => browser.tabs.create({ url: UPGRADE_PLAN_PATH });

export const UpgradeButton: VFC<UpgradeButtonProps> = ({ inline = false }) => {
    const ButtonComponent = inline ? InlineLinkButton : Button;

    const buttonProps = {
        pill: true,
        shape: 'solid' as ButtonLikeShape,
    };

    return (
        <ButtonComponent
            className={clsx('flex flex-align-items-center', !inline && 'text-sm')}
            color="norm"
            onClick={navigateToUpgrade}
            {...(!inline && buttonProps)}
        >
            {c('Action').t`Upgrade`}
            <Icon name="arrow-out-square" className="ml-3" />
        </ButtonComponent>
    );
};
