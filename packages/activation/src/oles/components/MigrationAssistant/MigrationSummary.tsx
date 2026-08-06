import { type FC, useState } from 'react';

import { c } from 'ttag';

import type { ApiImporterOrganizationUser } from '@proton/activation/src/api/api.interface';
import { ApiImporterOrganizationState, type ApiImporterProduct } from '@proton/activation/src/api/api.interface';
import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { Card } from '@proton/atoms/Card/Card';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { MX_STATE } from '@proton/shared/lib/interfaces';

import type { MigrationModel } from '../../types';
import { useProviderUsers } from '../../useProviderUsers';
import { isTerminal } from '../MigrationAssistant/ImportStatus';
import ProviderUsersTable, { ProviderUserFilter } from '../MigrationAssistant/ProviderUsersTable';
import FinishModal from './FinishModal';
import type { UserWithExtendedErrors } from './ImportJournalModal';
import ImportJournalModal, { transferErrorUserFilter } from './ImportJournalModal';

const MigrationSummary: FC<{ model: MigrationModel }> = ({ model }) => {
    const [providerUsers] = useProviderUsers(model.domainName, true);
    const [reportUser, setReportUser] = useState<UserWithExtendedErrors>();
    const [finishModalProps, setFinishModalOpen, renderFinishModal] = useModalState();

    const users = (providerUsers ?? []).filter((u) => u.ImporterOrganizationUser);

    const migrationIncludesText = (() => {
        const translations: Record<ApiImporterProduct | 'Settings', string> = {
            Mail: c('Label').t`Mail`,
            Calendar: c('Label').t`Calendar`,
            Contacts: c('Label').t`Contacts`,
            Settings: c('Label').t`Settings`,
        };

        const included = model.selectedProducts.map((p) => translations[p]);

        return included.join(', ');
    })();

    const hasFinalized = model.state >= ApiImporterOrganizationState.FINALIZED;

    const relevantCount = users.filter((u) => u.ImporterOrganizationUser?.HasTemporaryPassword === false).length;
    const totalCount = users.length;
    const domainState = model.domain?.MxState ?? MX_STATE.MX_STATE_DEFAULT;
    const thirdPartyMxDetected = [MX_STATE.MX_STATE_NO_US, MX_STATE.MX_STATE_INC_US].includes(domainState);

    const handleViewReport = (user: ApiImporterOrganizationUser) => {
        const transferErrors = model.transferErrors.filter(transferErrorUserFilter(user));

        if (transferErrors.length || isTerminal(user)) {
            return () => setReportUser({ ...user, transferErrors });
        }

        return undefined;
    };

    return (
        <div className="lg:flex flex-1 flex-nowrap flex-column lg:flex-row items-start">
            <div className="w-full px-4 md:px-8 xl:px-12 max-h-full py-12 overflow-auto">
                <div className="w-full">
                    <div className="flex justify-space-between flex-nowrap items-center gap-4 mb-4">
                        <h3 className="text-4xl text-bold">{c('Title').t`Migration summary`}</h3>
                    </div>
                    <div className="flex items-center mt-4 mb-8 gap-2">
                        <p className="m-0 text-lg">{model.domainName}</p>
                        {!hasFinalized && (
                            <Button
                                size="tiny"
                                shape="solid"
                                pill
                                color="warning"
                                className="py-0.5 px-2 mb-0.5"
                                onClick={() => setFinishModalOpen(true)}
                            >
                                {c('Status').t`Waiting for MX...`}
                            </Button>
                        )}
                    </div>

                    {thirdPartyMxDetected && (
                        <Banner
                            key="remove-mx-records"
                            className="p-2 rounded-xl mb-8"
                            variant="warning"
                            icon={<IcExclamationCircleFilled />}
                            opaqueVariant
                            borderless
                            contentWrapperClassName="flex w-full"
                        >
                            <span className="flex items-start w-full gap-4">
                                <span className="flex-1 text-left">
                                    {c('Warning')
                                        .t`Your domain configuration still includes another provider's MX codes.`}{' '}
                                    {c('Warning')
                                        .t`To complete the migration, make sure you keep only ${BRAND_NAME} MX codes.`}
                                </span>
                                <InlineLinkButton
                                    className="inline-flex items-center gap-2 color-current text-no-decoration text-semibold hover:color-weak mr-2"
                                    onClick={() => setFinishModalOpen(true)}
                                >
                                    {c('Action').t`More details`}
                                </InlineLinkButton>
                            </span>
                        </Banner>
                    )}

                    <Card
                        padded={false}
                        rounded
                        background={false}
                        className="shadow-norm bg-elevated border-weak rounded-xl overflow-hidden"
                    >
                        <section className="flex gap-4" aria-labelledby="migration-status">
                            <h3 id="migration-status" className="sr-only">{c('Title').t`Migration status`}</h3>
                            <div className="flex divide-x divide-weak my-2 py-4">
                                {/* Accounts migrated */}
                                <div className="px-6">
                                    <div className="color-weak pb-2">{c('Label').t`Accounts migrated`}</div>
                                    <div className="text-bold color-primary text-xl text-tabular-nums">
                                        {users.length}
                                    </div>
                                </div>

                                {/* Users activated */}
                                <div className="px-6">
                                    <div className="color-weak pb-2">{c('Label').t`Users activated`}</div>
                                    <div className="text-bold color-primary text-xl text-tabular-nums">
                                        {c('Info').t`${relevantCount} of ${totalCount}`}
                                    </div>
                                </div>

                                {/* Migration includes */}
                                <div className="px-6">
                                    <div className="color-weak pb-2">{c('Label').t`Migration includes`}</div>
                                    <div className="text-xl text-capitalize">{migrationIncludesText}</div>
                                </div>
                            </div>
                        </section>

                        <ProviderUsersTable
                            users={users}
                            currentUser={model.tokens?.at(0)?.Account}
                            provider={model.provider}
                            hiddenFilters={
                                ProviderUserFilter.NOT_STARTED |
                                ProviderUserFilter.ERROR |
                                ProviderUserFilter.IN_PROGRESS |
                                ProviderUserFilter.NOT_ACTIVATED
                            }
                            onViewReport={handleViewReport}
                        />
                    </Card>
                </div>
            </div>

            {renderFinishModal && model.domain && (
                <FinishModal initialView="instructions" modalProps={finishModalProps} />
            )}

            {reportUser && (
                <ImportJournalModal
                    importerOrganizationId={model.importerOrganizationId}
                    importedProducts={model.selectedProducts}
                    user={reportUser}
                    modalProps={{
                        open: true,
                        onClose: () => setReportUser(undefined),
                        onExit: () => setReportUser(undefined),
                    }}
                />
            )}
        </div>
    );
};

export default MigrationSummary;
