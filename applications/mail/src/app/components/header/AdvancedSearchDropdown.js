import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    classnames,
    generateUID,
    usePopperAnchor,
    DropdownButton,
    Dropdown,
    Icon,
    Href,
    DateInput,
    Radio,
    Toggle,
    Button,
    PrimaryButton,
    Label,
    Select,
    useLabels,
    useAddresses,
    useContactEmails,
    useMailSettings,
    Loader
} from 'react-components';
import { MAILBOX_LABEL_IDS, LABEL_EXCLUSIVE, SHOW_MOVED } from 'proton-shared/lib/constants';
import { c } from 'ttag';
import { getUnixTime, fromUnixTime, isBefore, isAfter } from 'date-fns';
import { isEmail } from 'proton-shared/lib/helpers/validators';
import { hasBit } from 'proton-shared/lib/helpers/bitset';

import { changeSearchParams } from '../../helpers/url';
import { getHumanLabelID } from '../../helpers/labels';
import AddressesInput from '../composer/addresses/AddressesInput';

import './AdvancedSearchDropdown.scss';
import { extractSearchParameters, keywordToString } from '../../helpers/mailboxUrl';

const UNDEFINED = undefined;
const AUTO_WILDCARD = undefined;
const ALL_ADDRESSES = 'all';
const NO_WILDCARD = 0;
const NO_ATTACHMENTS = 0;
const WITH_ATTACHMENTS = 1;
const { INBOX, TRASH, SPAM, ARCHIVE, ALL_MAIL, ALL_SENT, SENT, ALL_DRAFTS, DRAFTS } = MAILBOX_LABEL_IDS;
const DEFAULT_MODEL = {
    from: [],
    to: [],
    labelID: ALL_MAIL,
    address: ALL_ADDRESSES,
    attachments: UNDEFINED,
    wildcard: AUTO_WILDCARD
};

const getRecipients = (value = '') =>
    value
        .split(',')
        .filter(isEmail)
        .map((Address) => ({ Address }));
const formatRecipients = (recipients = []) => recipients.map(({ Address }) => Address).join(',');

