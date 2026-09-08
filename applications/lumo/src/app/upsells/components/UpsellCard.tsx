import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import lumoSad from '@proton/styles/assets/img/lumo/lumo-cat-sad.svg';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import type { TierError } from '../../redux/slices/meta/errors';
import LumoTierErrorUpsellButtons from '../composed/LumoTierErrorUpsellButtons';

import './UpsellCard.scss';

const UpsellCardWrapper = ({
    children,
    error,
    showSadCat = true,
    onDismiss,
}: {
    children: React.ReactNode;
    error: TierError;
    showSadCat?: boolean;
    onDismiss?: () => void;
}) => {
    return (
        <div
            className={clsx(
                'upsell-card flex flex-nowrap flex-column lg:flex-row gap-4 lg:gap-2 p-3 rounded-xl mb-4 w-full relative',
                onDismiss && 'upsell-card--dismissible'
            )}
        >
            {showSadCat && (
                <div className="flex flex-col lg:flex-row items-center mr-1 shrink-0">
                    <img
                        className="w-custom h-custom mx-auto"
                        src={lumoSad}
                        alt=""
                        style={{ '--w-custom': '3.125rem', '--h-custom': '3.125rem' }}
                    />
                </div>
            )}
            <div className="flex flex-column flex-nowrap gap-2 lg:flex-1">
                <p className="error-card-title text-bold m-0">{error.errorTitle}</p>
                <p className="error-card-message m-0">{error.errorMessage}</p>
            </div>
            <div className="flex flex-column flex-nowrap gap-2 my-auto">{children}</div>
            {onDismiss && (
                <Button
                    icon
                    shape="ghost"
                    size="small"
                    className="upsell-card-dismiss-button rounded-full border-weak shrink-0 absolute bg-norm z-up"
                    onClick={onDismiss}
                    title={c('Action').t`Dismiss`}
                >
                    <LumoIcon
                        name="X"
                        width={12}
                        height={12}
                        className="color-weak"
                        aria-label={c('Action').t`Dismiss`}
                    />
                </Button>
            )}
        </div>
    );
};

UpsellCardWrapper.displayName = 'UpsellCardWrapper';

const UpsellCard = ({
    error,
    showSadCat = true,
    onDismiss,
}: {
    error: TierError;
    showSadCat?: boolean;
    onDismiss?: () => void;
}) => {
    return (
        <UpsellCardWrapper error={error} showSadCat={showSadCat} onDismiss={onDismiss}>
            <LumoTierErrorUpsellButtons />
        </UpsellCardWrapper>
    );
};

UpsellCard.displayName = 'UpsellCard';

export default UpsellCard;
