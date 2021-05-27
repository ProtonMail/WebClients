import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { c, msgid } from 'ttag';
import { getUnixTime, fromUnixTime, isBefore, isAfter, add } from 'date-fns';
import {
    classnames,
    generateUID,
    usePopperAnchor,
    DropdownButton,
    TopNavbarListItemSearchButton,
    Dropdown,
    Icon,
    DateInput,
    Radio,
    Button,
    PrimaryButton,
    Label,
    Select,
    useLabels,
    useFolders,
    useAddresses,
    useMailSettings,
    Input,
    useToggle,
    useUser,
    useModals,
    ConfirmModal,
    Toggle,
    Info,
    Progress,
    useFeature,
    FeatureCode,
} from 'react-components';
import { MAILBOX_LABEL_IDS, SECOND, SHOW_MOVED } from 'proton-shared/lib/constants';
import { validateEmailAddress } from 'proton-shared/lib/helpers/email';
import { hasBit } from 'proton-shared/lib/helpers/bitset';
import { buildTreeview, formatFolderName } from 'proton-shared/lib/helpers/folder';
import { FolderWithSubFolders } from 'proton-shared/lib/interfaces/Folder';
import { changeSearchParams, getSearchParams } from 'proton-shared/lib/helpers/url';
import { Recipient } from 'proton-shared/lib/interfaces/Address';
import { wait } from 'proton-shared/lib/helpers/promise';
import { isMobile } from 'proton-shared/lib/helpers/browser';
import { isPaid } from 'proton-shared/lib/user/helpers';

import { getHumanLabelID } from '../../helpers/labels';
import AddressesInput from '../composer/addresses/AddressesInput';
import { extractSearchParameters, keywordToString } from '../../helpers/mailboxUrl';
import { formatSimpleDate } from '../../helpers/date';
import {
    indexKeyExists,
    getOldestTime,
    wasIndexingDone,
    isDBReadyAfterBuilding,
} from '../../helpers/encryptedSearch/esUtils';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';

import './AdvancedSearchDropdown.scss';
import { useClickMailContent } from '../../hooks/useClickMailContent';

interface SearchModel {
    keyword: string;
    labelID: string;
    from: Recipient[];
    to: Recipient[];
    begin?: Date;
    end?: Date;
    address?: string;
    attachments?: number;
    wildcard?: number;
    filter?: string;
}

interface LabelInfo {
    text: string;
    value: string;
    group: string;
}

interface ESState {
    value: number;
    startTime: number;
    endTime: number;
    oldestTime: number;
    previousValue: number;
}

const defaultESState = {
    value: 0,
    startTime: 0,
    endTime: 0,
    oldestTime: 0,
    previousValue: 0,
};
const UNDEFINED = undefined;
const AUTO_WILDCARD = undefined;
const ALL_ADDRESSES = 'all';
const NO_ATTACHMENTS = 0;
const WITH_ATTACHMENTS = 1;
const SHOW_READ_ONLY = 'read';
const SHOW_UNREAD_ONLY = 'unread';
const { INBOX, TRASH, SPAM, STARRED, ARCHIVE, ALL_MAIL, ALL_SENT, SENT, ALL_DRAFTS, DRAFTS } = MAILBOX_LABEL_IDS;
const DEFAULT_MODEL: SearchModel = {
    keyword: '',
    labelID: ALL_MAIL,
    from: [],
    to: [],
    address: ALL_ADDRESSES,
    attachments: UNDEFINED,
    wildcard: AUTO_WILDCARD,
    filter: UNDEFINED,
};

const getRecipients = (value = '') =>
    value
        .split(',')
        .filter(validateEmailAddress)
        .map((Address) => ({ Address, Name: '' }));
const formatRecipients = (recipients: Recipient[] = []) => recipients.map(({ Address }) => Address).join(',');

const folderReducer = (acc: LabelInfo[], folder: FolderWithSubFolders, level = 0) => {
    acc.push({
        text: formatFolderName(level, folder.Name, ' ∙ '),
        value: folder.ID,
        group: c('Group').t`Custom folders`,
    });

    if (Array.isArray(folder.subfolders)) {
        folder.subfolders.forEach((folder) => folderReducer(acc, folder, level + 1));
    }

    return acc;
};

