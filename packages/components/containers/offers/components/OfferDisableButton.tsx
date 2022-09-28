import { c } from 'ttag';

import { Button } from '@proton/components/components';
import { useLoading } from '@proton/components/hooks';

import useOfferFlags from '../hooks/useOfferFlags';
import { OfferLayoutProps } from '../interface';

const OfferDisableButton = (props: OfferLayoutProps) => {
    const { handleHide } = useOfferFlags(props.offer);

    const [loading, withLoading] = useLoading();

    return (
        <Button
            shape="underline"
            color="norm"
            loading={loading}
            onClick={async () => {
                await withLoading(handleHide());
                props.onCloseModal?.();
            }}
        >{c('specialoffer: Action').t`Don't show this again`}</Button>
    );
};

export default OfferDisableButton;
