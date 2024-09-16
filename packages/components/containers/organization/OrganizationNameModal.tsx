import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import { useLoading } from '@proton/hooks';
import { updateOrganizationName } from '@proton/shared/lib/api/organization';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { Organization } from '@proton/shared/lib/interfaces';
import { getOrganizationDenomination } from '@proton/shared/lib/organization/helper';
import noop from '@proton/utils/noop';

import type { ModalProps } from '../../components';
import {
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    useFormErrors,
} from '../../components';
import { useApi, useEventManager, useNotifications } from '../../hooks';

interface Props extends ModalProps {
    organization: Organization;
}

const OrganizationNameModal = ({ onClose, organization, ...rest }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();
    const [name, setName] = useState(organization.Name);
    const { createNotification } = useNotifications();

    const isFamilyOrg = getOrganizationDenomination(organization) === 'familyGroup';

    const handleSubmit = async () => {
        await api(updateOrganizationName(name));
        await call();
        let message = c('Success').t`Organization name updated`;
        if (isFamilyOrg) {
            message = c('familyOffer_2023:Success').t`Family name updated`;
        }
        createNotification({ text: message });

        onClose?.();
    };

    const handleClose = loading ? noop : onClose;

    const header = isFamilyOrg
        ? c('familyOffer_2023:Title').t`Change family name`
        : c('Title').t`Change organization name`;
    const label = isFamilyOrg ? c('familyOffer_2023:Title').t`Family name` : c('Title').t`Organization name`;

    return (
        <Modal
            as={Form}
            onSubmit={() => {
                if (!onFormSubmit()) {
                    return;
                }
                void withLoading(handleSubmit());
            }}
            onClose={handleClose}
            size="small"
            {...rest}
        >
            <ModalHeader title={header} />
            <ModalContent>
                <InputFieldTwo
                    id="organization-name"
                    label={label}
                    placeholder={c('Placeholder').t`Choose a name`}
                    error={validator([requiredValidator(name)])}
                    autoFocus
                    disableChange={loading}
                    value={name}
                    onValue={(value: string) => setName(value)}
                />
            </ModalContent>
            <ModalFooter>
                <Button onClick={handleClose} disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button loading={loading} type="submit" color="norm">
                    {c('Action').t`Save`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default OrganizationNameModal;
