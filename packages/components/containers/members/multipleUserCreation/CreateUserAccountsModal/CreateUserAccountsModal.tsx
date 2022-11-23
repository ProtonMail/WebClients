import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import {
    AlertModal,
    Checkbox,
    Icon,
    InputTwo,
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
    useLoading,
    useNotifications,
    useOnline,
    useOrganization,
    useOrganizationKey,
} from '@proton/components';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { DOMAIN_STATE } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { escapeRegex, getMatches } from '@proton/shared/lib/helpers/regex';
import { normalize } from '@proton/shared/lib/helpers/string';
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
    DONE,
    OFFLINE,
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
}

const CreateUserAccountsModal = ({ usersToImport, onClose, ...rest }: Props) => {
    const api = useApi();
    const getAddresses = useGetAddresses();
    const [organization, loadingOrganization] = useOrganization();
    const [organizationKey, loadingOrganizationKey] = useOrganizationKey(organization);
    const [organizationCapacityError, setOrganizationCapacityError] = useState<OrganizationCapacityError>();

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
    const [importing, withImporting] = useLoading();

    /**
     * Prompt on browser instance closing if users are being imported
     */
    useBeforeUnload(step === STEPS.IMPORT_USERS);

    /**
     * Abort import when not online
     */
    const online = useOnline();
    useEffect(() => {
        if (!online && importing) {
            abortControllerRef.current?.abort();
            setStep(STEPS.OFFLINE);
        }
    }, [online, importing]);

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

    const importUsers = async () => {
        if (!online) {
            return;
        }

        const error = validateAddUser(organization, organizationKey, verifiedDomains);
        if (error) {
            return createNotification({ type: 'error', text: error });
        }

        if (!organizationKey?.privateKey) {
            return createNotification({ type: 'error', text: c('Error').t`Organization key is not decrypted` });
        }

        const selectedUsers = usersToImport.filter((user) => selectedUserIds.includes(user.id));

        try {
            validateOrganizationCapacity(selectedUsers, organization);
        } catch (error: any) {
            if (error instanceof OrganizationCapacityError) {
                setOrganizationCapacityError(error);
                setStep(STEPS.ORGANIZATION_VALIDATION_ERROR);
                return;
            }
        }

        abortControllerRef.current = new AbortController();
        setStep(STEPS.IMPORT_USERS);

        for (let i = 0; i < selectedUsers.length; i++) {
            const signal = abortControllerRef.current.signal;
            if (signal.aborted) {
                return;
            }

            const user = selectedUsers[i];
            try {
                await createUser({
                    user,
                    api: getSilentApi(api),
                    getAddresses,
                    organizationKey: organizationKey.privateKey,
                });

                setSuccessfullyCreatedUsers((successfullyCreatedUsers) => [...successfullyCreatedUsers, user]);
            } catch (error: any) {
                if (error.cancel) {
                    /**
                     * Handle auth prompt cancel
                     */
                    abortControllerRef.current.abort();
                    setStep(STEPS.SELECT_USERS);
                } else if (error instanceof InvalidAddressesError) {
                    const addresses = error.addresses;
                    setInvalidAddresses((invalidAddresses) => [...invalidAddresses, ...addresses]);
                } else if (error instanceof UnavailableAddressesError) {
                    const addresses = error.addresses;
                    setUnavailableAddresses((unavailableAddresses) => [...unavailableAddresses, ...addresses]);
                } else {
                    setFailedUsers((failedUsers) => [...failedUsers, user]);
                }
            }

            setCurrentProgress((currentProgress) => currentProgress + 1);
        }

        await call();
        setStep(STEPS.DONE);
    };

    if (organizationCapacityError && step === STEPS.ORGANIZATION_VALIDATION_ERROR) {
        return (
            <OrganizationCapacityErrorModal
                error={organizationCapacityError}
                onOk={() => setStep(STEPS.SELECT_USERS)}
                {...rest}
            />
        );
    }

    if (step === STEPS.OFFLINE) {
        return (
            <AlertModal
                title={c('Title').t`No internet connection`}
                buttons={[<Button onClick={onClose}>{c('Action').t`Ok`}</Button>]}
                {...rest}
            >
                {c('Info').t`Please check your connection and try again.`}
            </AlertModal>
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
                    <div className="flex flex-justify-space-between flex-align-items-center flex-gap-1 create-user-accounts-additional-content mt1">
                        <Checkbox
                            id="selectAll"
                            checked={isSelectAllChecked}
                            onChange={handleSelectAllFilteredOptionsClick}
                        >
                            {c('Checkbox label').t`All`}
                        </Checkbox>
                        <InputTwo
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
                                const humanReadableStorage = humanSize(totalStorage);

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
                                            <ul className="unstyled m0">
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
                        <span className="mt0-5">
                            {currentProgress} / {numberOfUsersToImport}
                        </span>
                        <p className="mt1 color-weak mb0">
                            {c('Info')
                                .t`This could take up to 15 minutes. Please do not close this page or disconnect from the internet.`}
                        </p>
                    </>
                ),
                footerClassName: 'flex-justify-end',
                footer: <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            };
        }

        if (step === STEPS.DONE) {
            const title = successfullyCreatedUsers.length
                ? c('Title').ngettext(
                      msgid`Successfully created ${successfullyCreatedUsers.length} user account`,
                      `Successfully created ${successfullyCreatedUsers.length} user accounts`,
                      successfullyCreatedUsers.length
                  )
                : c('Title').t`Couldn’t create accounts`;

            return {
                size: 'small',
                title,
                content: (
                    <>
                        {failedUsers.length && !invalidAddresses.length && !unavailableAddresses.length
                            ? c('Info')
                                  .t`Please check your file for errors, or contact customer support for more information.`
                            : null}

                        {invalidAddresses.length ? (
                            <>
                                <p className="mt0">
                                    {c('Info').ngettext(
                                        msgid`The following address is invalid.`,
                                        `The following addresses are invalid.`,
                                        invalidAddresses.length
                                    )}
                                </p>
                                <ul className="unstyled">
                                    {invalidAddresses.map((address) => {
                                        return (
                                            <li key={address} className="mb0 text-ellipsis" title={address}>
                                                {address}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </>
                        ) : null}

                        {unavailableAddresses.length ? (
                            <>
                                <p className="mt0">
                                    {c('Info').ngettext(
                                        msgid`The following address is unavailable.`,
                                        `The following addresses are unavailable.`,
                                        unavailableAddresses.length
                                    )}
                                </p>
                                <ul className="unstyled">
                                    {unavailableAddresses.map((address) => {
                                        return (
                                            <li key={address} className="mb0 text-ellipsis" title={address}>
                                                {address}
                                            </li>
                                        );
                                    })}
                                </ul>
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
