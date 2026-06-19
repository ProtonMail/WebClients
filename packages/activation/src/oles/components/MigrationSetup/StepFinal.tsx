import { type FC, useState } from 'react';

import { c } from 'ttag';

import { ApiImporterOrganizationState } from '@proton/activation/src/api/api.interface';
import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import {
    BorderedContainer,
    BorderedContainerItem,
} from '@proton/components/components/BorderedStackedGroup/BorderedContainer';
import useLoading from '@proton/hooks/useLoading';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { MX_STATE } from '@proton/shared/lib/interfaces';

import { useErrorHandler } from '../../errors';
import { completeMigration } from '../../thunk';
import type { MigrationModel } from '../../types';
import { useProviderUsers } from '../../useProviderUsers';
import MigratingModal from '../MigrationAssistant/MigratingModal';
import DNSGroupRecords, { type DNSGroup } from './DNSGroupRecords';
import type { StepComponentProps } from './MigrationSetup';

const StepFinal: FC<StepComponentProps> = ({ model: migrationConfiguration }) => {
    const model = migrationConfiguration as MigrationModel;
    const dispatch = useDispatch();
    const handleError = useErrorHandler();

    const [providerUsers] = useProviderUsers(model.domainName);
    const [loading, withLoading] = useLoading();
    const [confirmed, setConfirmed] = useState(false);

    const handleFinalize = async () => {
        if (model.state >= ApiImporterOrganizationState.COMPLETED) {
            return;
        }

        try {
            const { State: state } = await dispatch(
                completeMigration({
                    importerOrganizationId: model.importerOrganizationId,
                    providerUsers: providerUsers ?? [],
                })
            ).unwrap();

            model.update({ state });
        } catch (err: any) {
            handleError(err);
        }
    };

    const handleSaveAndExit = () => withLoading(handleFinalize());

    const group: DNSGroup = {
        name: 'MX',
        hideState: true,
        records: [
            {
                dnsType: 'MX',
                value: 'mail.protonmail.ch',
                priority: 10,
                state: (() => {
                    if (model.domain?.MxState === MX_STATE.MX_STATE_DEFAULT) {
                        return 'not-found';
                    }
                    if (model.domain?.MxState === MX_STATE.MX_STATE_GOOD) {
                        return 'valid';
                    }
                    return 'invalid';
                })(),
            },
            {
                dnsType: 'MX',
                value: 'mailsec.protonmail.ch',
                priority: 20,
                state: (() => {
                    if (model.domain?.MxState === MX_STATE.MX_STATE_DEFAULT) {
                        return 'not-found';
                    }
                    if (model.domain?.MxState === MX_STATE.MX_STATE_GOOD) {
                        return 'valid';
                    }
                    return 'invalid';
                })(),
            },
        ],
    };

    const hasInactiveUsers =
        providerUsers?.some((u) => u.ImporterOrganizationUser?.HasTemporaryPassword === true) ?? false;

    return (
        <div className="max-w-custom" style={{ '--max-w-custom': '42rem' }}>
            <div className="flex justify-space-between flex-nowrap items-center gap-4 mb-4">
                <h3 className="text-4xl text-bold">{c('BOSS').t`Final step`}</h3>
                <div className="flex gap-4 shrink-0 text-semibold">
                    <Button
                        disabled={!confirmed || loading}
                        onClick={handleSaveAndExit}
                        color="norm"
                        size="medium"
                        className="rounded-lg"
                    >
                        {c('Action').t`Save & finish`}
                    </Button>
                </div>
            </div>
            {hasInactiveUsers && (
                <Banner
                    key="inactive-users"
                    className="p-2 rounded-xl mb-4"
                    variant="warning"
                    icon={<IcExclamationCircleFilled />}
                    opaqueVariant
                    borderless
                    contentWrapperClassName="flex w-full"
                >
                    <span>
                        {c('BOSS').t`We've noticed some users have not claimed their ${BRAND_NAME} accounts.`}{' '}
                        {c('BOSS')
                            .t`Users who haven't claimed their account before the migration is finalized will need to request a password reset from their ${BRAND_NAME} organization administrator.`}
                    </span>
                </Banner>
            )}
            <p className="color-weak m-0">
                {c('BOSS')
                    .t`You're almost done, you need to configure your domain to receive your emails directly on ${BRAND_NAME}. Once confirmed, your team will stop receiving new emails on Gmail and the migration will be completed.`}
            </p>
            <p className="color-weak">{c('BOSS')
                .t`Copy the below code and paste it in the DNS section of your domain host.`}</p>
            <DNSGroupRecords group={group} />
            <BorderedContainer className="mb-4 mt-2">
                <BorderedContainerItem
                    className="flex flex-row flex-nowrap items-center gap-2 justify-space-between"
                    paddingClassName="py-2 px-5"
                >
                    <div>
                        <p className="m-0 text-semibold">{c('Label').t`Confirm MX records added`}</p>
                        <span className="color-weak text-sm">{c('Info').t`Required to complete the migration`}</span>
                    </div>

                    <Button
                        disabled={confirmed}
                        color="norm"
                        className="text-semibold rounded-lg"
                        size="medium"
                        onClick={() => setConfirmed(true)}
                    >{c('BOSS').t`Confirm`}</Button>
                </BorderedContainerItem>
            </BorderedContainer>

            {loading && <MigratingModal variant="completing" />}
        </div>
    );
};

export default StepFinal;
