import React from 'react';

import { c } from 'ttag';

import { Button, VerticalStep, VerticalSteps } from '@proton/atoms';
import { Icon, type ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

const UpdateMailAddressModal = (props: ModalProps) => {
    return (
        <ModalTwo {...props}>
            <ModalTwoHeader title={c('Title').t`How to update your email address`} />
            <ModalTwoContent>
                <p>{c('Description')
                    .t`Use ${MAIL_APP_NAME} to sign in to online services since, unlike other email providers, we will never track your data and share it with third parties.`}</p>

                <VerticalSteps className="vertical-steps--primary">
                    <VerticalStep
                        titleCentered
                        titleBold={false}
                        title={c('Step').t`Select service to update`}
                        icon={<span className="m-auto">1</span>}
                    />
                    <VerticalStep
                        titleCentered
                        titleBold={false}
                        title={c('Step').t`Sign in to the service`}
                        icon={<span className="m-auto">2</span>}
                    />
                    <VerticalStep
                        title={c('Step')
                            .t`In the account settings, look for the option to edit or change your email address `}
                        titleCentered
                        titleBold={false}
                        icon={<span className="m-auto">3</span>}
                    />
                    <VerticalStep
                        title={c('Step')
                            .t`Enter your ${MAIL_APP_NAME} address as the new address, and save, confirm, or verify the change`}
                        titleCentered
                        titleBold={false}
                        icon={<span className="m-auto">4</span>}
                    />
                </VerticalSteps>
                <p className="flex flex-row flex-nowrap items-center border rounded-xl border-weak p-3">
                    <span className="shrink-0 color-primary">
                        <Icon name="info-circle" size={4.5} />
                    </span>
                    <span className="flex-1 ml-3 text-sm color-weak">{c('Info')
                        .t`Remember to update this in your password manager or wherever you keep your account and login information.`}</span>
                </p>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button color="norm" fullWidth onClick={props.onClose}>
                    {c('Action').t`Got it`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default UpdateMailAddressModal;
