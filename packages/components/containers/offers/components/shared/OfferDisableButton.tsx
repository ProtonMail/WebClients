import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';

import useOfferFlags from '../../hooks/useOfferFlags';
import { OfferProps } from '../../interface';

const OfferDisableButton = (props: OfferProps) => {
    const { handleHide } = useOfferFlags(props.offer);

    const [loading, withLoading] = useLoading();

    return (
        <Button
            shape="underline"
            size="small"
            color="norm"
            loading={loading}
            data-testid="cta:hide-offer"
            onClick={async () => {
                await withLoading(handleHide());
                props.onCloseModal?.();
            }}
        >{c('specialoffer: Action').t`Don't show this offer again`}</Button>
    );
};

export default OfferDisableButton;
