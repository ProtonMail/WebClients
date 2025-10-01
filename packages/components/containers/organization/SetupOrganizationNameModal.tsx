import { useState } from 'react';

import { c } from 'ttag';

import { organizationThunk } from '@proton/account/organization';
import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities';
import { updateOrganizationName } from '@proton/shared/lib/api/organization';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { Organization } from '@proton/shared/lib/interfaces';
import welcomeImg from '@proton/styles/assets/img/onboarding/b2b/welcome-b2b.svg';

interface Props extends ModalProps {
    organization: Organization;
}

/*
    TODO: Remove this before merge


    For testing, open http://localhost:8080/multi-user-support
    then use window.setSetupOrganizationNameModal(true) or false to open/close the modal
*/

const SetupOrganizationNameModal = ({ onClose, organization, ...rest }: Props) => {
    const api = useApi();
    const dispatch = useDispatch();
    const [loading, withLoading] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();
    const [name, setName] = useState(organization.Name);
    const { createNotification } = useNotifications();

    const handleSubmit = async () => {
        await api(updateOrganizationName(name));
        await dispatch(organizationThunk({ cache: CacheType.None }));
        createNotification({ text: c('Success').t`Organization name set` });

        onClose?.();
    };

    const planName = organization.PlanName || VPN_APP_NAME;

    return (
        <Modal
            as={Form}
            onSubmit={() => {
                if (!onFormSubmit()) {
                    return;
                }
                void withLoading(handleSubmit());
            }}
            size="medium"
            {...rest}
        >
            <ModalHeader
                className="flex flex-column items-center p-4 pb-0 text-xl"
                hasClose={false}
                leadingContent={<img src={welcomeImg} alt="" style={{ width: '100%' }} />}
                title={c('Title').t`Welcome to ${planName}`}
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

export default SetupOrganizationNameModal;
