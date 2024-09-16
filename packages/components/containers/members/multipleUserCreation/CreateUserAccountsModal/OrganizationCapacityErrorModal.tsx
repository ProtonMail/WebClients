import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import { SettingsLink, useConfig } from '@proton/components';
import Prompt from '@proton/components/components/prompt/Prompt';
import { useLoading } from '@proton/hooks';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';

import type { OrganizationCapacityError } from './validateOrganizationCapacity';
import { ORGANIZATION_CAPACITY_ERROR_TYPE } from './validateOrganizationCapacity';

interface Props extends ModalProps {
    error: OrganizationCapacityError;
    onCancel: () => void;
    onContinue: () => Promise<any>;
    app: APP_NAMES;
}

const OrganizationCapacityErrorModal = ({ error, onCancel, onContinue, app, ...rest }: Props) => {
    const { APP_NAME } = useConfig();
    const [loading, withLoading] = useLoading();

    const upsellRef = getUpsellRefFromApp({
        app: APP_NAME,
        fromApp: app,
        feature: SHARED_UPSELL_PATHS.ORGANIZATION_CAPACITY,
        component: UPSELL_COMPONENT.MODAL,
    });

    const link = addUpsellPath('/dashboard', upsellRef);
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
            <p className="mt-0">{error.message}</p>
            <p className="mb-0">{cta}</p>
        </Prompt>
    );
};

export default OrganizationCapacityErrorModal;
