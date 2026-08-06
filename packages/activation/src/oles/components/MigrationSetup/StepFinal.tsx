import { type FC, useState } from 'react';

import { c, msgid } from 'ttag';

import { ApiImporterOrganizationState } from '@proton/activation/src/api/api.interface';
import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import {
    BorderedContainer,
    BorderedContainerItem,
} from '@proton/components/components/BorderedStackedGroup/BorderedContainer';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
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
    const mailAppName = model.provider.mailAppName;

    const [providerUsers] = useProviderUsers(model.domainName);
    const [loading, withLoading] = useLoading();
    const [confirmed, setConfirmed] = useState(false);
    const [warningModalProps, setWarningModalOpen, renderWarningModal] = useModalState();

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

    const notMigratedUsers = providerUsers?.filter((u) => !u.ImporterOrganizationUser) ?? [];
    const notMigratedCount = notMigratedUsers.length;
    const notMigratedOthers = notMigratedCount - 1;

    const handleSaveAndExit = () => {
        if (notMigratedUsers.length > 0) {
            setWarningModalOpen(true);
            return;
        }

        void withLoading(handleFinalize());
    };

    const handleWarningConfirmation = async () => {
        setWarningModalOpen(false);
        void withLoading(handleFinalize());
    };

    const withoutString = notMigratedUsers.at(0)?.AdminSetName ?? '';

    const warningSpecifics =
        notMigratedCount > 2
            ? c('Info').ngettext(
                  msgid`Are you sure you want to continue without ${withoutString} and ${notMigratedOthers} other?`,
                  `Are you sure you want to continue without ${withoutString} and ${notMigratedOthers} others?`,
                  notMigratedOthers
              )
            : c('Info').t`Are you sure you want to continue without ${withoutString}?`;

    return (
        <div className="max-w-custom" style={{ '--max-w-custom': '42rem' }}>
            <div className="flex justify-space-between flex-nowrap items-center gap-4 mb-4">
                <h3 className="text-4xl text-bold">{c('Title').t`Final step`}</h3>
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
                        {c('Warning').t`We've noticed some users have not claimed their ${BRAND_NAME} accounts.`}{' '}
                        {c('Warning')
                            .t`Users who haven't claimed their account before the migration is finalized will need to request a password reset from their ${BRAND_NAME} organization administrator.`}
                    </span>
                </Banner>
            )}
            <p className="color-weak m-0">
                {c('Info')
                    .t`You're almost done, you need to configure your domain to receive your emails directly on ${BRAND_NAME}. Once confirmed, your team will stop receiving new emails on ${mailAppName} and the migration will be completed.`}
            </p>
            <p className="color-weak">
                {c('Info')
                    .t`Delete any pre-existing MX codes, then copy the below codes and paste it in the DNS section of your domain host.`}
            </p>
            <DNSGroupRecords group={group} subdomain={model.subdomain} />
            <BorderedContainer className="mb-4 mt-2">
                <BorderedContainerItem
                    className="flex flex-row flex-nowrap items-center gap-2 justify-space-between"
                    paddingClassName="py-2 px-5"
                >
                    <div>
                        <p className="m-0 text-semibold">{c('Label').t`Confirm MX records updated`}</p>
                        <span className="color-weak text-sm">{c('Info').t`Required to complete the migration`}</span>
                    </div>

                    <Button
                        disabled={confirmed}
                        color="norm"
                        className="text-semibold rounded-lg"
                        size="medium"
                        onClick={() => setConfirmed(true)}
                    >{c('Action').t`Confirm`}</Button>
                </BorderedContainerItem>
            </BorderedContainer>

            {loading && <MigratingModal variant="completing" />}

            {renderWarningModal && (
                <ModalTwo {...warningModalProps} size="small" className="rounded-xxl">
                    <ModalTwoHeader
                        title={c('Confirm modal title').t`Some members weren't migrated`}
                        hasClose={false}
                    />
                    <ModalTwoContent>
                        <div className="color-weak">
                            <p className="mt-0 mb-2">{c('Info')
                                .t`You will not be able to copy these users' data later.`}</p>
                            <p className="m-0">{warningSpecifics}</p>
                        </div>
                    </ModalTwoContent>
                    <ModalTwoFooter>
                        <Button disabled={loading} onClick={warningModalProps.onClose}>{c('Action').t`Cancel`}</Button>
                        <Button color="norm" loading={loading} onClick={handleWarningConfirmation}>{c('Action')
                            .t`Confirm`}</Button>
                    </ModalTwoFooter>
                </ModalTwo>
            )}
        </div>
    );
};

export default StepFinal;
