import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import {
    Form,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    useFormErrors,
} from '@proton/components';
import { useApi, useEventManager, useNotifications } from '@proton/components/hooks';
import { useLoading } from '@proton/hooks';
import metrics, { observeApiError } from '@proton/metrics';
import { deleteOrganizationLogo, updateOrganizationSettings } from '@proton/shared/lib/api/organization';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { Organization } from '@proton/shared/lib/interfaces';
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
    const { createNotification } = useNotifications();

    const handleSubmit = async () => {
        try {
            await api(deleteOrganizationLogo());
            await api(updateOrganizationSettings({ ShowName: false }));
            await call();

            metrics.core_lightLabelling_logoRemoval_total.increment({
                status: 'success',
            });

            createNotification({ text: c('Success').t`Organization logo removed` });
            onClose?.();
        } catch (error) {
            observeApiError(error, (status) =>
                metrics.core_lightLabelling_logoRemoval_total.increment({
                    status,
                })
            );
        }
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
