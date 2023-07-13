import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button, Input } from '@proton/atoms';
import {
    Checkbox,
    Icon,
    Marks,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Progress,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    useApi,
    useBeforeUnload,
    useDomains,
    useEventManager,
    useGetAddresses,
    useGetUserKeys,
    useKTVerifier,
    useNotifications,
    useOrganization,
    useOrganizationKey,
    useUser,
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import { getIsOfflineError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getSilentApiWithAbort } from '@proton/shared/lib/api/helpers/customConfig';
import { APP_NAMES, DOMAIN_STATE } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { escapeRegex, getMatches } from '@proton/shared/lib/helpers/regex';
import { normalize } from '@proton/shared/lib/helpers/string';
import clsx from '@proton/utils/clsx';
import removeIndex from '@proton/utils/removeIndex';

import validateAddUser from '../../validateAddUser';
import InvalidAddressesError from '../errors/InvalidAddressesError';
import UnavailableAddressesError from '../errors/UnavailableAddressesError';
import { createUser } from '../lib';
import { UserTemplate } from '../types';
import OrganizationCapacityErrorModal from './OrganizationCapacityErrorModal';
import validateOrganizationCapacity, { OrganizationCapacityError } from './validateOrganizationCapacity';

import './CreateUserAccountsModal.scss';

const { DOMAIN_STATE_ACTIVE } = DOMAIN_STATE;

enum STEPS {
    SELECT_USERS,
    IMPORT_USERS,
    ORGANIZATION_VALIDATION_ERROR,
    DONE_WITH_ERRORS,
}

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
    usersToImport: UserTemplate[];
    app: APP_NAMES;
}

