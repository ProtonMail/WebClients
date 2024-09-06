import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import type { ModalProps } from '@proton/components';
import { Icon, ModalTwo, ModalTwoContent, Tooltip } from '@proton/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { getTryDrivePlus2024Features } from '@proton/components/containers/offers/helpers/offerCopies';
import { getCTAContent, getRenews } from '@proton/components/containers/offers/operations/mailTrial2024/text';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import { useLoading } from '@proton/hooks';
import { PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';
import type { Currency } from '@proton/shared/lib/interfaces';

import SaveLabel from '../SaveLabel';

interface Props extends ModalProps {
    onConfirm: () => Promise<void>;
    onContinue: () => void;
    currency: Currency;
}

const DriveTrial2024UpsellModal = ({ onConfirm, onContinue, onClose, currency, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();
    const planName = PLAN_NAMES[PLANS.DRIVE];

    const priceString = getSimplePriceString(currency, 100);
    const price = (
        <span key="price" className="text-bold">
            {priceString}
        </span>
    );

    const close = (
        <Tooltip title={c('Action').t`Close`}>
            <Button
                className="shrink-0"
                icon
                shape="ghost"
                data-testid="modal:close"
                onClick={() => {
                    onContinue();
                    onClose?.();
                }}
                size="small"
            >
                <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
            </Button>
        </Tooltip>
    );

    return (
        <ModalTwo {...rest} size="small">
            <div
                className="flex mb-4 items-center justify-center"
                style={{ color: 'var(--promotion-text-color)', background: 'var(--promotion-background-start)' }}
            >
                <div className="visibility-hidden">{close}</div>
                <div className="flex-1 text-center">
                    <span>
                        <Icon name="hourglass" size={3.5} />
                        <span className="ml-1">
                            {c('mailtrial2024: Action').t`Special Offer`}:{' '}
                            {c('mailtrial2024: Info').jt`Get ${planName} for ${price}`}
                        </span>
                    </span>
                </div>
                <div>{close}</div>
            </div>
            <ModalTwoContent>
                <div>
                    <div className="text-4xl text-bold text-center mb-2">{planName}</div>
                    <div className="flex gap-2 items-center justify-center">
                        <span className="color-primary text-bold h1">{price}</span>
                        <div className="flex flex-column justify-center text-left">
                            <span>
                                <SaveLabel percent={80} />
                            </span>
                            <span className="text-strike text-sm color-weak">
                                {getSimplePriceString(currency, 499)}
                            </span>
                        </div>
                    </div>
                    <div className="mb-4 color-weak text-center">
                        {c('mailtrial2024: Info').t`for your first month`}
                    </div>
                </div>
                <Button
                    color="norm"
                    fullWidth
                    className="mb-2"
                    size="large"
                    loading={loading}
                    onClick={async () => {
                        await withLoading(onConfirm().then(() => onClose?.()));
                    }}
                >
                    {getCTAContent()}
                </Button>
                <div>
                    <PlanCardFeatureList
                        icon
                        iconColor="color-primary"
                        features={getTryDrivePlus2024Features().map((feature) => ({
                            ...feature,
                            text: feature.name,
                            included: true,
                        }))}
                    />
                </div>
                <div className="color-weak text-sm text-center mt-2 mb-2">{getRenews(currency)}</div>
                <Button
                    shape="ghost"
                    color="norm"
                    size="large"
                    onClick={() => {
                        onContinue();
                        onClose?.();
                    }}
                    fullWidth
                >
                    {c('Action').t`No, thanks`}
                </Button>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default DriveTrial2024UpsellModal;
