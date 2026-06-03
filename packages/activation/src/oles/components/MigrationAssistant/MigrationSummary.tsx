import { type FC, useState } from 'react';

import { c } from 'ttag';

import type { ApiImporterOrganizationUser } from '@proton/activation/src/api/api.interface';
import { ApiImporterOrganizationState, type ApiImporterProduct } from '@proton/activation/src/api/api.interface';
import { Button } from '@proton/atoms/Button/Button';
import { Card } from '@proton/atoms/Card/Card';
import useModalState from '@proton/components/components/modalTwo/useModalState';

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
            Mail: c('BOSS').t`Mail`,
            Calendar: c('BOSS').t`Calendar`,
            Contacts: c('BOSS').t`Contacts`,
            Settings: c('BOSS').t`Settings`,
        };

        const included = model.selectedProducts.map((p) => translations[p]);

        return included.join(', ');
    })();

    const hasFinalized = model.state >= ApiImporterOrganizationState.FINALIZED;

    const relevantCount = users.filter((u) => u.ImporterOrganizationUser?.HasTemporaryPassword === false).length;
    const totalCount = users.length;

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
                        <h3 className="text-4xl text-bold">{c('BOSS').t`Migration summary`}</h3>
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
                                {c('BOSS').t`Waiting for MX...`}
                            </Button>
                        )}
                    </div>

                    <Card
                        padded={false}
                        rounded
                        background={false}
                        className="shadow-norm bg-elevated border-weak rounded-xl overflow-hidden"
                    >
                        <section className="flex gap-4" aria-labelledby="migration-status">
                            <h3 id="migration-status" className="sr-only">{c('BOSS').t`Migration status`}</h3>
                            <div className="flex divide-x divide-weak my-2 py-4">
                                {/* Accounts migrated */}
                                <div className="px-6">
                                    <div className="color-weak pb-2">{c('BOSS').t`Accounts migrated`}</div>
                                    <div className="text-bold color-primary text-xl text-tabular-nums">
                                        {users.length}
                                    </div>
                                </div>

                                {/* Users activated */}
                                <div className="px-6">
                                    <div className="color-weak pb-2">{c('BOSS').t`Users activated`}</div>
                                    <div className="text-bold color-primary text-xl text-tabular-nums">
                                        {c('BOSS').t`${relevantCount} of ${totalCount}`}
                                    </div>
                                </div>

                                {/* Migration includes */}
                                <div className="px-6">
                                    <div className="color-weak pb-2">{c('BOSS').t`Migration includes`}</div>
                                    <div className="text-xl text-capitalize">{migrationIncludesText}</div>
                                </div>
                            </div>
                        </section>

                        <ProviderUsersTable
                            users={users}
                            currentUser={model.tokens?.at(0)?.Account}
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