const CreateUserAccountsModal = ({ usersToImport, app, onClose, ...rest }: Props) => {
    const api = useApi();
    const getAddresses = useGetAddresses();
    const [organization, loadingOrganization] = useOrganization();
    const [organizationKey, loadingOrganizationKey] = useOrganizationKey(organization);
    const [organizationCapacityError, setOrganizationCapacityError] = useState<OrganizationCapacityError>();
    const [user] = useUser();
    const getUserKeys = useGetUserKeys();
    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(api, async () => user);

    const [domains, loadingDomains] = useDomains();
    const verifiedDomains = useMemo(
        () => (domains || []).filter(({ State }) => State === DOMAIN_STATE_ACTIVE),
        [domains]
    );

    const abortControllerRef = useRef<AbortController>();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();

    const [step, setStep] = useState<STEPS>(STEPS.SELECT_USERS);

    const [searchValue, setSearchValue] = useState('');
    const filteredOptions = useMemo(() => filterOptions(searchValue, usersToImport), [searchValue, usersToImport]);

    const [selectedUserIds, setSelectedUserIds] = useState<string[]>(usersToImport.map((user) => user.id));
    const [successfullyCreatedUsers, setSuccessfullyCreatedUsers] = useState<UserTemplate[]>([]);
    const [currentProgress, setCurrentProgress] = useState(0);
    const [failedUsers, setFailedUsers] = useState<UserTemplate[]>([]);
    const [invalidAddresses, setInvalidAddresses] = useState<string[]>([]);
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
        const error = validateAddUser(organization, organizationKey, verifiedDomains);
        if (error) {
            return createNotification({ type: 'error', text: error });
        }

        if (!organizationKey?.privateKey) {
            return createNotification({ type: 'error', text: c('Error').t`Organization key is not decrypted` });
        }

        const selectedUsers = usersToImport.filter((user) => selectedUserIds.includes(user.id));

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
        const localUnavailableAddresses: string[] = [];
        const localOrphanedAddresses: string[] = [];

        const { signal } = abortControllerRef.current;

        const syncState = () => {
            setSuccessfullyCreatedUsers(localSuccessfullyCreatedUsers);

            setFailedUsers(localFailedUsers);
            setInvalidAddresses(localInvalidAddresses);
            setUnavailableAddresses(localUnavailableAddresses);
            setOrphanedAddresses(localOrphanedAddresses);
        };

        for (let i = 0; i < selectedUsers.length; i++) {
            if (signal.aborted) {
                return;
            }

            const user = selectedUsers[i];
            try {
                await createUser({
                    user,
                    api: getSilentApiWithAbort(api, signal),
                    getAddresses,
                    organizationKey: organizationKey.privateKey,
                    keyTransparencyVerify,
                });

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
                    localOrphanedAddresses.push(...error.orphanedAddresses);
                } else if (error instanceof UnavailableAddressesError) {
                    localUnavailableAddresses.push(...error.unavailableAddresses);
                    localOrphanedAddresses.push(...error.orphanedAddresses);
                } else {
                    localFailedUsers.push(user);
                    localOrphanedAddresses.push(...user.emailAddresses);
                }
            }

            setCurrentProgress((currentProgress) => currentProgress + 1);
        }

        const userKeys = await getUserKeys();
        await keyTransparencyCommit(userKeys);

        syncState();
        await call();

        if (localFailedUsers.length || localInvalidAddresses.length || localUnavailableAddresses.length) {
            setStep(STEPS.DONE_WITH_ERRORS);
            return;
        }

        createNotification({
            type: 'success',
            text: c('Title').ngettext(
                msgid`Successfully created ${localSuccessfullyCreatedUsers.length} user account`,
                `Successfully created ${localSuccessfullyCreatedUsers.length} user accounts`,
                localSuccessfullyCreatedUsers.length
            ),
        });
        onClose?.();
    };

    if (organizationCapacityError && step === STEPS.ORGANIZATION_VALIDATION_ERROR) {
        return (
            <OrganizationCapacityErrorModal
                error={organizationCapacityError}
                onCancel={() => setStep(STEPS.SELECT_USERS)}
                onContinue={() => importUsers({ skipCapacityValidation: true })}
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
            const isCreateUsersButtonDisabled =
                loadingOrganization || loadingOrganizationKey || loadingDomains || !selectedUserIds.length;
            return {
                title: c('Title').t`Create user accounts`,
                additionalContent: (
                    <div className="flex flex-justify-space-between flex-align-items-center gap-4 create-user-accounts-additional-content mt-4">
                        <Checkbox
                            id="selectAll"
                            checked={isSelectAllChecked}
                            onChange={handleSelectAllFilteredOptionsClick}
                        >
                            {c('Checkbox label').t`All`}
                        </Checkbox>
                        <Input
                            className="max-w270p"
                            placeholder={c('Placeholder').t`Search`}
                            prefix={<Icon name="magnifier" alt={c('Action').t`Search`} />}
                            value={searchValue}
                            onValue={setSearchValue}
                        />
                    </div>
                ),
                content: filteredOptions.length ? (
                    <Table className="table-auto simple-table--is-hoverable create-user-accounts-table">
                        <TableHeader
                            cells={[
                                <div className="display-name-header">{c('TableHeader').t`Display name`}</div>,
                                c('TableHeader').t`Email addresses`,
                                <div className="text-right">{c('TableHeader').t`Total storage`}</div>,
                            ]}
                        />
                        <TableBody colSpan={3}>
                            {filteredOptions.map(({ id, totalStorage, displayName, emailAddresses }) => {
                                const isItemSelected = selectedUserIds.indexOf(id) !== -1;
                                const checkboxId = `user-${id}`;
                                const humanReadableStorage = humanSize(totalStorage, 'GB');

                                return (
                                    <tr key={id} onClick={() => handleCheckboxChange(id)}>
                                        <TableCell key="displayName" className="align-top">
                                            <Checkbox id={checkboxId} checked={isItemSelected} readOnly>
                                                <div title={displayName.text}>
                                                    <Marks chunks={displayName.chunks}>{displayName.text}</Marks>
                                                </div>
                                            </Checkbox>
                                        </TableCell>
                                        <TableCell key="emailAddresses" className="align-top">
                                            <ul className="unstyled m-0">
                                                {emailAddresses.map(({ chunks, text }) => (
                                                    <li key={text} className="text-ellipsis" title={text}>
                                                        <Marks chunks={chunks}>{text}</Marks>
                                                    </li>
                                                ))}
                                            </ul>
                                        </TableCell>
                                        <TableCell
                                            key="totalStorage"
                                            className="text-right text-no-wrap align-top"
                                            title={humanReadableStorage}
                                        >
                                            {humanReadableStorage}
                                        </TableCell>
                                    </tr>
                                );
                            })}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="flex flex-align-items-center flex-justify-center min-h10e">
                        <p className="color-weak">{c('Create user accounts empty state').t`No search results found`}</p>
                    </div>
                ),
                footer: (
                    <>
                        <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                        <Button
                            color="norm"
                            onClick={() => withImporting(importUsers())}
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
                                .t`This could take up to 15 minutes. Please do not close this page or disconnect from the internet.`}
                        </p>
                    </>
                ),
                footerClassName: 'flex-justify-end',
                footer: <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            };
        }

        if (step === STEPS.DONE_WITH_ERRORS) {
            const title = successfullyCreatedUsers.length
                ? c('Title').ngettext(
                      msgid`Successfully created ${successfullyCreatedUsers.length} user account`,
                      `Successfully created ${successfullyCreatedUsers.length} user accounts`,
                      successfullyCreatedUsers.length
                  )
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
                        {failedUsers.length && !invalidAddresses.length && !unavailableAddresses.length ? (
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
                footerClassName: 'flex-justify-end',
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
