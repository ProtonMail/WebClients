import type { ChangeEvent, JSX } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { InvalidAddressesError, UnavailableAddressesError, createMember } from '@proton/account';
import validateAddUser from '@proton/account/members/validateAddUser';
import { Button, Input } from '@proton/atoms';
import {
    useApi,
    useEventManager,
    useGetAddresses,
    useGetOrganization,
    useGetOrganizationKey,
    useGetUser,
    useGetUserKeys,
    useNotifications,
    useSubscription,
} from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import Checkbox from '@proton/components/components/input/Checkbox';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import Progress from '@proton/components/components/progress/Progress';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import Marks from '@proton/components/components/text/Marks';
import useKTVerifier from '@proton/components/containers/keyTransparency/useKTVerifier';
import useBeforeUnload from '@proton/components/hooks/useBeforeUnload';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { getIsOfflineError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getSilentApiWithAbort } from '@proton/shared/lib/api/helpers/customConfig';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { MEMBER_PRIVATE, MEMBER_ROLE } from '@proton/shared/lib/constants';
import { getEmailParts } from '@proton/shared/lib/helpers/email';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { escapeRegex, getMatches } from '@proton/shared/lib/helpers/regex';
import { normalize } from '@proton/shared/lib/helpers/string';
import { getHasVpnB2BPlan } from '@proton/shared/lib/helpers/subscription';
import type { Domain, EnhancedMember } from '@proton/shared/lib/interfaces';
import { CreateMemberMode } from '@proton/shared/lib/interfaces';
import { getOrganizationKeyInfo } from '@proton/shared/lib/organization/helper';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';
import removeIndex from '@proton/utils/removeIndex';

import useVerifyOutboundPublicKeys from '../../../keyTransparency/useVerifyOutboundPublicKeys';
import type { CsvConfig } from '../csv';
import type { UserTemplate } from '../types';
import OrganizationCapacityErrorModal from './OrganizationCapacityErrorModal';
import validateOrganizationCapacity, { OrganizationCapacityError } from './validateOrganizationCapacity';

enum STEPS {
    SELECT_USERS,
    IMPORT_USERS,
    ORGANIZATION_VALIDATION_ERROR,
    DONE_WITH_ERRORS,
}

const getCreatedText = (n: number) => {
    return c('Title').ngettext(
        msgid`Successfully created ${n} user account`,
        `Successfully created ${n} user accounts`,
        n
    );
};

const search = (text: string, regex: RegExp | undefined) => {
    return {
        text,
        chunks: regex ? getMatches(regex, normalize(text, true)) : [],
    };
};

const filterOptions = (searchValue: string, usersToImport: UserTemplate[]) => {
    const normalizedSearchText = searchValue.length ? normalize(searchValue, true) : undefined;
    const regex = normalizedSearchText?.length ? new RegExp(escapeRegex(normalizedSearchText), 'gi') : undefined;
    return usersToImport
        .map((option) => {
            return {
                ...option,
                displayName: search(option.displayName, regex),
                emailAddresses: option.emailAddresses.map((emailAddress) => {
                    return search(emailAddress, regex);
                }),
            };
        })
        .filter(
            ({ displayName, emailAddresses }) =>
                !normalizedSearchText?.length ||
                displayName.chunks.length ||
                emailAddresses.some((emailAddress) => emailAddress.chunks.length)
        );
};

interface Props extends ModalProps {
    mode: CreateMemberMode;
    members: EnhancedMember[] | undefined;
    usersToImport: UserTemplate[];
    app: APP_NAMES;
    verifiedDomains: Domain[];
    expectedCsvConfig: CsvConfig;
    disableStorageValidation?: boolean;
    disableDomainValidation?: boolean;
    disableAddressValidation?: boolean;
}

