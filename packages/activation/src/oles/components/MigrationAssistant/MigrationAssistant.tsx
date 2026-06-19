import { type FC, useState } from 'react';

import { c, msgid } from 'ttag';

import { useMembers } from '@proton/account/members/hooks';
import { useMemberAddresses } from '@proton/account/members/useMemberAddresses';
import { useOrganization } from '@proton/account/organization/hooks';
import type { ApiImporterOrganizationUser, ApiImporterProduct } from '@proton/activation/src/api/api.interface';
import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { Card } from '@proton/atoms/Card/Card';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import useNotifications from '@proton/components/hooks/useNotifications';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import { isMemberAddon } from '@proton/payments';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getIsDomainActive } from '@proton/shared/lib/organization/helper';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { useErrorHandler } from '../../errors';
import { createMigrationBatch, setupJoiningLink } from '../../thunk';
import { useProviderUsers } from '../../useProviderUsers';
import type { StepComponentProps } from '../MigrationSetup/MigrationSetup';
import type { UserWithExtendedErrors } from './ImportJournalModal';
import ImportJournalModal, { transferErrorUserFilter } from './ImportJournalModal';
import { isTerminal } from './ImportStatus';
import MigratingModal from './MigratingModal';
import ProviderUsersTable, { ProviderUserColumn, ProviderUserFilter } from './ProviderUsersTable';

const getFallbackErrorMessage = () => c('BOSS').t`An unknown error ocurred. Please refresh the page and try again`;

const getAllowedUsersMessage = (maxMembers: number) =>
    c('BOSS').ngettext(
        msgid`Your current plan allows up to ${maxMembers} user. To migrate additional users, add more seats to your subscription.`,
        `Your current plan allows up to ${maxMembers} users. To migrate additional users, add more seats to your subscription.`,
        maxMembers
    );

const getMigrationStartedText = (n: number) =>
    c('BOSS').ngettext(msgid`Migration started for ${n} user`, `Migration started for ${n} users`, n);

