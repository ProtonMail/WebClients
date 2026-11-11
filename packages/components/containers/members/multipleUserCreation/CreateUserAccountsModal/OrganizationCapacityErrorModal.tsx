import { c } from 'ttag';

import type { OrganizationCapacityError } from '@proton/account/members/validateOrganizationCapacity';
import { ORGANIZATION_CAPACITY_ERROR_TYPE } from '@proton/account/members/validateOrganizationCapacity';
import { useCanUpdateBilling } from '@proton/account/userPermissions/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { Button } from '@proton/atoms/Button/Button';
import useLoading from '@proton/hooks/useLoading';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/ref';
import { addRefToUrl } from '@proton/utils/addRefToUrl';
import clsx from '@proton/utils/clsx';

import SettingsLink from '../../../../components/link/SettingsLink';
import type { ModalProps } from '../../../../components/modalTwo/Modal';
import Prompt from '../../../../components/prompt/Prompt';

interface Props extends ModalProps {
    error: OrganizationCapacityError;
    onCancel: () => void;
    onContinue: () => Promise<any>;
    app: APP_NAMES;
}

const OrganizationCapacityErrorModal = ({ error, onCancel, onContinue, app, ...rest }: Props) => {
    const { APP_NAME } = useConfig();
    const [loading, withLoading] = useLoading();
    const [canUpdateBilling] = useCanUpdateBilling();

    const upsellRef = getUpsellRefFromApp({
        app: APP_NAME,
        fromApp: app,
        feature: SHARED_UPSELL_PATHS.ORGANIZATION_CAPACITY,
        component: UPSELL_COMPONENT.MODAL,
    });

    const link = addRefToUrl('/dashboard', upsellRef);
    const upgradeLink = (
        <SettingsLink path={link} key="upgrade-plan-key">{c('Link').t`Upgrade your plan`}</SettingsLink>
    );
    const cta = (() => {
        if (error.type === ORGANIZATION_CAPACITY_ERROR_TYPE.MEMBER) {
            // translator: Full sentence "Upgrade your plan to add more users, or remove some user accounts to free up space."
            return c('Organization capacity error')
                .jt`${upgradeLink} to add more users, or remove some user accounts to free up space.`;
        }

        if (error.type === ORGANIZATION_CAPACITY_ERROR_TYPE.SPACE) {
            // translator: Full sentence "Upgrade your plan to get more storage, or remove some storage to free up space."
            return c('Organization capacity error')
                .jt`${upgradeLink} to get more storage, or remove some storage to free up space.`;
        }

        if (error.type === ORGANIZATION_CAPACITY_ERROR_TYPE.ADDRESSES) {
            // translator: Full sentence "Upgrade your plan to get more addresses, or remove some addresses to free up space."
            return c('Organization capacity error')
                .jt`${upgradeLink} to get more addresses, or remove some addresses to free up space.`;
        }

        if (error.type === ORGANIZATION_CAPACITY_ERROR_TYPE.VPNS) {
            // translator: Full sentence "Upgrade your plan to get more accounts, or remove VPN access from some users."
            return c('Organization capacity error')
                .jt`${upgradeLink} to get more accounts, or remove VPN access from some users.`;
        }

        throw new Error(`ORGANIZATION_CAPACITY_ERROR_TYPE ${error.type} not handled`);
    })();

    return (
        <Prompt
            title={c('Title').t`Couldn’t create accounts`}
            buttons={[
                <Button color="norm" loading={loading} onClick={() => withLoading(onContinue())}>
                    {c('Action').t`Continue anyway`}
                </Button>,
                <Button onClick={onCancel}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            <p className={clsx('mt-0', !canUpdateBilling && 'mb-0')}>{error.message}</p>
            {canUpdateBilling && <p className="mb-0">{cta}</p>}
        </Prompt>
    );
};

export default OrganizationCapacityErrorModal;
