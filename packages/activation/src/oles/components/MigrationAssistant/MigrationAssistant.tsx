import { type FC, useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import { useCustomDomains } from '@proton/account/domains/hooks';
import { useMembers } from '@proton/account/members/hooks';
import { useMemberAddresses } from '@proton/account/members/useMemberAddresses';
import { getJoiningLinkHref } from '@proton/account/orgJoiningLink/helpers';
import { useOrganization } from '@proton/account/organization/hooks';
import { patchOrganizationImporter } from '@proton/activation/src/api/api';
import {
    type ApiImporterOrganization,
    ApiImporterOrganizationState,
    type ApiImporterProduct,
} from '@proton/activation/src/api/api.interface';
import { EASY_SWITCH_FEATURES, OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { Banner } from '@proton/atoms/Banner/Banner';
import { Card } from '@proton/atoms/Card/Card';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import EllipsisLoader from '@proton/components/components/loader/EllipsisLoader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import { IcInfoCircleFilled } from '@proton/icons/icons/IcInfoCircleFilled';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';
import { IcSquares } from '@proton/icons/icons/IcSquares';
import { isMemberAddon } from '@proton/payments';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME, SECOND } from '@proton/shared/lib/constants';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { getIsDomainActive } from '@proton/shared/lib/organization/helper';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { type CreateMigrationBatchError, createMigrationBatch } from '../../thunk';
import type { MigrationModel } from '../../types';
import { useProviderTokens } from '../../useProviderTokens';
import { useProviderUsers } from '../../useProviderUsers';
import { ActivationLink } from './ActivationLink';
import DomainSetup from './DomainSetup';
import FinishModal from './FinishModal';
import { isTerminal } from './ImportStatus';
import MigratingModal from './MigratingModal';
import ProviderUsersTable from './ProviderUsersTable';

const getAllowedUsersMessage = (maxMembers: number) =>
    c('BOSS').ngettext(
        msgid`Your current plan allows up to ${maxMembers} user. To migrate additional users, add more seats to your subscription.`,
        `Your current plan allows up to ${maxMembers} users. To migrate additional users, add more seats to your subscription.`,
        maxMembers
    );

const getMigrationStartedText = (n: number) =>
    c('BOSS').ngettext(msgid`Migration started for ${n} user`, `Migration started for ${n} users`, n);

const MigrationAssistant: FC<{ model: MigrationModel }> = ({ model }) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const [organization] = useOrganization();
    const [customDomains] = useCustomDomains();
    const [members] = useMembers();
    const { value: memberAddressesMap } = useMemberAddresses({ members, partial: true });
    const [providerUsers, , refreshProviderUsers] = useProviderUsers(model.domainName!);
    const [tokens] = useProviderTokens(OAUTH_PROVIDER.GSUITE, [EASY_SWITCH_FEATURES.OLES]);
    const dispatch = useDispatch();
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();
    const [finishModalProps, setFinishModalOpen, renderFinishModal] = useModalState();

    const loading = !organization || !providerUsers || !tokens || !customDomains || !members;

    const domain = customDomains?.find((d) => d.DomainName === model.domainName);

    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const selectableUsers = providerUsers?.filter((u) => !u.ImporterOrganizationUser).map((u) => u.ID) ?? [];
    const filteredSelected = selectedUsers.filter((u) => selectableUsers.includes(u));

    const [migrating, setMigrating] = useState<boolean>(false);
    const [transferErrors, setTransferErrors] = useState<CreateMigrationBatchError[]>([]);

    const [showBannerSeatsWarning, setShowBannerSeatsWarning] = useState(true);
    const [showBannerShareActivationLink, setShowBannerShareActivationLink] = useState(true);

    const migratedCount = providerUsers?.filter(isTerminal).length ?? 0;

    const hasAnySubmitted = selectableUsers.length < (providerUsers?.length ?? 0);

    const hasIncompleteUsers =
        providerUsers?.some((u) => Boolean(u.ImporterOrganizationUser) && !isTerminal(u)) ?? false;

    const hasInactiveUsers = providerUsers?.some((u) => u.ImporterOrganizationUser?.HasTemporaryPassword === true);

    const hasCompleted = model.state === ApiImporterOrganizationState.COMPLETED;
    const hasFinalized = model.state === ApiImporterOrganizationState.FINALIZED;

    const showFinalizationWarning = !hasCompleted && !hasFinalized && (hasInactiveUsers || selectableUsers.length > 0);

    const allAddresses = new Set(
        Object.values(memberAddressesMap)
            .flat()
            .map((a) => a?.Email)
    );

    const usersToCreate =
        providerUsers?.filter((u) => u.Email !== tokens?.[0].Account && !allAddresses.has(u.Email)) ?? [];

    const notEnoughSeats = organization && organization.MaxMembers - organization.UsedMembers < usersToCreate.length;

    useEffect(() => {
        let timer: NodeJS.Timeout;

        const refreshAfter = (delay: number) => {
            if (!hasIncompleteUsers && !hasInactiveUsers) {
                return;
            }

            timer = setTimeout(() => {
                refreshProviderUsers().catch(noop);
                refreshAfter(delay);
            }, delay);
        };

        refreshAfter(30 * SECOND);
        return () => clearTimeout(timer);
    }, [hasIncompleteUsers, hasInactiveUsers, refreshProviderUsers]);

    if (loading) {
        return (
            <div className="flex-1 h-full w-full flex flex-nowrap">
                <div className="m-auto text-center">
                    <CircleLoader size="large" />
                    <br />
                    <div className="color-weak mt-2">
                        {c('BOSS').t`Loading your organization data`}
                        <EllipsisLoader />
                    </div>
                </div>
            </div>
        );
    }

    const handleAddSeats = () =>
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            disablePlanSelection: true,
            disableCycleSelector: true,
            disableThanksStep: true,
            allowedAddonTypes: [isMemberAddon],
        });

    const handleMigrateUsers = async () => {
        setMigrating(true);

        try {
            const { results, errors } = await dispatch(
                createMigrationBatch({
                    importerOrganizationId: model.importerOrganizationId!,
                    domain: domain!,
                    providerUsers,
                    selectedUsers,
                    oauthToken: tokens[0],
                    password: model.joiningLink!.password,
                }) as any
            ).unwrap();

            if (results.length) {
                createNotification({
                    text: getMigrationStartedText(results.length),
                });
            }

            setTransferErrors((state) => [...state, ...errors]);
        } catch (err: any) {
            const text: string | undefined = err?.message ?? c('BOSS').t`An unknown error occurred`;

            if (err?.name === 'SeatsError') {
                await handleAddSeats();
                return;
            }

            if (text?.length) {
                createNotification({
                    type: 'error',
                    text,
                });
            }
        } finally {
            await refreshProviderUsers().catch(noop);
            setMigrating(false);
        }
    };

    const activationLink = getJoiningLinkHref({
        ...model.joiningLink!,
        organizationName: organization.Name,
        domainName: model.domainName,
    });

    const handleCopyShareActivationLink = () => {
        if (!activationLink) {
            return;
        }
        textToClipboard(activationLink);
        createNotification({
            type: 'info',
            text: c('Success').t`Activation link copied to clipboard`,
        });
    };

    const handleFinalize = async () => {
        if (model.state >= ApiImporterOrganizationState.COMPLETED) {
            return;
        }

        const newState = await api<ApiImporterOrganization>(
            patchOrganizationImporter(model.importerOrganizationId!, {
                State: ApiImporterOrganizationState.COMPLETED,
            })
        )
            .then(({ State }) => State)
            .catch(() => model.state);

        model.update({
            ...model,
            state: newState,
        });
    };

    const handleCompleteMigration = () => {
        setFinishModalOpen(true);
    };

    const migrationUnavailableReason = (() => {
        if (hasCompleted || hasFinalized) {
            return c('BOSS').t`This migration has been completed`;
        }

        if (!filteredSelected.length) {
            return c('BOSS').t`Select at least one user to start a migration`;
        }

        if (!domain || !getIsDomainActive(domain)) {
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

    const activationLinkVisible = Boolean(!hasFinalized && activationLink && hasAnySubmitted && hasInactiveUsers);

    const banners = hasFinalized
        ? []
        : [
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
              showBannerShareActivationLink && activationLinkVisible && (
                  <Banner
                      key="share-activation-link"
                      className="p-2 rounded-xl"
                      variant="success"
                      icon={<IcInfoCircleFilled />}
                      onDismiss={() => setShowBannerShareActivationLink(false)}
                      dismissibleIconBigger
                      opaqueVariant
                      borderless
                      contentWrapperClassName="flex w-full"
                  >
                      <span className="flex items-start w-full gap-4">
                          <span className="flex-1 text-left">{c('BOSS')
                              .t`Share the activation link to users so they can claim their ${BRAND_NAME} account.`}</span>
                          <InlineLinkButton
                              className="inline-flex items-center gap-2 color-current text-no-decoration text-semibold hover:color-weak mr-2"
                              onClick={handleCopyShareActivationLink}
                          >
                              <IcSquares />
                              {c('BOSS').t`Copy activation link`}
                          </InlineLinkButton>
                      </span>
                  </Banner>
              ),
              !hasCompleted && migratedCount > 0 && !hasIncompleteUsers && Boolean(domain) && (
                  <Banner
                      key="finalize-migration"
                      className="p-2 rounded-xl"
                      variant="success"
                      icon={<IcInfoCircleFilled />}
                      opaqueVariant
                      borderless
                      contentWrapperClassName="flex w-full"
                  >
                      <span className="flex items-start w-full gap-4">
                          <span className="flex-1 text-left">{c('BOSS')
                              .t`Once users have claimed their ${BRAND_NAME} account, finalize the migration.`}</span>
                          <InlineLinkButton
                              className="inline-flex items-center gap-2 color-current text-no-decoration text-semibold hover:color-weak mr-2"
                              onClick={handleCompleteMigration}
                          >
                              <IcCheckmark />
                              {c('BOSS').t`Finalize migration`}
                          </InlineLinkButton>
                      </span>
                  </Banner>
              ),
              hasCompleted && (
                  <Banner
                      key="finalize-migration"
                      className="p-2 rounded-xl"
                      variant="success"
                      icon={<IcInfoCircleFilled />}
                      opaqueVariant
                      borderless
                      contentWrapperClassName="flex w-full"
                  >
                      <span className="flex items-start w-full gap-4">
                          <span className="flex-1 text-left">{c('BOSS')
                              .t`We're still checking the MX records with your domain provider.`}</span>
                          <InlineLinkButton
                              className="inline-flex items-center gap-2 color-current text-no-decoration text-semibold hover:color-weak mr-2"
                              onClick={() => setFinishModalOpen(true)}
                          >
                              <IcMagnifier />
                              {c('BOSS').t`More details`}
                          </InlineLinkButton>
                      </span>
                  </Banner>
              ),
          ].filter(isTruthy);

    return (
        <div className="flex-1 overflow-auto">
            <div className="mx-auto w-full max-w-custom p-4" style={{ '--max-w-custom': '68rem' }}>
                {/* Domain setup */}
                <div className="mt-12 mb-6">
                    <DomainSetup model={model} domain={domain} />
                </div>

                <h3 id="migration-status" className="sr-only">{c('BOSS').t`Migration status`}</h3>
                <section className="flex gap-4 mb-12" aria-labelledby="migration-status">
                    {/* Users migrated */}
                    <Card
                        rounded
                        background={false}
                        className="shadow-norm flex px-0 bg-elevated border-weak rounded-xl w-full sm:w-auto"
                    >
                        <div className="flex divide-x divide-weak my-2">
                            <div className="px-6">
                                <div className="color-weak mb-1">{c('BOSS').t`Users migrated`}</div>
                                <div className="text-bold color-primary text-xl text-tabular-nums">
                                    {c('BOSS').t`${migratedCount} of ${providerUsers.length}`}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Migration includes */}
                    <Card
                        rounded
                        background={false}
                        className="shadow-norm flex px-0 bg-elevated border-weak rounded-xl w-full sm:w-auto"
                    >
                        <div className="flex my-2 px-6 flex-column flex-nowrap gap-1">
                            <span className="color-weak">{c('BOSS').t`Migration includes`}</span>
                            <div className="text-xl text-capitalize">{migrationIncludesText}</div>
                        </div>
                    </Card>
                </section>

                {/* Migrate users */}
                <ProviderUsersTable
                    currentUser={tokens.at(0)?.Account}
                    users={providerUsers}
                    transferErrors={transferErrors}
                    banners={banners}
                    selected={filteredSelected}
                    setSelected={setSelectedUsers}
                    selectable={selectableUsers}
                    disabled={migrating || Boolean(migrationUnavailableReason)}
                    disabledReason={migrationUnavailableReason}
                    onMigrate={handleMigrateUsers}
                    activationLinkVisible={activationLinkVisible}
                />

                {/* Activation link */}
                {activationLinkVisible && <ActivationLink href={activationLink} />}
            </div>

            {renderFinishModal && domain && (
                <FinishModal
                    initialView={showFinalizationWarning ? 'warning' : 'instructions'}
                    onFinalize={handleFinalize}
                    modalProps={finishModalProps}
                />
            )}

            {migrating && <MigratingModal />}
        </div>
    );
};

export default MigrationAssistant;
