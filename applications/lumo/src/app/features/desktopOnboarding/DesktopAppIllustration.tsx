import type { ReactNode } from 'react';

import { c } from 'ttag';

import MailLogo from '@proton/components/components/logo/MailLogo';
import { LUMO_SHORT_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import lumoCatIcon from '@proton/styles/assets/img/lumo/lumo-cat-icon.svg';
import clsx from '@proton/utils/clsx';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';

interface ChipProps {
    icon: ReactNode;
    children: ReactNode;
    className: string;
}

const Chip = ({ icon, children, className }: ChipProps) => {
    return (
        <div
            className={clsx(
                'desktop-app-illustration-chip pl-2.5 pr-3 absolute flex flex-nowrap items-center gap-1.5 bg-norm rounded-full lumo-label-medium lumo-color-glyph text-nowrap',
                className
            )}
        >
            {icon}
            <span>{children}</span>
        </div>
    );
};

/**
 * "Lumo/Desktop app illustration" from Figma: a desktop window with three chips for the selling
 * points. Built from markup instead of an image so the chip labels get translated and follow the theme.
 */
export const DesktopAppIllustration = () => {
    return (
        <div className="desktop-app-illustration relative shrink-0" aria-hidden="true">
            <div className="desktop-app-illustration-window absolute flex flex-column flex-nowrap bg-norm">
                <div className="desktop-app-illustration-titlebar py-2.5 pl-3 flex flex-nowrap gap-1.5">
                    <span className="desktop-app-illustration-dot desktop-app-illustration-dot--close rounded-full" />
                    <span className="desktop-app-illustration-dot desktop-app-illustration-dot--minimize rounded-full" />
                    <span className="desktop-app-illustration-dot desktop-app-illustration-dot--zoom rounded-full" />
                </div>
                <div className="desktop-app-illustration-body gap-2.5 flex flex-column flex-nowrap flex-1 items-center justify-center">
                    <div className="desktop-app-illustration-app-icon flex items-center justify-center">
                        <img
                            src={lumoCatIcon}
                            alt=""
                            className="w-custom h-custom"
                            style={{ '--w-custom': '2.75rem', '--h-custom': '2.75rem' }}
                        />
                    </div>
                    <span className="lumo-color-glyph lumo-title-small">
                        {c('collider_2025: Illustration').t`${LUMO_SHORT_APP_NAME} for desktop`}
                    </span>
                </div>
            </div>
            <Chip
                className="desktop-app-illustration-chip--connectors"
                icon={<MailLogo variant="glyph-only" size={4} hasTitle={false} />}
            >
                {c('collider_2025: Illustration').t`${MAIL_APP_NAME} connected`}
            </Chip>
            <Chip
                className="desktop-app-illustration-chip--schedules"
                icon={<LumoIcon name="Clock" size={14} strokeWidth={1.4} className="shrink-0" />}
            >
                {/* translator: example of a scheduled task in an illustration, e.g. "Morning brief · 8:00 AM" */}
                {c('collider_2025: Illustration').t`Morning brief · 8:00 AM`}
            </Chip>
            <Chip
                className="desktop-app-illustration-chip--secure"
                icon={<LumoIcon name="ShieldCheck" size={14} strokeWidth={1.4} className="shrink-0" />}
            >
                {c('collider_2025: Illustration').t`Stays on this device`}
            </Chip>
        </div>
    );
};
