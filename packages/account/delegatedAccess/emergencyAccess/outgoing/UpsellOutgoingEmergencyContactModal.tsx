import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import ModalTwo, { type ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import { ModalHeaderCloseButton } from '@proton/components/components/modalTwo/ModalHeader';
import { PromotionBanner } from '@proton/components/containers/banner/PromotionBanner';
import type { Upsell } from '@proton/components/containers/payments/subscription/helpers';
import UpsellPriceV1 from '@proton/components/containers/payments/subscription/panels/components/UpsellPriceV1';

import illustration from '../upsell-shield.svg';

export interface EditOutgoingEmergencyContactModalProps
    extends Omit<ModalProps<'form'>, 'children' | 'buttons' | 'onSubmit'> {
    onUpgrade: (type: 'explore' | 'upgrade') => void;
    upsell: Upsell;
}

export const UpsellOutgoingEmergencyContactModal = ({
    onUpgrade,
    upsell,
    ...rest
}: EditOutgoingEmergencyContactModalProps) => {
    const planName = upsell.title;
    if (!planName) {
        return null;
    }

    const price = upsell.price ? <UpsellPriceV1 key="offer-price" upsell={upsell} /> : null;
    const title = c('emergency_access').t`Protect your legacy with emergency access`;

    const description = c('emergency_access').t`Included with ${planName}`;

    const features = [
        ...upsell.features.filter((feature) => feature.included && feature.status !== 'coming-soon'),
    ].slice(0, 5);

    return (
        <ModalTwo {...rest} size="small">
            <ModalTwoContent unstyled>
                <div className="py-8 relative">
                    <div className="mb-2 text-center">
                        <ModalHeaderCloseButton buttonProps={{ className: 'absolute right-0 top-0' }} />
                        <img src={illustration} alt="" />
                    </div>
                    <div className="px-6">
                        <div className="mb-8 text-center">
                            <h1 className="text-2xl text-bold mb-1">{title}</h1>
                            <div className="text-sm color-weak">{description}</div>
                            {price ? (
                                <div className="mt-2 text-lg text-semibold">
                                    <PromotionBanner
                                        className="inline-flex py-1"
                                        rounded
                                        mode="banner"
                                        description={
                                            <>
                                                {
                                                    /* Translator: string is "Only $9.99 / month"*/
                                                    c('emergency_access').t`Only `
                                                }
                                                {price}
                                            </>
                                        }
                                    />
                                </div>
                            ) : null}
                        </div>
                        <div className="mb-8">
                            <p className="text-left text-semibold my-0 mb-2 text-sm">
                                {c('Description').t`Also included`}
                            </p>
                            <div className="text-left">
                                <ul className="unstyled my-0">
                                    {features.map(
                                        ({
                                            icon = 'checkmark',
                                            text,
                                            tooltip,
                                            included = true,
                                            status = 'available',
                                        }) => {
                                            const key =
                                                typeof text === 'string'
                                                    ? text
                                                    : `${tooltip}-${icon}-${included}-${status}`;
                                            return (
                                                <li key={key}>
                                                    <div className="flex flex-nowrap items-center">
                                                        <div className="mr-3 shrink-0 flex">
                                                            <Icon
                                                                className="color-primary m-auto"
                                                                size={4}
                                                                name="checkmark"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <span className="align-middle">{text}</span>
                                                        </div>
                                                    </div>
                                                </li>
                                            );
                                        }
                                    )}
                                </ul>
                            </div>
                        </div>
                        <div className="justify-center flex flex-colum gap-2">
                            <Button fullWidth color="norm" type="button" onClick={() => onUpgrade('upgrade')}>
                                {c('emergency_access').t`Upgrade to ${planName}`}
                            </Button>
                            <Button color="norm" shape="underline" onClick={() => onUpgrade('explore')}>
                                {c('Action').t`Explore other plans`}
                            </Button>
                        </div>
                    </div>
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};