const CreateUserAccountsModal = ({
    mode,
    members,
    verifiedDomains,
    usersToImport,
    app,
    onClose,
    expectedCsvConfig,
    disableStorageValidation,
    disableDomainValidation,
    disableAddressValidation,
    ...rest
}: Props) => {
    const api = useApi();
    const dispatch = useDispatch();
    const getAddresses = useGetAddresses();
    const getOrganization = useGetOrganization();
    const getOrganizationKey = useGetOrganizationKey();
    const [organizationCapacityError, setOrganizationCapacityError] = useState<OrganizationCapacityError>();
    const getUserKeys = useGetUserKeys();
    const getUser = useGetUser();
    const verifyOutboundPublicKeys = useVerifyOutboundPublicKeys();
    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(api, async () => getUser());

    const [subscription] = useSubscription();
    const hasVpnB2bPlan = getHasVpnB2BPlan(subscription);

    const abortControllerRef = useRef<AbortController>();
    const { createNotification } = useNotifications();
    const { call, stop, start } = useEventManager();

    const [step, setStep] = useState<STEPS>(STEPS.SELECT_USERS);

    const [searchValue, setSearchValue] = useState('');
    const filteredOptions = useMemo(() => filterOptions(searchValue, usersToImport), [searchValue, usersToImport]);

    const [selectedUserIds, setSelectedUserIds] = useState<string[]>(() => {
        const existingNamesSet = new Set((members ?? []).map((member) => member.Name));
        const existingAddressesSet = new Set(
            (members ?? []).flatMap((member) => (member.Addresses ?? []).map((address) => address.Email))
        );
        return usersToImport
            .filter((userTemplate) => {
                const nameExists = existingNamesSet.has(userTemplate.displayName);
                const addressExists = userTemplate.emailAddresses.some((email) => existingAddressesSet.has(email));
                return !nameExists && !addressExists;
            })
            .map((userTemplate) => userTemplate.id);
    });
    const [successfullyCreatedUsers, setSuccessfullyCreatedUsers] = useState<UserTemplate[]>([]);
    const [currentProgress, setCurrentProgress] = useState(0);
    const [failedUsers, setFailedUsers] = useState<UserTemplate[]>([]);
    const [invalidAddresses, setInvalidAddresses] = useState<string[]>([]);
    const [invalidInvitationAddresses, setInvalidInvitationAddresses] = useState<string[]>([]);
    const [unavailableAddresses, setUnavailableAddresses] = useState<string[]>([]);
    const [orphanedAddresses, setOrphanedAddresses] = useState<string[]>([]);
    const [importing, withImporting] = useLoading();

    /**
     * Prompt on browser instance closing if users are being imported
     */
    useBeforeUnload(step === STEPS.IMPORT_USERS);

    /**
     * Setup abort controller used when importing users
     */
    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    const handleSelectAllFilteredOptionsClick = (event: ChangeEvent<HTMLInputElement>) => {
        const filteredOptionIds = filteredOptions.map(({ id }) => id);
        if (event.target.checked) {
            /**
             * We want to only select the filtered options so we merge the
             * currently filtered option ids with already selected user ids
             */
            setSelectedUserIds((selectedUserIds) => {
                return [...new Set([...selectedUserIds, ...filteredOptionIds])];
            });
            return;
        }

        /**
         * We want to only unselect the filtered options so we remove the
         * currently filtered option ids from the selected user ids
         */
        setSelectedUserIds((selectedUserIds) => selectedUserIds.filter((id) => !filteredOptionIds.includes(id)));
    };

    const isSelectAllChecked = useMemo(() => {
        /**
         * Is checked if all filtered option ids are currently selected
         */
        return filteredOptions.map(({ id }) => id).every((id) => selectedUserIds.includes(id));
    }, [filteredOptions, selectedUserIds]);

    const handleCheckboxChange = (userId: string) => {
        const selectedIndex = selectedUserIds.indexOf(userId);

        if (selectedIndex === -1) {
            /**
             * Item is not currently selected so we add it to selectedUserIds
             */
            setSelectedUserIds((selectedUserIds) => [...selectedUserIds, userId]);
            return;
        }

        /**
         * Item selected so we remove it from selectedUserIds
         */
        setSelectedUserIds((selectedUserIds) => removeIndex(selectedUserIds, selectedIndex));
    };

    const setImportUsersStep = () => {
        setCurrentProgress(0);
        setStep(STEPS.IMPORT_USERS);
    };

    const importUsers = async ({ skipCapacityValidation = false }: { skipCapacityValidation?: boolean } = {}) => {
        const selectedUsers = usersToImport
            .filter((user) => selectedUserIds.includes(user.id))
            .map((user) => {
                if (hasVpnB2bPlan) {
                    return {
                        ...user,
                        vpnAccess: true,
                    };
                }

                return user;
            });

        const organization = await getOrganization();
        const organizationKey = await getOrganizationKey();
        const addresses = await getAddresses();
        const organizationKeyInfo = getOrganizationKeyInfo(organization, organizationKey, addresses);
        const error = validateAddUser({
            privateUser: selectedUsers.length > 0 && selectedUsers.every((user) => user.privateSubUser),
            organization,
            organizationKeyInfo,
            verifiedDomains,
            disableStorageValidation,
            disableDomainValidation,
            disableAddressValidation,
        });
        if (error) {
            return createNotification({ type: 'error', text: error });
        }

        if (!skipCapacityValidation) {
            try {
                validateOrganizationCapacity(selectedUsers, organization);
            } catch (error: any) {
                if (error instanceof OrganizationCapacityError) {
                    setOrganizationCapacityError(error);
                    setStep(STEPS.ORGANIZATION_VALIDATION_ERROR);
                    return;
                }
            }
        }

        abortControllerRef.current = new AbortController();
        setImportUsersStep();

        const localSuccessfullyCreatedUsers: UserTemplate[] = [];
        const localFailedUsers: UserTemplate[] = [];
        const localInvalidAddresses: string[] = [];
        const localInvalidInvitationAddresses: string[] = [];
        const localUnavailableAddresses: string[] = [];
        const localOrphanedAddresses: string[] = [];

        const { signal } = abortControllerRef.current;

        const syncState = () => {
            setSuccessfullyCreatedUsers(localSuccessfullyCreatedUsers);

            setFailedUsers(localFailedUsers);
            setInvalidAddresses(localInvalidAddresses);
            setInvalidInvitationAddresses(localInvalidInvitationAddresses);
            setUnavailableAddresses(localUnavailableAddresses);
            setOrphanedAddresses(localOrphanedAddresses);
        };

        stop();

        const silentApi = getSilentApiWithAbort(api, signal);

        for (let i = 0; i < selectedUsers.length; i++) {
            if (signal.aborted) {
                break;
            }

            const user = selectedUsers[i];
            const addresses = user.emailAddresses.map((emailAddress) => {
                const [Local, Domain] = getEmailParts(emailAddress);
                return {
                    Local,
                    Domain,
                };
            });
            try {
                await dispatch(
                    createMember({
                        api: silentApi,
                        single: false,
                        member: {
                            mode,
                            name: user.displayName,
                            private: user.privateSubUser ? MEMBER_PRIVATE.UNREADABLE : MEMBER_PRIVATE.READABLE,
                            password: user.password,
                            addresses,
                            storage: Math.round(user.totalStorage),
                            invitationEmail: user.invitationEmail || '',
                            role: MEMBER_ROLE.ORGANIZATION_MEMBER,
                            numAI: false,
                            vpn: user.vpnAccess,
                        },
                        verifiedDomains,
                        validationOptions: {
                            disableStorageValidation,
                            disableDomainValidation,
                            disableAddressValidation,
                        },
                        keyTransparencyCommit,
                        keyTransparencyVerify,
                        verifyOutboundPublicKeys,
                    })
                );

                localSuccessfullyCreatedUsers.push(user);
            } catch (error: any) {
                if (getIsOfflineError(error)) {
                    abortControllerRef.current.abort();

                    const unattemptedUsers = selectedUsers.slice(i);
                    localFailedUsers.push(...unattemptedUsers);
                    syncState();
                    setStep(STEPS.DONE_WITH_ERRORS);
                } else if (error.cancel) {
                    /**
                     * Handle auth prompt cancel
                     */
                    abortControllerRef.current.abort();
                    setStep(STEPS.SELECT_USERS);
                } else if (error instanceof InvalidAddressesError) {
                    localInvalidAddresses.push(...error.invalidAddresses);
                    localInvalidInvitationAddresses.push(...error.invalidInvitationAddresses);
                    localOrphanedAddresses.push(...error.orphanedAddresses);
                } else if (error instanceof UnavailableAddressesError) {
                    localUnavailableAddresses.push(...error.unavailableAddresses.map(({ address }) => address));
                    localOrphanedAddresses.push(...error.orphanedAddresses);
                } else {
                    localFailedUsers.push(user);
                    localOrphanedAddresses.push(...user.emailAddresses);
                }
            }

            setCurrentProgress((currentProgress) => currentProgress + 1);
        }

        start();

        if (localSuccessfullyCreatedUsers.length) {
            const callPromise = call().catch(noop);
            const userKeys = await getUserKeys();
            await keyTransparencyCommit(userKeys);
            await callPromise;
        }

        if (signal.aborted) {
            return;
        }

        syncState();

        if (
            localFailedUsers.length ||
            localInvalidAddresses.length ||
            localInvalidInvitationAddresses.length ||
            localUnavailableAddresses.length
        ) {
            setStep(STEPS.DONE_WITH_ERRORS);
            return;
        }

        onClose?.();
        createNotification({
            type: 'success',
            text: getCreatedText(localSuccessfullyCreatedUsers.length),
        });
    };

    if (organizationCapacityError && step === STEPS.ORGANIZATION_VALIDATION_ERROR) {
        return (
            <OrganizationCapacityErrorModal
                error={organizationCapacityError}
                onCancel={() => setStep(STEPS.SELECT_USERS)}
                onContinue={() => importUsers({ skipCapacityValidation: true }).catch(noop)}
                app={app}
                {...rest}
            />
        );
    }

    const {
        title,
        additionalContent,
        content,
        footerClassName,
        footer,
        size = 'xlarge',
    }: {
        title: string;
        additionalContent?: JSX.Element;
        content?: JSX.Element;
        footerClassName?: string;
        footer: JSX.Element;
        size?: ModalProps['size'];
    } = (() => {
        if (step === STEPS.SELECT_USERS) {
            const isCreateUsersButtonDisabled = !selectedUserIds.length;
            return {
                title: c('Title').t`Create user accounts`,
                additionalContent: (
                    <div className="flex items-center justify-end mt-4 px-3">
                        <Input
                            className="max-w-custom"
                            style={{ '--max-w-custom': '16.875rem' }}
                            placeholder={c('Placeholder').t`Search`}
                            prefix={<Icon name="magnifier" alt={c('Action').t`Search`} />}
                            value={searchValue}
                            onValue={setSearchValue}
                        />
                    </div>
                ),
                content: filteredOptions.length ? (
                    <Table className="table-auto simple-table--is-hoverable">
                        <TableHeader
                            cells={[
                                <Checkbox
                                    id="selectAll"
                                    checked={isSelectAllChecked}
                                    onChange={handleSelectAllFilteredOptionsClick}
                                />,
                                <div>{c('TableHeader').t`Name`}</div>,
                                ...(expectedCsvConfig.mode === CreateMemberMode.Password
                                    ? expectedCsvConfig.multipleAddresses
                                        ? [
                                              <div>{c('TableHeader').t`Email addresses`}</div>,
                                              <div>{c('TableHeader').t`Password`}</div>,
                                          ]
                                        : [
                                              <div>{c('TableHeader').t`Email address`}</div>,
                                              <div>{c('TableHeader').t`Password`}</div>,
                                          ]
                                    : expectedCsvConfig.multipleAddresses
                                      ? [
                                            <div>{c('TableHeader').t`Email addresses`}</div>,
                                            <div>{c('TableHeader').t`Invitation email`}</div>,
                                        ]
                                      : [<div>{c('TableHeader').t`Email address`}</div>]),
                                expectedCsvConfig.includeStorage && (
                                    <div className="text-right">{c('TableHeader').t`Total storage`}</div>
                                ),
                                <div>{c('TableHeader').t`Role`}</div>,
                            ].filter(isTruthy)}
                        />
                        <TableBody colSpan={3}>
                            {filteredOptions.map(
                                ({ id, totalStorage, displayName, emailAddresses, invitationEmail, password }) => {
                                    const isItemSelected = selectedUserIds.indexOf(id) !== -1;
                                    const checkboxId = `user-${id}`;
                                    const humanReadableStorage = humanSize({ bytes: totalStorage, unit: 'GB' });

                                    const emails = (
                                        <TableCell className="align-top">
                                            <ul className="unstyled m-0">
                                                {emailAddresses.map(({ chunks, text }) => (
                                                    <li key={text} className="text-ellipsis" title={text}>
                                                        <Marks chunks={chunks}>{text}</Marks>
                                                    </li>
                                                ))}
                                            </ul>
                                        </TableCell>
                                    );

                                    return (
                                        <tr key={id} onClick={() => handleCheckboxChange(id)}>
                                            <TableCell className="align-top">
                                                <Checkbox id={checkboxId} checked={isItemSelected} readOnly />
                                            </TableCell>
                                            <TableCell key="displayName" className="align-top">
                                                <div title={displayName.text}>
                                                    <Marks chunks={displayName.chunks}>{displayName.text}</Marks>
                                                </div>
                                            </TableCell>
                                            {expectedCsvConfig.mode === CreateMemberMode.Password ? (
                                                <>
                                                    {emails}
                                                    <TableCell className="align-top">{password}</TableCell>
                                                </>
                                            ) : (
                                                <>
                                                    {expectedCsvConfig.multipleAddresses ? (
                                                        <>
                                                            {emails}
                                                            <TableCell className="align-top">
                                                                {invitationEmail}
                                                            </TableCell>
                                                        </>
                                                    ) : (
                                                        <>{emails}</>
                                                    )}
                                                </>
                                            )}
                                            {expectedCsvConfig.includeStorage && (
                                                <TableCell
                                                    className="text-right text-no-wrap align-top"
                                                    title={humanReadableStorage}
                                                >
                                                    {humanReadableStorage}
                                                </TableCell>
                                            )}
                                            <TableCell className="align-top">{c('Info').t`Member`}</TableCell>
                                        </tr>
                                    );
                                }
                            )}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="flex items-center justify-center min-h-custom" style={{ '--min-h-custom': '10em' }}>
                        <p className="color-weak">{c('Create user accounts empty state').t`No search results found`}</p>
                    </div>
                ),
                footer: (
                    <>
                        <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                        <Button
                            color="norm"
                            onClick={() => withImporting(importUsers()).catch(noop)}
                            loading={importing}
                            disabled={isCreateUsersButtonDisabled}
                            data-testid="multiUserUpload:createAccounts"
                        >
                            {selectedUserIds.length
                                ? c('Title').ngettext(
                                      msgid`Create ${selectedUserIds.length} user`,
                                      `Create ${selectedUserIds.length} users`,
                                      selectedUserIds.length
                                  )
                                : c('Action').t`Create users`}
                        </Button>
                    </>
                ),
            };
        }

        if (step === STEPS.IMPORT_USERS) {
            const numberOfUsersToImport = selectedUserIds.length;

            return {
                size: 'small',
                title: c('Title').t`Creating user accounts`,
                content: (
                    <>
                        <Progress className="progress-bar--norm" value={currentProgress} max={numberOfUsersToImport} />
                        <span className="mt-2">
                            {currentProgress} / {numberOfUsersToImport}
                        </span>
                        <p className="mt-4 color-weak mb-0">
                            {c('Info')
                                .t`This could take some time. Please do not close this page or disconnect from the internet.`}
                        </p>
                    </>
                ),
                footerClassName: 'justify-end',
                footer: <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            };
        }

        if (step === STEPS.DONE_WITH_ERRORS) {
            const title = successfullyCreatedUsers.length
                ? getCreatedText(successfullyCreatedUsers.length)
                : c('Title').t`Couldn’t create accounts`;

            const renderAddressList = (addresses: string[]) => {
                return (
                    <ul className="unstyled">
                        {addresses.map((address) => {
                            return (
                                <li key={address} className="mb-0 text-ellipsis" title={address}>
                                    {address}
                                </li>
                            );
                        })}
                    </ul>
                );
            };
            return {
                size: 'small',
                title,
                content: (
                    <>
                        {failedUsers.length &&
                        !invalidAddresses.length &&
                        !unavailableAddresses.length &&
                        !invalidInvitationAddresses.length ? (
                            <p className={clsx('mt-0', !orphanedAddresses.length && 'mb-0')}>
                                {c('Title').ngettext(
                                    msgid`Failed to create ${failedUsers.length} user
                                account.`,
                                    `Failed to create ${failedUsers.length} user accounts.`,
                                    failedUsers.length
                                )}{' '}
                                {c('Info')
                                    .t`Please check your file for errors, or contact customer support for more information.`}
                            </p>
                        ) : null}

                        {invalidAddresses.length ? (
                            <>
                                <p className="mt-0">
                                    {c('Info').ngettext(
                                        msgid`The following address is invalid.`,
                                        `The following addresses are invalid.`,
                                        invalidAddresses.length
                                    )}
                                </p>
                                {renderAddressList(invalidAddresses)}
                            </>
                        ) : null}

                        {invalidInvitationAddresses.length ? (
                            <>
                                <p className="mt-0">
                                    {c('Info').ngettext(
                                        msgid`The following address is invalid.`,
                                        `The following addresses are invalid.`,
                                        invalidInvitationAddresses.length
                                    )}
                                </p>
                                {renderAddressList(invalidInvitationAddresses)}
                            </>
                        ) : null}

                        {unavailableAddresses.length ? (
                            <>
                                <p className="mt-0">
                                    {c('Info').ngettext(
                                        msgid`The following address is unavailable.`,
                                        `The following addresses are unavailable.`,
                                        unavailableAddresses.length
                                    )}
                                </p>
                                {renderAddressList(unavailableAddresses)}
                            </>
                        ) : null}

                        {orphanedAddresses.length ? (
                            <>
                                <p className="mt-0">
                                    {c('Info').ngettext(
                                        msgid`The following address was not created.`,
                                        `The following addresses were not created.`,
                                        orphanedAddresses.length
                                    )}
                                </p>
                                {renderAddressList(orphanedAddresses)}
                            </>
                        ) : null}
                    </>
                ),
                footerClassName: 'justify-end',
                footer: <Button onClick={onClose}>{c('Action').t`Got it`}</Button>,
            };
        }

        throw Error('No step found');
    })();

    return (
        <ModalTwo size={size} onClose={onClose} {...rest}>
            <ModalTwoHeader title={title} additionalContent={additionalContent} />
            <ModalTwoContent>{content}</ModalTwoContent>
            <ModalTwoFooter className={footerClassName}>{footer}</ModalTwoFooter>
        </ModalTwo>
    );
};

export default CreateUserAccountsModal;
