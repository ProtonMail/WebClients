import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Form,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    useFormErrors,
} from '@proton/components';
import { useApi, useEventManager } from '@proton/components/hooks';
import { useLoading } from '@proton/hooks';
import { deleteOrganizationLogo, updateOrganizationSettings } from '@proton/shared/lib/api/organization';
import { APP_NAMES } from '@proton/shared/lib/constants';
import { Organization } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import SidebarPreview from './SidebarPreview';

interface Props extends ModalProps {
    organization: Organization;
    app: APP_NAMES;
}

const OrganizationLogoRemovalModal = ({ onClose, organization, app, ...rest }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const { onFormSubmit } = useFormErrors();

    const handleSubmit = async () => {
        await api(deleteOrganizationLogo());
        await api(updateOrganizationSettings({ ShowName: false }));
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
            <ModalHeader title={c('Title').t`Delete organization logo?`} />
            <ModalContent>
                <p>{c('Remove organization logo')
                    .t`Users will no longer see your custom logo or organization name.`}</p>
                <div className="flex justify-center">
                    <SidebarPreview app={app} organizationName={organization.Name} />
                </div>
            </ModalContent>
            <ModalFooter>
                <Button onClick={handleClose} disabled={loading}>
                    {c('Action').t`Keep logo`}
                </Button>
                <Button loading={loading} type="submit" color="danger">
                    {c('Action').t`Delete logo`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default OrganizationLogoRemovalModal;
