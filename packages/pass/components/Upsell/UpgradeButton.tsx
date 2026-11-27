import type { CSSProperties, FC, MouseEventHandler } from 'react';
import { useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ButtonLikeSize } from '@proton/atoms/Button/ButtonLike';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import PromotionButton from '@proton/components/components/button/PromotionButton/PromotionButton';
import type { PromotionButtonProps } from '@proton/components/components/button/PromotionButton/PromotionButton';
import { IcArrowOutSquare } from '@proton/icons/icons/IcArrowOutSquare';
import { wait } from '@proton/shared/lib/helpers/promise';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { AccountPath, type UpsellRef } from '../../constants';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import { useNavigateToUpgrade } from '../../hooks/useNavigateToUpgrade';
import { selectB2BUpsell } from '../../store/selectors/user';
import { PassFeature } from '../../types/api/features';
import { B2BContactAdminModal } from './B2BContactAdminModal';
import './PassPlusPromotionButton';

type UpgradeButtonProps = PromotionButtonProps<typeof ButtonLike> & {
    buttonSize?: ButtonLikeSize;
    className?: string;
    gradient?: boolean;
    inline?: boolean;
    label?: string;
    onClick?: () => void;
    path?: string;
    plan?: string;
    style?: CSSProperties;
    targetPage?: 'compare';
    upsellRef: UpsellRef;
};

export const UpgradeButton: FC<UpgradeButtonProps> = ({
    buttonSize,
    className,
    iconComponent,
    iconSize,
    gradient = false,
    inline = false,
    label,
    onClick = noop,
    path,
    plan,
    style,
    targetPage,
    upsellRef,
    ...rest
}) => {
    const ButtonComponent = (() => {
        if (inline) return ButtonLike;
        return gradient ? PromotionButton : Button;
    })();

    const buttonProps = inline ? ({ as: 'a', shape: 'underline' } as const) : ({ pill: true, shape: 'solid' } as const);
    const promotionButtonProps = gradient ? { iconComponent, iconSize } : undefined;

    /** When PassNavbarUpgradeToAccount is enabled, upgrade button opens the
     * account upgrade page instead of the signup page. */
    const upgradeToAccount = useFeatureFlag(PassFeature.PassNavbarUpgradeToAccount);
    const b2bUpsell = useSelector(selectB2BUpsell);
    const [contactAdmin, setContactAdmin] = useState(false);

    /** B2B admins compare plans on the account dashboard. The explicit path keeps desktop
     * and the extension off `pass/upgrade`, which only serves free users. */
    const b2bUpgrade =
        b2bUpsell?.admin && !path && !plan
            ? { path: AccountPath.DASHBOARD, plan: b2bUpsell.plan, targetPage: 'compare' as const }
            : {};

    const navigateToUpgrade = useNavigateToUpgrade({
        upsellRef,
        path,
        plan,
        targetPage,
        upgradeToAccount,
        ...b2bUpgrade,
    });

    /** `onClick` may trigger async wrapped code - since `navigateToUpgrade`
     * will close the popup, ensure we execute `navigateToUpgrade` on next tick */
    const handleClick: MouseEventHandler = (evt) => {
        evt.stopPropagation();
        if (b2bUpsell && !b2bUpsell.admin) return setContactAdmin(true);
        onClick?.();
        void wait(0).then(() => navigateToUpgrade());
    };

    return (
        <>
            <ButtonComponent
                className={clsx(
                    'items-center flex-nowrap shrink-0',
                    inline ? 'inline-flex link link-focus align-baseline text-left p-0' : 'flex',
                    gradient && BUILD_TARGET === 'safari' && 'pass-promo-btn--safari-ext',
                    className
                )}
                color="norm"
                onClick={handleClick}
                size={buttonSize}
                style={style}
                {...buttonProps}
                {...promotionButtonProps}
                {...rest}
            >
                {label || c('Action').t`Upgrade`}
                {!gradient && <IcArrowOutSquare className="ml-2" size={iconSize} />}
            </ButtonComponent>
            {contactAdmin && <B2BContactAdminModal open onClose={() => setContactAdmin(false)} />}
        </>
    );
};
