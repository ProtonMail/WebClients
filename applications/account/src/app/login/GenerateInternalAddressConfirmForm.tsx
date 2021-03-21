import React from 'react';
import { c } from 'ttag';
import { useLoading, Button } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';
import { BRAND_NAME } from 'proton-shared/lib/constants';

import ButtonSpacer from '../public/ButtonSpacer';
import TextSpacer from '../public/TextSpacer';

interface Props {
    onSubmit: () => Promise<void>;
    address: string;
    recoveryAddress: string;
}

const GenerateInternalAddressConfirmForm = ({ onSubmit, address, recoveryAddress }: Props) => {
    const [loading, withLoading] = useLoading();

    const strongAddressAvailable = <strong key="address">{c('Action').t`${address} is available.`}</strong>;

    return (
        <form
            name="addressConfirmForm"
            className="signup-form"
            onSubmit={(event) => {
                event.preventDefault();
                if (loading) {
                    return;
                }
                withLoading(onSubmit()).catch(noop);
            }}
            method="post"
        >
            <TextSpacer>
                {c('Info')
                    .jt`${strongAddressAvailable} You will use this email address to sign into all ${BRAND_NAME} services.`}
            </TextSpacer>
            <div className="p1 mb2 text-center bg-global-highlight rounded">
                <div className="text-bold">{c('Info').t`Your recovery email address:`}</div>
                {recoveryAddress}
            </div>
            <ButtonSpacer>
                <Button size="large" color="norm" type="submit" fullWidth loading={loading} autoFocus>
                    {c('Action').t`Create address`}
                </Button>
            </ButtonSpacer>
        </form>
    );
};

export default GenerateInternalAddressConfirmForm;
