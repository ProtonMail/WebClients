import { useState } from 'react';
import { c } from 'ttag';
import { updateOrganizationName } from '@proton/shared/lib/api/organization';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { noop } from '@proton/shared/lib/helpers/function';
import {
    ModalProps,
    ModalTwo as Modal,
    ModalTwoHeader as ModalHeader,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    Form,
    useFormErrors,
    InputFieldTwo,
    Button,
} from '../../components';
import { useEventManager, useApi, useLoading } from '../../hooks';

interface Props extends ModalProps {
    organizationName: string;
}
const OrganizationNameModal = ({ onClose, organizationName, ...rest }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();
    const [name, setName] = useState(organizationName);

    const handleSubmit = async () => {
        await api(updateOrganizationName(name));
        await call();
        onClose?.();
    };

    const handleClose = loading ? noop : onClose;

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
            <ModalHeader title={c('Title').t`Change organization name`} />
            <ModalContent>
                <InputFieldTwo
                    id="organization-name"
                    label={c('Label').t`Organization name`}
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