const AdvancedSearchDropdown = ({ labelID, keyword: fullInput = '', location, history }) => {
    const [uid] = useState(generateUID('advanced-search-dropdown'));
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor();
    const [labels, loadingLabels] = useLabels();
    const [contactEmails, loadingContactEmails] = useContactEmails();
    const [addresses, loadingAddresses] = useAddresses();
    const [model, updateModel] = useState(DEFAULT_MODEL);

    const handleSubmit = (event) => {
        event.preventDefault(); // necessary to not run a basic submission
        event.stopPropagation(); // necessary to not submit normal search from header

        const { labelID, address, start, end, wildcard, from, to, attachments } = model;

        history.push(
            changeSearchParams(
                {
                    ...location,
                    pathname: `/${getHumanLabelID(labelID)}`
                },
                {
                    keyword: keywordToString(fullInput),
                    address: address === ALL_ADDRESSES ? UNDEFINED : address,
                    from: from.length ? formatRecipients(from) : UNDEFINED,
                    to: to.length ? formatRecipients(to) : UNDEFINED,
                    start: start ? getUnixTime(start) : UNDEFINED,
                    end: end ? getUnixTime(end) : UNDEFINED,
                    attachments,
                    wildcard
                }
            )
        );

        close();
    };

    const handleReset = (event) => {
        event.preventDefault();
        close();
    };

    useEffect(() => {
        if (isOpen) {
            updateModel(() => {
                if (!fullInput) {
                    return {
                        ...DEFAULT_MODEL,
                        labelID
                    };
                }

                const { address, attachments, wildcard, from, to, start, end } = extractSearchParameters(location);

                return {
                    ...DEFAULT_MODEL,
                    labelID,
                    address,
                    attachments,
                    wildcard,
                    from: getRecipients(from),
                    to: getRecipients(to),
                    start: start ? fromUnixTime(start) : UNDEFINED,
                    end: end ? fromUnixTime(end) : UNDEFINED
                };
            });
        }
    }, [isOpen]);

    if (loadingLabels || loadingAddresses || loadingContactEmails || loadingMailSettings) {
        return <Loader />;
    }

    const labelIDOptions = [
        { value: ALL_MAIL, text: c('Mailbox').t`All` },
        { value: INBOX, text: c('Mailbox').t`Inbox` },
        {
            value: hasBit(mailSettings.ShowMoved, SHOW_MOVED.DRAFTS) ? ALL_DRAFTS : DRAFTS,
            text: c('Mailbox').t`Drafts`
        },
        { value: hasBit(mailSettings.ShowMoved, SHOW_MOVED.SENT) ? ALL_SENT : SENT, text: c('Mailbox').t`Sent` },
        { value: ARCHIVE, text: c('Mailbox').t`Archive` },
        { value: SPAM, text: c('Mailbox').t`Spam` },
        { value: TRASH, text: c('Mailbox').t`Trash` }
    ]
        .concat(
            labels
                .filter(({ Exclusive }) => Exclusive === LABEL_EXCLUSIVE.FOLDER)
                .map(({ ID: value, Name: text }) => ({ value, text }))
        )
        .concat(
            labels
                .filter(({ Exclusive }) => Exclusive === LABEL_EXCLUSIVE.LABEL)
                .map(({ ID: value, Name: text }) => ({ value, text }))
        );

    const addressOptions = [{ value: ALL_ADDRESSES, text: c('Option').t`All` }].concat(
        addresses.map(({ ID: value, Email: text }) => ({ value, text }))
    );

    return (
        <>
            <DropdownButton
                className="searchbox-advanced-search-button color-white"
                buttonRef={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                hasCaret={false}
            >
                <Icon
                    name="caret"
                    className={classnames(['searchbox-advanced-search-icon', isOpen && 'rotateX-180'])}
                />
            </DropdownButton>
            <Dropdown
                id={uid}
                originalPlacement="bottom-right"
                size="wide"
                autoClose={false}
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
            >
                <form name="advanced-search" className="p1" onSubmit={handleSubmit} onReset={handleReset}>
                    <div className="mb1 flex flex-nowrap onmobile-flex-column">
                        <Label className="advancedSearch-label" htmlFor="exact-match">{c('Label')
                            .t`Exact match`}</Label>
                        <div className="flex-item-fluid flex flex-items-center flex-spacebetween">
                            <Toggle
                                id="exact-match"
                                checked={model.wildcard === AUTO_WILDCARD}
                                onChange={({ target }) =>
                                    updateModel({ ...model, wildcard: target.checked ? AUTO_WILDCARD : NO_WILDCARD })
                                }
                            />
                            <Href url="https://protonmail.com/support/knowledge-base/search/">{c('Link')
                                .t`Learn more`}</Href>
                        </div>
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
                        <Label className="advancedSearch-label" htmlFor="start-date">{c('Label').t`Between`}</Label>
                        <div className="flex-item-fluid">
                            <DateInput
                                placeholder={c('Placeholder').t`Start date`}
                                id="start-date"
                                value={model.start}
                                onChange={(start) =>
                                    (!model.end || isBefore(start, model.end)) && updateModel({ ...model, start })
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
                                    (!model.start || isAfter(end, model.start)) && updateModel({ ...model, end })
                                }
                            />
                        </div>
                    </div>
                    <div className="mb2 flex flex-nowrap onmobile-flex-column">
                        <Label className="advancedSearch-label">{c('Label').t`Attachments`}</Label>
                        <div className="flex-item-fluid">
                            <Radio
                                onChange={() => updateModel({ ...model, attachments: UNDEFINED })}
                                checked={model.attachments === UNDEFINED}
                                className="mr1"
                            >{c('Attachment radio advanced search').t`All`}</Radio>
                            <Radio
                                onChange={() => updateModel({ ...model, attachments: WITH_ATTACHMENTS })}
                                checked={model.attachments === WITH_ATTACHMENTS}
                                className="mr1"
                            >{c('Attachment radio advanced search').t`Yes`}</Radio>
                            <Radio
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

AdvancedSearchDropdown.propTypes = {
    labelID: PropTypes.string.isRequired,
    keyword: PropTypes.string,
    history: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
};

export default AdvancedSearchDropdown;
