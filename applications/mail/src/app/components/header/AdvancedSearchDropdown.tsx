import React, { useState, useEffect, FormEvent, RefObject } from 'react';
import { History, Location } from 'history';
import { c } from 'ttag';
import { getUnixTime, fromUnixTime, isBefore, isAfter } from 'date-fns';
import {
    classnames,
    generateUID,
    usePopperAnchor,
    DropdownButton,
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
    useContactEmails,
    useMailSettings,
    Input
} from 'react-components';
import { MAILBOX_LABEL_IDS, SHOW_MOVED } from 'proton-shared/lib/constants';
import { validateEmailAddress } from 'proton-shared/lib/helpers/string';
import { hasBit } from 'proton-shared/lib/helpers/bitset';
import { buildTreeview, formatFolderName } from 'proton-shared/lib/helpers/folder';
import { FolderWithSubFolders } from 'proton-shared/lib/interfaces/Folder';
import { changeSearchParams } from 'proton-shared/lib/helpers/url';
import { Recipient } from 'proton-shared/lib/interfaces/Address';

import { getHumanLabelID } from '../../helpers/labels';
import AddressesInput from '../composer/addresses/AddressesInput';
import { extractSearchParameters, keywordToString } from '../../helpers/mailboxUrl';

import './AdvancedSearchDropdown.scss';

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
}

interface LabelInfo {
    text: string;
    value: string;
    group: string;
}

const UNDEFINED = undefined;
const AUTO_WILDCARD = undefined;
const ALL_ADDRESSES = 'all';
const NO_ATTACHMENTS = 0;
const WITH_ATTACHMENTS = 1;
const { INBOX, TRASH, SPAM, ARCHIVE, ALL_MAIL, ALL_SENT, SENT, ALL_DRAFTS, DRAFTS } = MAILBOX_LABEL_IDS;
const DEFAULT_MODEL: SearchModel = {
    keyword: '',
    labelID: ALL_MAIL,
    from: [],
    to: [],
    address: ALL_ADDRESSES,
    attachments: UNDEFINED,
    wildcard: AUTO_WILDCARD
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
        group: c('Group').t`Custom folders`
    });

    if (Array.isArray(folder.subfolders)) {
        folder.subfolders.forEach((folder) => folderReducer(acc, folder, level + 1));
    }

    return acc;
};

interface Props {
    labelID: string;
    keyword?: string;
    history: History;
    location: Location;
    isNarrow: boolean;
}

