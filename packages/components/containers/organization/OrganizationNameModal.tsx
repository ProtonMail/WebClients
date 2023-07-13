import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import { updateOrganizationName } from '@proton/shared/lib/api/organization';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { Organization } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import {
    Form,
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    useFormErrors,
} from '../../components';
import { useApi, useEventManager } from '../../hooks';

interface Props extends ModalProps {
    organization: Organization;
}
const OrganizationNameModal = ({ onClose, organization, ...rest }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();
    const [name, setName] = useState(organization.Name);

    const handleSubmit = async () => {
        await api(updateOrganizationName(name));
        await call();
        onClose?.();
    };

    const handleClose = loading ? noop : onClose;

    const header = organization.RequiresKey
        ? c('Title').t`Change organization name`
        : c('familyOffer_2023:Title').t`Change family name`;
    const label = organization.RequiresKey
        ? c('Title').t`Organization name`
        : c('familyOffer_2023:Title').t`Family name`;

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
