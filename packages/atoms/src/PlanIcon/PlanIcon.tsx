import { type ReactNode } from 'react';

import { PLANS, PLAN_NAMES } from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import bundlePro from './logo/bundle-pro.svg';
// Logo imports - all logos from ./logo directory
import bundle from './logo/bundle.svg';
import driveBiz from './logo/drive-biz.svg';
import drivePro from './logo/drive-pro.svg';
import drive from './logo/drive.svg';
import duo from './logo/duo.svg';
import enterprise from './logo/enterprise.svg';
import family from './logo/family.svg';
import driveFree from './logo/free-drive.svg';
import mailFree from './logo/free-mail.svg';
import passFree from './logo/free-pass.svg';
import vpnFree from './logo/free-vpn.svg';
import walletFree from './logo/free-wallet.svg';
import freeGeneric from './logo/free.svg';
import lumo from './logo/lumo.svg';
import mailBiz from './logo/mail-biz.svg';
import mailPro from './logo/mail-pro.svg';
import mail from './logo/mail.svg';
import passBiz from './logo/pass-biz.svg';
import passFamily from './logo/pass-family.svg';
import passLifetime from './logo/pass-lifetime.svg';
import passPro from './logo/pass-pro.svg';
import pass from './logo/pass.svg';
import visionary from './logo/visionary.svg';
import vpnBiz from './logo/vpn-biz.svg';
import vpnPass from './logo/vpn-pass.svg';
import vpnPro from './logo/vpn-pro.svg';
import vpn from './logo/vpn.svg';
import wallet from './logo/wallet.svg';

import './PlanIcon.scss';

const LogoIconShape = ({
    children,
    border = true,
    size = '2.75rem',
    className,
}: {
    children: ReactNode;
    border?: boolean;
    size?: string;
    className?: string;
}) => {
    return (
        <div
            className={clsx(
                'PlanIcon w-custom ratio-square overflow-hidden flex items-center justify-center shrink-0',
                border ? 'border border-weak' : undefined,
                className
            )}
            style={{ '--w-custom': size, backgroundColor: 'white' }}
            aria-hidden="true"
        >
            {children}
        </div>
    );
};

interface FreePlanIconProps {
    app?: APP_NAMES;
    size?: string;
    planName: PLANS;
    className?: string;
}

const freePlanAppIconMap: Partial<Record<APP_NAMES, string>> = {
    'proton-mail': mailFree,
    'proton-pass': passFree,
    'proton-vpn-settings': vpnFree,
    'proton-drive': driveFree,
    'proton-wallet': walletFree,
};

const FreePlanIcon = ({ app, size, planName, className }: FreePlanIconProps) => {
    const name = PLAN_NAMES[planName];
    const src = app && freePlanAppIconMap[app] ? freePlanAppIconMap[app] : freeGeneric;
    return (
        <LogoIconShape className={className}>
            <img src={src} width={size} className="w-full" alt={name} />
        </LogoIconShape>
    );
};

interface Props {
    planName: PLANS;
    app?: APP_NAMES;
    size?: string;
    className?: string;
}

const planIconMap: Record<PLANS, { src?: string; border?: boolean }> = {
    [PLANS.VPN]: { src: vpn, border: true },
    [PLANS.VPN2024]: { src: vpn, border: true },
    [PLANS.VPN_PRO]: { src: vpnPro, border: false },
    [PLANS.VPN_BUSINESS]: { src: vpnBiz, border: false },
    [PLANS.VPN_PASS_BUNDLE]: { src: vpnPass, border: true },
    [PLANS.MAIL]: { src: mail, border: true },
    [PLANS.MAIL_PRO]: { src: mailPro, border: false },
    [PLANS.MAIL_BUSINESS]: { src: mailBiz, border: false },
    [PLANS.DRIVE]: { src: drive, border: true },
    [PLANS.DRIVE_1TB]: { src: drive, border: true },
    [PLANS.DRIVE_LITE]: { src: drive, border: true },
    [PLANS.DRIVE_PRO]: { src: drivePro, border: false },
    [PLANS.DRIVE_BUSINESS]: { src: driveBiz, border: false },
    [PLANS.PASS]: { src: pass, border: true },
    [PLANS.PASS_PRO]: { src: passPro, border: false },
    [PLANS.PASS_BUSINESS]: { src: passBiz, border: false },
    [PLANS.PASS_LIFETIME]: { src: passLifetime, border: false },
    [PLANS.PASS_FAMILY]: { src: passFamily, border: false },
    [PLANS.BUNDLE]: { src: bundle, border: false },
    [PLANS.BUNDLE_PRO]: { src: bundlePro, border: false },
    [PLANS.BUNDLE_PRO_2024]: { src: bundlePro, border: false },
    [PLANS.DUO]: { src: duo, border: false },
    [PLANS.FAMILY]: { src: family, border: false },
    [PLANS.ENTERPRISE]: { src: enterprise, border: false },
    [PLANS.VISIONARY]: { src: visionary, border: false },
    [PLANS.WALLET]: { src: wallet, border: true },
    [PLANS.LUMO]: { src: lumo, border: true },
    [PLANS.FREE]: {}, // handled separately
};

const PlanIcon = ({ planName, app, size = '2.75rem', className }: Props) => {
    const name = PLAN_NAMES[planName];
    if (planName === PLANS.FREE) {
        return <FreePlanIcon app={app} size={size} planName={planName} className={className} />;
    }
    const iconConfig = planIconMap[planName];
    if (iconConfig && iconConfig.src) {
        return (
            <LogoIconShape size={size} className={className} border={iconConfig.border}>
                <img src={iconConfig.src} className="w-full" alt={name} />
            </LogoIconShape>
        );
    }
    throw new Error(`Unhandled planName in PlanIcon: ${planName}`);
};

export default PlanIcon;