const MigrationAssistant: FC<StepComponentProps> = ({ model, onNext }) => {
    const { createNotification } = useNotifications();
    const handleError = useErrorHandler();
    const [organization] = useOrganization();
    const [members] = useMembers();
    const { value: memberAddressesMap } = useMemberAddresses({ members, partial: true });
    const [providerUsers, , refreshProviderUsers] = useProviderUsers(model.domainName);
    const dispatch = useDispatch();
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();
    const [reportUser, setReportUser] = useState<UserWithExtendedErrors>();

    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const selectableUsers = providerUsers?.filter((u) => !u.ImporterOrganizationUser).map((u) => u.ID) ?? [];
    const filteredSelected = selectedUsers.filter((u) => selectableUsers.includes(u));

    const [migrating, setMigrating] = useState<boolean>(false);

    const [showBannerSeatsWarning, setShowBannerSeatsWarning] = useState(true);

    const relevantCount = providerUsers?.filter(isTerminal).length ?? 0;
    const totalCount = providerUsers?.length ?? 0;

    const allAddresses = new Set(
        Object.values(memberAddressesMap)
            .flat()
            .map((a) => a?.Email)
    );

    const usersToCreate =
        providerUsers?.filter((u) => u.Email !== model.tokens?.at(0)?.Account && !allAddresses.has(u.Email)) ?? [];

    const notEnoughSeats = organization && organization.MaxMembers - organization.UsedMembers < usersToCreate.length;

    const handleAddSeats = () =>
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            disablePlanSelection: true,
            disableCycleSelector: true,
            disableThanksStep: true,
            allowedAddonTypes: [isMemberAddon],
        });

    const handleMigrateUsers = async () => {
        if (!model.importerOrganizationId) {
            createNotification({
                type: 'error',
                text: getFallbackErrorMessage(),
            });

            return;
        }

        try {
            setMigrating(true);

            let { joiningLink } = model;
            if (!joiningLink) {
                joiningLink = await dispatch(setupJoiningLink(model.importerOrganizationId)).unwrap();
                model.update({ joiningLink });
            }

            const { results, errors } = await dispatch(
                createMigrationBatch({
                    importerOrganizationId: model.importerOrganizationId!,
                    domain: model.domain!,
                    providerUsers: providerUsers!,
                    selectedUsers,
                    oauthToken: model.tokens![0],
                    password: joiningLink.password,
                }) as any
            ).unwrap();

            if (results.length) {
                createNotification({
                    text: getMigrationStartedText(results.length),
                });
            }

            model.update({ transferErrors: [...model.transferErrors, ...errors] });

            await refreshProviderUsers().catch(noop);
        } catch (err: any) {
            if (err?.name === 'SeatsError') {
                await handleAddSeats();
                return;
            }

            return handleError(err);
        } finally {
            setMigrating(false);
        }
    };

    const handleViewReport = (user: ApiImporterOrganizationUser) => {
        const transferErrors = model.transferErrors.filter(transferErrorUserFilter(user));

        if (transferErrors.length || isTerminal(user)) {
            return () => setReportUser({ ...user, transferErrors });
        }

        return undefined;
    };

    const migrationUnavailableReason = (() => {
        if (!model.tokens?.length) {
            return c('BOSS').t`Reauthenticate your Google Workspace account to start a migration`;
        }

        if (!filteredSelected.length) {
            return c('BOSS').t`Select at least one user to start a migration`;
        }

        if (!model.domain || !getIsDomainActive(model.domain)) {
            return c('BOSS').t`Verify your domain to start a migration`;
        }
    })();

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

    const banners = [
        showBannerSeatsWarning && notEnoughSeats && (
            <Banner
                key="add-users"
                className="p-2 rounded-xl"
                variant="warning"
                icon={<IcExclamationCircleFilled />}
                onDismiss={() => setShowBannerSeatsWarning(false)}
                dismissibleIconBigger
                opaqueVariant
                borderless
                contentWrapperClassName="flex w-full"
            >
                <span className="flex items-start w-full gap-4">
                    <span className="flex-1 text-left">{getAllowedUsersMessage(organization.MaxMembers)}</span>
                    <InlineLinkButton
                        className="inline-flex items-center gap-2 color-current text-no-decoration text-semibold hover:color-weak mr-2"
                        onClick={handleAddSeats}
                        disabled={loadingSubscriptionModal}
                    >
                        {c('BOSS').t`Add users`}
                        {loadingSubscriptionModal && <CircleLoader size="small" />}
                    </InlineLinkButton>
                </span>
            </Banner>
        ),
    ].filter(isTruthy);

    return (
        <div className="w-full max-w-custom" style={{ '--max-w-custom': '60rem' }}>
            {/* Step title */}
            <div className="flex justify-space-between flex-nowrap items-center gap-4 mb-4">
                <h3 className="text-4xl text-bold">{c('BOSS').t`Migrate accounts to ${BRAND_NAME}`}</h3>
                <div className="flex gap-2 shrink-0 text-semibold">
                    <Button
                        disabled={!onNext}
                        onClick={() => onNext?.()}
                        color="norm"
                        size="medium"
                        className="rounded-lg"
                    >
                        {c('Action').t`Next`}
                    </Button>
                </div>
            </div>
            <p className="color-weak mt-0 max-w-custom" style={{ '--max-w-custom': '42rem' }}>
                {c('BOSS')
                    .t`Select the accounts you would like to bring to ${BRAND_NAME}. You can migrate your whole organization today or start small and bring the rest along when you are ready.`}
            </p>

            {/* Banners */}
            {Boolean(banners.length) && <div className="flex flex-column flex-nowrap gap-2 w-full mb-8">{banners}</div>}

            <Card
                padded={false}
                rounded
                background={false}
                className="shadow-norm bg-elevated border-weak rounded-xl overflow-hidden"
            >
                <section className="flex gap-4" aria-labelledby="migration-status">
                    <h3 id="migration-status" className="sr-only">{c('BOSS').t`Migration status`}</h3>
                    <div className="flex divide-x divide-weak my-2 py-4 gap-4">
                        {/* Users migrated */}
                        <div className="px-6">
                            <div className="color-weak pb-2">{c('BOSS').t`Users migrated`}</div>
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

                {/* Migrate users */}
                <ProviderUsersTable
                    currentUser={model.tokens?.at(0)?.Account}
                    users={providerUsers ?? []}
                    selected={filteredSelected}
                    setSelected={setSelectedUsers}
                    selectable={selectableUsers}
                    disabled={migrating || Boolean(migrationUnavailableReason)}
                    disabledReason={migrationUnavailableReason}
                    onMigrate={handleMigrateUsers}
                    onViewReport={handleViewReport}
                    hiddenColumns={ProviderUserColumn.Activation}
                    hiddenFilters={ProviderUserFilter.ACTIVATED | ProviderUserFilter.NOT_ACTIVATED}
                    transferErrors={model.transferErrors}
                />
            </Card>

            {model.importerOrganizationId && reportUser && (
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

            {migrating && <MigratingModal variant="migrating" />}
        </div>
    );
};

export default MigrationAssistant;
