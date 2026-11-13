import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import lumoSad from '@proton/styles/assets/img/lumo/lumo-cat-sad.svg';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import type { TierError } from '../../redux/slices/meta/errors';
import LumoTierErrorUpsellButtons from '../composed/LumoTierErrorUpsellButtons';

import './UpsellCard.scss';

interface WrapperProps {
    children: React.ReactNode;
    error: TierError;
    showSadCat?: boolean;
    /** In the chat rather than above the composer: no upward nudge over the content above. */
    inChat?: boolean;
    onDismiss?: () => void;
}

const UpsellCardWrapper = ({ children, error, showSadCat = true, inChat = false, onDismiss }: WrapperProps) => {
    return (
        <div
            className={clsx(
                'upsell-card flex flex-nowrap flex-column lg:flex-row rounded-xl mb-4 w-full relative',
                // Without the image, more room around the text and between text and actions, centred on one line.
                showSadCat ? 'gap-4 lg:gap-2 p-3' : 'gap-3 lg:gap-6 p-4 lg:items-center',
                onDismiss && 'upsell-card--dismissible',
                inChat && 'upsell-card--in-chat mt-2'
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
            <div className={clsx('flex flex-column flex-nowrap gap-2', showSadCat && 'my-auto')}>{children}</div>
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

interface Props {
    error: TierError;
    showSadCat?: boolean;
    inChat?: boolean;
    onDismiss?: () => void;
}

const UpsellCard = ({ error, showSadCat = true, inChat = false, onDismiss }: Props) => {
    return (
        <UpsellCardWrapper error={error} showSadCat={showSadCat} inChat={inChat} onDismiss={onDismiss}>
            <LumoTierErrorUpsellButtons />
        </UpsellCardWrapper>
    );
};

UpsellCard.displayName = 'UpsellCard';

export default UpsellCard;