const AdvancedSearchDropdown = ({ labelID, keyword: fullInput = '', location, history, isNarrow }: Props) => {
    const [uid] = useState(generateUID('advanced-search-dropdown'));
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor();
    const [labels = [], loadingLabels] = useLabels();
    const [folders, loadingFolders] = useFolders();
    const [contactEmails, loadingContactEmails] = useContactEmails();
    const [addresses, loadingAddresses] = useAddresses();
    const [model, updateModel] = useState<SearchModel>(DEFAULT_MODEL);

    const handleSubmit = (event: FormEvent, reset?: boolean) => {
        event.preventDefault(); // necessary to not run a basic submission
        event.stopPropagation(); // necessary to not submit normal search from header

        const { keyword, address, begin, end, wildcard, from, to, attachments } = reset ? DEFAULT_MODEL : model;

        history.push(
            changeSearchParams(`/${getHumanLabelID(model.labelID)}`, location.search, {
                keyword: reset ? UNDEFINED : isNarrow ? keyword || UNDEFINED : keywordToString(fullInput),
                address: address === ALL_ADDRESSES ? UNDEFINED : address,
                from: from.length ? formatRecipients(from) : UNDEFINED,
                to: to.length ? formatRecipients(to) : UNDEFINED,
                begin: begin ? String(getUnixTime(begin)) : UNDEFINED,
                end: end ? String(getUnixTime(end)) : UNDEFINED,
                attachments: attachments ? String(attachments) : UNDEFINED,
                wildcard: wildcard ? String(wildcard) : UNDEFINED
            })
        );

        close();
    };

    const handleReset = (event: FormEvent) => handleSubmit(event, true);

    useEffect(() => {
        if (isOpen) {
            updateModel(() => {
                const { keyword, address, attachments, wildcard, from, to, begin, end } = extractSearchParameters(
                    location
                );

                return {
                    ...DEFAULT_MODEL,
                    keyword: keyword || '',
                    labelID,
                    address,
                    attachments,
                    wildcard,
                    from: getRecipients(from),
                    to: getRecipients(to),
                    begin: begin ? fromUnixTime(begin) : UNDEFINED,
                    end: end ? fromUnixTime(end) : UNDEFINED
                };
            });
        }
    }, [isOpen]);

    const loading = loadingLabels || loadingFolders || loadingAddresses || loadingContactEmails || loadingMailSettings;

    const treeview: FolderWithSubFolders[] = buildTreeview(folders);

    const labelIDOptions: LabelInfo[] = ([
        { value: ALL_MAIL, text: c('Mailbox').t`All`, group: c('Group').t`Default folders` },
        { value: INBOX, text: c('Mailbox').t`Inbox`, group: c('Group').t`Default folders` },
        {
            value: hasBit(mailSettings.ShowMoved, SHOW_MOVED.DRAFTS) ? ALL_DRAFTS : DRAFTS,
            text: c('Mailbox').t`Drafts`,
            group: c('Group').t`Default folders`
        },
        {
            value: hasBit(mailSettings.ShowMoved, SHOW_MOVED.SENT) ? ALL_SENT : SENT,
            text: c('Mailbox').t`Sent`,
            group: c('Group').t`Default folders`
        },
        { value: ARCHIVE, text: c('Mailbox').t`Archive`, group: c('Group').t`Default folders` },
        { value: SPAM, text: c('Mailbox').t`Spam`, group: c('Group').t`Default folders` },
        { value: TRASH, text: c('Mailbox').t`Trash`, group: c('Group').t`Default folders` }
    ] as LabelInfo[])
        .concat(treeview.reduce<LabelInfo[]>((acc, folder) => folderReducer(acc, folder), []))
        .concat(labels.map(({ ID: value, Name: text }) => ({ value, text, group: c('Group').t`Labels` })));

    const addressOptions = [{ value: ALL_ADDRESSES, text: c('Option').t`All` }].concat(
        addresses.map(({ ID: value, Email: text }) => ({ value, text }))
    );

    return (
        <>
            <DropdownButton
                className={classnames([isNarrow ? 'topnav-link' : 'searchbox-advanced-search-button color-white'])}
                buttonRef={anchorRef as RefObject<HTMLButtonElement>}
                isOpen={isOpen}
                onClick={toggle}
                hasCaret={false}
                disabled={loading}
            >
                {isNarrow ? (
                    <Icon name="search" className={classnames(['topnav-icon'])} />
                ) : (
                    <Icon
                        name="caret"
                        className={classnames(['searchbox-advanced-search-icon', isOpen && 'rotateX-180'])}
                    />
                )}
            </DropdownButton>
            <Dropdown
                id={uid}
                originalPlacement="bottom-right"
                autoClose={false}
                autoCloseOutside={false}
                isOpen={isOpen}
                noMaxSize={true}
                anchorRef={anchorRef}
                onClose={close}
                className="dropDown-content--wide"
            >
                <form
                    name="advanced-search"
                    className="advancedSearch p1"
                    onSubmit={handleSubmit}
                    onReset={handleReset}
                >
                    <div className="mb1 flex flex-nowrap onmobile-flex-column">
                        <Label className="advancedSearch-label" htmlFor="search-keyword">{c('Label').t`Keyword`}</Label>
                        <Input
                            id="search-keyword"
                            value={model.keyword}
                            onChange={({ target }) => updateModel({ ...model, keyword: target.value })}
                        />
                    </div>
                    <div className="mb1 flex flex-nowrap onmobile-flex-column">
                        <Label className="advancedSearch-label" htmlFor="labelID">{c('Label').t`Location`}</Label>
                        <Select
                            id="labelID"
                            value={model.labelID}
                            options={labelIDOptions}
                            onChange={({ target }) => updateModel({ ...model, labelID: target.value })}
                        />
                    </div>
                    <div className="mb1 flex flex-nowrap onmobile-flex-column">
                        <Label className="advancedSearch-label" htmlFor="address">{c('Label').t`Address`}</Label>
                        <Select
                            id="address"
                            value={model.address}
                            options={addressOptions}
                            onChange={({ target }) => updateModel({ ...model, address: target.value })}
                        />
                    </div>
                    <div className="mb1 flex flex-nowrap onmobile-flex-column">
                        <Label title={c('Label').t`Sender`} className="advancedSearch-label" htmlFor="from">{c('Label')
                            .t`From`}</Label>
                        <div className="flex-item-fluid">
                            <AddressesInput
                                contacts={contactEmails}
                                contactGroups={[]}
                                id="from"
                                recipients={model.from}
                                onChange={(from) => updateModel({ ...model, from })}
                                placeholder={c('Placeholder').t`Name or email address`}
                            />
                        </div>
                    </div>
                    <div className="mb1 flex flex-nowrap onmobile-flex-column">
                        <Label title={c('Label').t`Recipient`} className="advancedSearch-label" htmlFor="to">{c('Label')
                            .t`To`}</Label>
                        <div className="flex-item-fluid">
                            <AddressesInput
                                contacts={contactEmails}
                                contactGroups={[]}
                                id="to"
                                recipients={model.to}
                                onChange={(to) => updateModel({ ...model, to })}
                                placeholder={c('Placeholder').t`Name or email address`}
                            />
                        </div>
                    </div>
                    <div className="mb1 flex flex-nowrap onmobile-flex-column">
                        <Label className="advancedSearch-label" htmlFor="begin-date">{c('Label').t`Between`}</Label>
                        <div className="flex-item-fluid">
                            <DateInput
                                placeholder={c('Placeholder').t`Start date`}
                                id="begin-date"
                                value={model.begin}
                                onChange={(begin) =>
                                    (!model.end || isBefore(begin || -Infinity, model.end)) &&
                                    updateModel({ ...model, begin })
                                }
                            />
                        </div>
                    </div>
                    <div className="mb1 flex flex-nowrap onmobile-flex-column">
                        <Label className="advancedSearch-label" htmlFor="end-date">{c('Label').t`And`}</Label>
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
                    <div className="mb2 flex flex-nowrap onmobile-flex-column">
                        <Label className="advancedSearch-label">{c('Label').t`Attachments`}</Label>
                        <div className="flex-item-fluid">
                            <Radio
                                id="advanced-search-attachments-all"
                                onChange={() => updateModel({ ...model, attachments: UNDEFINED })}
                                checked={model.attachments === UNDEFINED}
                                className="mr1"
                            >{c('Attachment radio advanced search').t`All`}</Radio>
                            <Radio
                                id="advanced-search-attachments-yes"
                                onChange={() => updateModel({ ...model, attachments: WITH_ATTACHMENTS })}
                                checked={model.attachments === WITH_ATTACHMENTS}
                                className="mr1"
                            >{c('Attachment radio advanced search').t`Yes`}</Radio>
                            <Radio
                                id="advanced-search-attachments-no"
                                onChange={() => updateModel({ ...model, attachments: NO_ATTACHMENTS })}
                                checked={model.attachments === NO_ATTACHMENTS}
                            >{c('Attachment radio advanced search').t`No`}</Radio>
                        </div>
                    </div>
                    <div className="flex flex-spacebetween">
                        <Button disabled={!Object.keys(model).length} type="reset">{c('Action').t`Clear`}</Button>
                        <PrimaryButton type="submit">{c('Action').t`Search`}</PrimaryButton>
                    </div>
                </form>
            </Dropdown>
        </>
    );
};

export default AdvancedSearchDropdown;
