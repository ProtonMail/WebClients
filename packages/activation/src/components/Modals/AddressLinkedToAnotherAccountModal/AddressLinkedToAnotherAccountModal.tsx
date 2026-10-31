import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import {
    BRAND_NAME,
    DRIVE_SHORT_APP_NAME,
    LUMO_SHORT_APP_NAME,
    PASS_SHORT_APP_NAME,
    VPN_SHORT_APP_NAME,
    WALLET_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import {
    trackAccountImportLinkedAddressModalAction,
    trackAccountImportLinkedAddressModalShown,
} from '../../../telemetry/accountImportFlow';

interface Props extends ModalStateProps {}

const AddressLinkedToAnotherAccountModal = ({ ...rest }: Props) => {
    useEffect(() => {
        trackAccountImportLinkedAddressModalShown();
    }, []);

    const handleViewGuideClick = () => {
        trackAccountImportLinkedAddressModalAction('view_guide');
    };

    const handleGotItClick = () => {
        trackAccountImportLinkedAddressModalAction('got_it');
        rest.onClose();
    };

    const handleClose = () => {
        trackAccountImportLinkedAddressModalAction('close');
        rest.onClose();
    };

    return (
        <Prompt
            title={c('Title').t`Heads up: This Gmail is linked to another ${BRAND_NAME} account`}
            buttons={[
                <ButtonLike
                    as={Href}
                    href={getKnowledgeBaseUrl('/troubleshooting-easy-switch#gmail-connection-setup')}
                    color="norm"
                    onClick={handleViewGuideClick}
                >
                    {c('Action').t`View guide`}
                </ButtonLike>,
                <Button onClick={handleGotItClick}>{c('Action').t`Got it`}</Button>,
            ]}
            {...rest}
            onClose={handleClose}
        >
            <p>
                {c('Info')
                    .t`This Gmail address is registered with another ${BRAND_NAME} account (${VPN_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${WALLET_SHORT_APP_NAME}, ${LUMO_SHORT_APP_NAME} AI, and others). We're working to make this connection seamless, but for now you'll need to take a few steps.`}
            </p>
        </Prompt>
    );
};

export default AddressLinkedToAnotherAccountModal;
