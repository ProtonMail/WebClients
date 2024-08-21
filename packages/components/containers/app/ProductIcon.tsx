import Logo from '@proton/components/components/logo/Logo';
import NewBadge from '@proton/components/components/newBadge/NewBadge';
import { getAppShortName } from '@proton/shared/lib/apps/helper';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

interface ProductIconProps {
    appToLinkTo: APP_NAMES;
    current?: boolean;
}

const ProductIcon = ({ appToLinkTo, current }: ProductIconProps) => {
    const appToLinkToName = getAppShortName(appToLinkTo);
    const isWalletAppSwitcherNewBadgeEnabled = useFlag('WalletAppSwitcherNewBadge');

    return (
        <>
            <div
                className="apps-dropdown-logo-wrapper flex items-center justify-center rounded-lg border border-weak w-custom h-custom mx-auto"
                style={{ '--w-custom': '3.25rem', '--h-custom': '3.25rem' }}
            >
                <Logo appName={appToLinkTo} variant="glyph-only" className="shrink-0" size={9} />
            </div>
            <span
                className={clsx(
                    'block text-center text-sm mt-1 apps-dropdown-app-name',
                    current ? 'color-norm text-semibold' : 'color-weak'
                )}
                aria-hidden
            >
                {appToLinkToName}
            </span>
            {appToLinkTo === APPS.PROTONWALLET && isWalletAppSwitcherNewBadgeEnabled && <NewBadge />}
        </>
    );
};

export default ProductIcon;
