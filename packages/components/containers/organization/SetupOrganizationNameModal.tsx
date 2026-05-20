import { useCallback, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { PLAN_NAMES } from '@proton/payments/index';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { Organization } from '@proton/shared/lib/interfaces';
import welcomeImg from '@proton/styles/assets/img/onboarding/b2b/welcome-b2b.svg';

interface Props extends Omit<ModalProps, 'onSubmit'> {
    onSubmit: (name: string) => Promise<void>;
    organization: Organization;
}

export const SetupOrganizationNameModal = ({ onClose, onSubmit, organization, ...rest }: Props) => {
    const dispatch = useDispatch();
    const [loading, withLoading] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();
    const [name, setName] = useState(organization.Name);
    const { createNotification } = useNotifications();

    const handleSubmit = useCallback(() => {
        if (!onFormSubmit()) {
            return;
        }

        void withLoading(onSubmit(name));
    }, [dispatch, name, createNotification, onClose]);

    const planName = PLAN_NAMES[organization.PlanName] || VPN_APP_NAME;
    return (
        <Modal as={Form} onSubmit={handleSubmit} size="medium" {...rest} onClose={onClose}>
            <ModalHeader
                additionalContent={
                    <div className="flex flex-column items-center p-4 pb-0">
                        <img src={welcomeImg} alt="" style={{ width: '100%' }} />
                        <h1 className="text-break text-4xl text-bold">{c('Title').t`Welcome to ${planName}`}</h1>
                    </div>
                }
            />

            <ModalContent className="px-4">
                <InputFieldTwo
                    id="organization-name"
                    label={c('Input title').t`What is your organization's name?`}
                    placeholder={c('Placeholder').t`Enter name`}
                    error={validator([requiredValidator(name)])}
                    autoFocus
                    disableChange={loading}
                    value={name}
                    onValue={(value: string) => setName(value)}
                    assistiveText={c('Input assistive text')
                        .t`This is how your organization will appear to users. You can change it at any time.`}
                />
            </ModalContent>
            <ModalFooter className="p-4 pt-0 mt-0.5">
                <Button loading={loading} type="submit" color="norm" fullWidth>
                    {c('Action').t`Create organization`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};