interface Props {
    keyword?: string;
    isNarrow: boolean;
}

const AdvancedSearchDropdown = ({ keyword: fullInput = '', isNarrow }: Props) => {
    const history = useHistory();
    const [uid] = useState(generateUID('advanced-search-dropdown'));
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    useClickMailContent((event) => {
        if (anchorRef.current?.contains(event.target as Node)) {
            // Click on the anchor will already close the dropdown, doing it twice will reopen it
            return;
        }
        close();
    });
    const [labels = [], loadingLabels] = useLabels();
    const [folders, loadingFolders] = useFolders();
    const [addresses, loadingAddresses] = useAddresses();
    const [model, updateModel] = useState<SearchModel>(DEFAULT_MODEL);
    const { state: showMore, toggle: toggleShowMore } = useToggle(false);
    const [user] = useUser();
    const { createModal } = useModals();
    const {
        resumeIndexing,
        getESDBStatus,
        pauseIndexing,
        toggleEncryptedSearch,
        getProgressRecorderRef,
        cacheIndexedDB,
    } = useEncryptedSearchContext();
    const { isBuilding, esEnabled, isDBLimited, isRefreshing } = getESDBStatus();
    const [esState, setESState] = useState<ESState>(defaultESState);
    const { value, previousValue, startTime, endTime, oldestTime } = esState;
    let estimatedMinutes = 0;
    if (value !== 0 && endTime > startTime && startTime !== 0 && value !== previousValue) {
        estimatedMinutes = Math.ceil((((endTime - startTime) / (value - previousValue)) * (1 - value)) / 60000);
    }
    const abortControllerRef = useRef<AbortController>(new AbortController());
    const { loading: loadingESFeature, feature: esFeature } = useFeature(FeatureCode.EnabledEncryptedSearch);

    // Get right keyword value depending on the current situation
    const getKeyword = (keyword: string, reset?: boolean) => {
        if (reset) {
            return UNDEFINED;
        }
        const value = isNarrow ? keyword : keywordToString(keyword);
        if (value) {
            return value;
        }
        return UNDEFINED;
    };

    const handleSubmit = (event: FormEvent, reset?: boolean) => {
        event.preventDefault(); // necessary to not run a basic submission
        event.stopPropagation(); // necessary to not submit normal search from header

        const { keyword, address, begin, end, wildcard, from, to, attachments, filter } = reset ? DEFAULT_MODEL : model;

        history.push(
            changeSearchParams(`/${getHumanLabelID(model.labelID)}`, history.location.hash, {
                keyword: getKeyword(keyword, reset),
                address: address === ALL_ADDRESSES ? UNDEFINED : address,
                from: from.length ? formatRecipients(from) : UNDEFINED,
                to: to.length ? formatRecipients(to) : UNDEFINED,
                begin: begin ? String(getUnixTime(begin)) : UNDEFINED,
                end: end ? String(getUnixTime(end)) : UNDEFINED,
                attachments: typeof attachments === 'number' ? String(attachments) : UNDEFINED,
                wildcard: wildcard ? String(wildcard) : UNDEFINED,
                filter,
                sort: UNDEFINED, // Make sure to reset sort parameter when performing an advanced search
            })
        );

        close();
    };

    const handleReset = (event: FormEvent) => handleSubmit(event, true);

    const confirmationToIndex = () => {
        createModal(
            <ConfirmModal
                onConfirm={resumeIndexing}
                title={c('Title').t`Enable encrypted search`}
                confirm={c('Action').t`Enable`}
                mode="alert"
            >
                {c('Info')
                    .t`This action will download all messages so they can be searched locally. Clearing your browser data will disable this option.`}
            </ConfirmModal>
        );
    };

    const setProgress = async () => {
        while (!abortControllerRef.current.signal.aborted) {
            setESState((esState) => {
                const newValue = getProgressRecorderRef().current;
                if (esState.value === newValue) {
                    return esState;
                }
                return {
                    ...esState,
                    endTime: performance.now(),
                    value: newValue,
                };
            });
            await wait(5 * SECOND);
        }
    };

    const setOldestTime = async () => {
        if (wasIndexingDone(user.ID) && isDBLimited) {
            const oldestTime = await getOldestTime(user.ID, 1000);
            setESState((esState) => {
                return {
                    ...esState,
                    oldestTime,
                };
            });
        }
    };

    const startProgress = async () => {
        abortControllerRef.current = new AbortController();
        const previousValue = getProgressRecorderRef().current;
        setESState((esState) => {
            return {
                ...esState,
                startTime: performance.now(),
                previousValue,
            };
        });
        await wait(10 * SECOND);
        void setProgress();
    };

    const stopProgress = () => {
        abortControllerRef.current.abort();
        setESState(() => defaultESState);
    };

    useEffect(() => {
        if (isOpen) {
            updateModel(() => {
                const { keyword, address, attachments, wildcard, from, to, begin, end } = extractSearchParameters(
                    history.location
                );

                const { filter } = getSearchParams(history.location.search);

                return {
                    ...DEFAULT_MODEL, // labelID re-initialized to ALL_MAIL
                    keyword: keyword || fullInput || '',
                    address,
                    attachments,
                    wildcard,
                    from: getRecipients(from),
                    to: getRecipients(to),
                    begin: begin ? fromUnixTime(begin) : UNDEFINED,
                    end: end ? fromUnixTime(end) : UNDEFINED,
                    filter,
                };
            });
            void setOldestTime();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isBuilding || isRefreshing) {
            void startProgress();
        } else {
            stopProgress();
        }
        void setOldestTime();
    }, [isBuilding, isRefreshing]);

    const loading = loadingLabels || loadingFolders || loadingAddresses || loadingMailSettings || loadingESFeature;

    const treeview: FolderWithSubFolders[] = buildTreeview(folders);

    const labelIDOptions: LabelInfo[] = (
        [
            { value: ALL_MAIL, text: c('Mailbox').t`All`, group: c('Group').t`Default folders` },
            { value: INBOX, text: c('Mailbox').t`Inbox`, group: c('Group').t`Default folders` },
            {
                value: hasBit(mailSettings?.ShowMoved || 0, SHOW_MOVED.DRAFTS) ? ALL_DRAFTS : DRAFTS,
                text: c('Mailbox').t`Drafts`,
                group: c('Group').t`Default folders`,
            },
            {
                value: hasBit(mailSettings?.ShowMoved || 0, SHOW_MOVED.SENT) ? ALL_SENT : SENT,
                text: c('Mailbox').t`Sent`,
                group: c('Group').t`Default folders`,
            },
            { value: STARRED, text: c('Mailbox').t`Starred`, group: c('Group').t`Default folders` },
            { value: ARCHIVE, text: c('Mailbox').t`Archive`, group: c('Group').t`Default folders` },
            { value: SPAM, text: c('Mailbox').t`Spam`, group: c('Group').t`Default folders` },
            { value: TRASH, text: c('Mailbox').t`Trash`, group: c('Group').t`Default folders` },
        ] as LabelInfo[]
    )
        .concat(treeview.reduce<LabelInfo[]>((acc, folder) => folderReducer(acc, folder), []))
        .concat(labels.map(({ ID: value, Name: text }) => ({ value, text, group: c('Group').t`Labels` })));

    const addressOptions = [{ value: ALL_ADDRESSES, text: c('Option').t`All` }].concat(
        addresses.map(({ ID: value, Email: text }) => ({ value, text }))
    );

    // Switches
    const showEncryptedSearch = !isMobile() && !!esFeature && !!esFeature.Value && !!isPaid(user);
    const showAdvancedSearch = !showEncryptedSearch || showMore;
    const showProgress = indexKeyExists(user.ID) && esEnabled && (isBuilding || isRefreshing);
    const showSubTitleSection = wasIndexingDone(user.ID) && esEnabled && !isRefreshing && isDBLimited;

    // Header
    const title = c('Action').t`Search message content`;
    // Remove one day from limit because the last day in IndexedDB might not be complete
    const oldestDate = formatSimpleDate(add(new Date(oldestTime), { days: 1 }));
    const subTitleSection = (
        // translator: the variable is a date, which is already localised
        <span className="color-weak mr0-5">{c('Info').jt`For messages newer than ${oldestDate}`}</span>
    );
    const esToggle = (
        <Toggle
            id="es-toggle"
            className="mlauto flex-item-noshrink"
            checked={(isBuilding || wasIndexingDone(user.ID)) && esEnabled}
            onChange={({ target: { checked } }) => {
                if (checked) {
                    if (!indexKeyExists(user.ID)) {
                        confirmationToIndex();
                    } else if (!isDBReadyAfterBuilding(user.ID)) {
                        void resumeIndexing();
                    } else {
                        toggleEncryptedSearch();
                    }
                } else if (isBuilding) {
                    void pauseIndexing();
                } else {
                    toggleEncryptedSearch();
                }
            }}
            loading={esEnabled && !indexKeyExists(user.ID)}
        />
    );
    const info = (
        <Info
            questionMark
            className="ml0-5"
            title={c('Tooltip')
                .t`This action will download all messages so they can be searched locally. Clearing your browser data or logging out will disable this option.`}
        />
    );

    // Progress indicator
    const progressStatus = isRefreshing
        ? c('Info').t`Updating message content search...`
        : c('Info').t`Activating message content search...`;
    const etaMessage =
        estimatedMinutes === 0 && value !== 1
            ? c('Info').t`Estimating time remaining...`
            : estimatedMinutes <= 1
            ? c('Info').t`Less than a minute remaining`
            : // translator: the variable is a positive integer (written in digits) always strictly bigger than 1
              c('Info').ngettext(
                  msgid`${estimatedMinutes} minute remaining`,
                  `${estimatedMinutes} minutes remaining`,
                  estimatedMinutes
              );
    const progressBar = (
        <Progress value={Math.floor(value * 100)} aria-describedby="timeRemaining" className="mt1 mb1" />
    );

    // Button to show advanced search options
    const showMoreTitle = showMore ? c('Action').t`Show less search options` : c('Action').t`Show more search options`;
    const showMoreText = c('Action').t`Advanced search options`;
    const showMoreButton = (
        <div aria-expanded={showMore} className="flex flex-justify-center mb1">
            <Button shape="ghost" color="norm" onClick={toggleShowMore}>
                {showMoreText}
                <Icon name="caret" className={classnames(['ml0-5', showMore && 'rotateX-180'])} alt={showMoreTitle} />
            </Button>
        </div>
    );

    const dropdownSearchButtonProps = {
        ref: anchorRef,
        isOpen,
        hasCaret: false,
        disabled: loading,
        onClick: () => {
            void cacheIndexedDB();
            toggle();
        },
    };

    return (
        <>
            {isNarrow ? (
                <DropdownButton as={TopNavbarListItemSearchButton} {...dropdownSearchButtonProps} />
            ) : (
                <DropdownButton
                    as={Button}
                    icon
                    shape="ghost"
                    color="weak"
                    className="searchbox-advanced-search-button flex"
                    {...dropdownSearchButtonProps}
                >
                    <Icon
                        name="caret"
                        className={classnames(['searchbox-advanced-search-icon mauto', isOpen && 'rotateX-180'])}
                        alt={c('Action').t`Advanced search`}
                    />
                </DropdownButton>
            )}
            <Dropdown
                id={uid}
                originalPlacement="bottom-right"
                autoClose={false}
                autoCloseOutside={false}
                isOpen={isOpen}
                noMaxSize
                anchorRef={anchorRef}
                onClose={close}
                className="dropdown-content--wide advanced-search-dropdown"
                UNSTABLE_AUTO_HEIGHT
            >
                {showEncryptedSearch && (
                    <div className="pl1 pr1 pt1">
                        <div className="flex flex-column">
                            <div className="flex flew-nowrap mb0-5 flex-align-items-center">
                                <Label
                                    htmlFor="es-toggle"
                                    className="text-bold p0 pr1 flex flex-item-fluid flex-align-items-center"
                                >
                                    {title}
                                    {info}
                                </Label>
                                {esToggle}
                            </div>
                            {showSubTitleSection && subTitleSection}
                        </div>
                        {showProgress && (
                            <div className="bg-strong rounded mt1 p1 flex flex-column">
                                <span className="color-weak" aria-live="polite" aria-atomic="true">
                                    {progressStatus}
                                </span>
                                {progressBar}
                                <span id="timeRemaining" aria-live="polite" aria-atomic="true" className="color-weak">
                                    {etaMessage}
                                </span>
                            </div>
                        )}
                        <hr className="mt1" />
                        {showMoreButton}
                    </div>
                )}
                {showAdvancedSearch && (
                    <form name="advanced-search" className="p1" onSubmit={handleSubmit} onReset={handleReset}>
                        <div className="mb1 flex flex-nowrap on-mobile-flex-column">
                            <Label className="advanced-search-label" htmlFor="search-keyword">{c('Label')
                                .t`Keyword`}</Label>
                            <Input
                                id="search-keyword"
                                value={model.keyword}
                                autoFocus
                                onChange={({ target }) => updateModel({ ...model, keyword: target.value })}
                            />
                        </div>
                        <div className="mb1 flex flex-nowrap on-mobile-flex-column">
                            <Label className="advanced-search-label" htmlFor="labelID">{c('Label').t`Location`}</Label>
                            <Select
                                id="labelID"
                                value={model.labelID}
                                options={labelIDOptions}
                                onChange={({ target }) => updateModel({ ...model, labelID: target.value })}
                            />
                        </div>
                        <div className="mb1 flex flex-nowrap on-mobile-flex-column">
                            <Label className="advanced-search-label" htmlFor="address">{c('Label').t`Address`}</Label>
                            <Select
                                id="address"
                                value={model.address}
                                options={addressOptions}
                                onChange={({ target }) => updateModel({ ...model, address: target.value })}
                            />
                        </div>
                        <div className="mb1 flex flex-nowrap on-mobile-flex-column">
                            <Label title={c('Label').t`Sender`} className="advanced-search-label" htmlFor="from">{c(
                                'Label'
                            ).t`From`}</Label>
                            <div className="flex-item-fluid">
                                <AddressesInput
                                    id="from"
                                    recipients={model.from}
                                    onChange={(from) => updateModel({ ...model, from })}
                                    placeholder={c('Placeholder').t`Name or email address`}
                                />
                            </div>
                        </div>
                        <div className="mb1 flex flex-nowrap on-mobile-flex-column">
                            <Label title={c('Label').t`Recipient`} className="advanced-search-label" htmlFor="to">{c(
                                'Label'
                            ).t`To`}</Label>
                            <div className="flex-item-fluid">
                                <AddressesInput
                                    id="to"
                                    recipients={model.to}
                                    onChange={(to) => updateModel({ ...model, to })}
                                    placeholder={c('Placeholder').t`Name or email address`}
                                />
                            </div>
                        </div>
                        <div className="mb1 flex flex-nowrap on-mobile-flex-column">
                            <Label className="advanced-search-label" htmlFor="begin-date">{c('Label')
                                .t`Between`}</Label>
                            <div className="flex-item-fluid">
                                <DateInput
                                    placeholder={c('Placeholder').t`Start date`}
                                    id="begin-date"
                                    value={model.begin}
                                    onChange={async (begin) => {
                                        if (begin) {
                                            let oldestTime = -1;
                                            if (wasIndexingDone(user.ID) && isDBLimited) {
                                                oldestTime = await getOldestTime(user.ID, 1000);
                                            }
                                            if (oldestTime !== -1 && isBefore(begin, oldestTime)) {
                                                return;
                                            }
                                        }
                                        if (!model.end || isBefore(begin || -Infinity, model.end)) {
                                            updateModel({ ...model, begin });
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <div className="mb1 flex flex-nowrap on-mobile-flex-column">
                            <Label className="advanced-search-label" htmlFor="end-date">{c('Label').t`And`}</Label>
                            <div className="flex-item-fluid">
                                <DateInput
                                    placeholder={c('Placeholder').t`End date`}
                                    id="end-date"
                                    value={model.end}
                                    onChange={(end) =>
                                        (!model.begin || isAfter(end || Infinity, model.begin)) &&
                                        updateModel({ ...model, end })
                                    }
                                />
                            </div>
                        </div>
                        <div className="mb1 flex flex-nowrap on-mobile-flex-column">
                            <Label className="advanced-search-label" id="advanced-search-attachments-label">{c('Label')
                                .t`Attachments`}</Label>
                            <div className="flex-item-fluid pt0-5">
                                <Radio
                                    id="advanced-search-attachments-all"
                                    onChange={() => updateModel({ ...model, attachments: UNDEFINED })}
                                    checked={model.attachments === UNDEFINED}
                                    name="advanced-search-attachments"
                                    aria-describedby="advanced-search-attachments-label"
                                    className="inline-flex mr1"
                                >{c('Attachment radio advanced search').t`All`}</Radio>
                                <Radio
                                    id="advanced-search-attachments-yes"
                                    onChange={() => updateModel({ ...model, attachments: WITH_ATTACHMENTS })}
                                    checked={model.attachments === WITH_ATTACHMENTS}
                                    name="advanced-search-attachments"
                                    aria-describedby="advanced-search-attachments-label"
                                    className="inline-flex mr1"
                                >{c('Attachment radio advanced search').t`Yes`}</Radio>
                                <Radio
                                    id="advanced-search-attachments-no"
                                    onChange={() => updateModel({ ...model, attachments: NO_ATTACHMENTS })}
                                    checked={model.attachments === NO_ATTACHMENTS}
                                    name="advanced-search-attachments"
                                    aria-describedby="advanced-search-attachments-label"
                                >{c('Attachment radio advanced search').t`No`}</Radio>
                            </div>
                        </div>
                        <div className="mb2 flex flex-nowrap on-mobile-flex-column">
                            <Label className="advanced-search-label" id="advanced-search-filter-label">{c('Label')
                                .t`Filter`}</Label>
                            <div className="flex-item-fluid pt0-5">
                                <Radio
                                    id="advanced-search-filter-all"
                                    onChange={() => updateModel({ ...model, filter: UNDEFINED })}
                                    checked={model.filter === UNDEFINED}
                                    name="advanced-search-filter"
                                    aria-describedby="advanced-search-filter-label"
                                    className="inline-flex mr1"
                                >{c('Attachment radio advanced search').t`All`}</Radio>
                                <Radio
                                    id="advanced-search-filter-yes"
                                    onChange={() => updateModel({ ...model, filter: SHOW_READ_ONLY })}
                                    checked={model.filter === SHOW_READ_ONLY}
                                    name="advanced-search-filter"
                                    aria-describedby="advanced-search-filter-label"
                                    className="inline-flex mr1"
                                >{c('Attachment radio advanced search').t`Read`}</Radio>
                                <Radio
                                    id="advanced-search-filter-no"
                                    onChange={() => updateModel({ ...model, filter: SHOW_UNREAD_ONLY })}
                                    checked={model.filter === SHOW_UNREAD_ONLY}
                                    name="advanced-search-filter"
                                    aria-describedby="advanced-search-filter-label"
                                >{c('Attachment radio advanced search').t`Unread`}</Radio>
                            </div>
                        </div>
                        <div className="flex flex-justify-space-between">
                            <Button disabled={!Object.keys(model).length} type="reset">{c('Action').t`Clear`}</Button>
                            <PrimaryButton type="submit">{c('Action').t`Search`}</PrimaryButton>
                        </div>
                    </form>
                )}
            </Dropdown>
        </>
    );
};

export default AdvancedSearchDropdown;
