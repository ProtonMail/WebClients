import { FormEvent, useMemo, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { add, fromUnixTime, getUnixTime, isAfter, isBefore, sub } from 'date-fns';
import { History } from 'history';
import { c } from 'ttag';

import {
    Button,
    DateInput,
    Label,
    Option,
    PrimaryButton,
    Radio,
    SelectTwo,
    classnames,
    useAddresses,
    useUser,
} from '@proton/components';
import { ESIndexingState, wasIndexingDone } from '@proton/encrypted-search';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { omit } from '@proton/shared/lib/helpers/object';
import { changeSearchParams, getSearchParams } from '@proton/shared/lib/helpers/url';
import { Recipient } from '@proton/shared/lib/interfaces/Address';

import { getOldestTimeMail } from '../../../helpers/encryptedSearch/esUtils';
import { getHumanLabelID } from '../../../helpers/labels';
import { extractSearchParameters, keywordToString } from '../../../helpers/mailboxUrl';
import AddressesInput from '../../composer/addresses/AddressesInput';
import EncryptedSearchField from './AdvancedSearchFields/EncryptedSearchField';
import LocationField from './AdvancedSearchFields/LocationField';
import SearchField from './AdvancedSearchFields/SearchField';

interface SearchModel {
    keyword: string;
    labelID: string;
    from: Recipient[];
    to: Recipient[];
    address?: string;
    begin?: Date;
    end?: Date;
    attachments?: number;
    wildcard?: number;
    filter?: string;
}

const UNDEFINED = undefined;
const AUTO_WILDCARD = undefined;
const ALL_ADDRESSES = 'all';
const NO_ATTACHMENTS = 0;
const WITH_ATTACHMENTS = 1;
const { ALL_MAIL } = MAILBOX_LABEL_IDS;
const DEFAULT_MODEL: SearchModel = {
    keyword: '',
    labelID: ALL_MAIL,
    from: [],
    to: [],
    address: ALL_ADDRESSES,
    attachments: UNDEFINED,
    wildcard: AUTO_WILDCARD,
    filter: UNDEFINED,
    begin: undefined,
    end: undefined,
};

const getRecipients = (value = '') =>
    value
        .split(',')
        .filter(validateEmailAddress)
        .map((Address) => ({ Address, Name: '' }));
const formatRecipients = (recipients: Recipient[] = []) => recipients.map(({ Address }) => Address).join(',');

const initializeModel = (history: History, selectedLabelID: string, searchInputValue: string) => () => {
    const { keyword, address, attachments, wildcard, from, to, begin, end } = extractSearchParameters(history.location);

    const { filter } = getSearchParams(history.location.search);

    return {
        ...DEFAULT_MODEL,
        labelID: keyword ? selectedLabelID : ALL_MAIL,
        keyword: searchInputValue ? keyword || '' : '',
        address: address || ALL_ADDRESSES,
        attachments,
        wildcard,
        from: getRecipients(from),
        to: getRecipients(to),
        begin: begin ? fromUnixTime(begin) : UNDEFINED,
        end: end ? sub(fromUnixTime(end), { days: 1 }) : UNDEFINED,
        filter,
    };
};

interface Props {
    isNarrow: boolean;
    showEncryptedSearch: boolean;
    onClose: () => void;
    esState: ESIndexingState;
    isDBLimited: boolean;
    showMore: boolean;
    toggleShowMore: () => void;
    searchInputValue: string;
    labelID: string;
}

const AdvancedSearch = ({
    isNarrow,
    showEncryptedSearch,
    onClose,
    esState,
    isDBLimited,
    showMore,
    searchInputValue,
    toggleShowMore,
    labelID,
}: Props) => {
    const searchInputRef = useRef<HTMLInputElement>(null);
    const history = useHistory();
    const [addresses] = useAddresses();
    const [model, updateModel] = useState<SearchModel>(initializeModel(history, labelID, searchInputValue));
    const [user] = useUser();

    const senderListAnchorRef = useRef<HTMLDivElement>(null);
    const toListAnchorRef = useRef<HTMLDivElement>(null);

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

        const { keyword, begin, end, wildcard, from, to, address, attachments, filter } = reset ? DEFAULT_MODEL : model;

        history.push(
            changeSearchParams(`/${getHumanLabelID(model.labelID)}`, history.location.hash, {
                keyword: getKeyword(keyword, reset),
                from: from.length ? formatRecipients(from) : UNDEFINED,
                to: to.length ? formatRecipients(to) : UNDEFINED,
                address: address === ALL_ADDRESSES ? UNDEFINED : address,
                begin: begin ? String(getUnixTime(begin)) : UNDEFINED,
                end: end ? String(getUnixTime(add(end, { days: 1 }))) : UNDEFINED,
                attachments: typeof attachments === 'number' ? String(attachments) : UNDEFINED,
                wildcard: wildcard ? String(wildcard) : UNDEFINED,
                filter,
                sort: UNDEFINED, // Make sure to reset sort parameter when performing an advanced search
                page: UNDEFINED, // Reset page parameter when performing an advanced search so that search results are shown from the first page
            })
        );

        onClose();
    };

    const handleClear = () => {
        updateModel((currentModel) => ({ ...currentModel, keyword: '' }));
        searchInputRef.current?.focus();
    };

    const handleReset = (event: FormEvent) => {
        event.preventDefault(); // necessary to block native reset behaviour

        updateModel(DEFAULT_MODEL);
        searchInputRef.current?.focus();
    };

    const canReset = useMemo(() => {
        return !isDeepEqual(omit(model, ['labelID']), omit(DEFAULT_MODEL, ['labelID']));
    }, [model]);

    return (
        <form name="advanced-search" onSubmit={handleSubmit} onReset={handleReset}>
            <div className="flex border-bottom pl1 pr1 pt0-25 pb0-5">
                <SearchField
                    unstyled
                    value={model.keyword}
                    onChange={({ target }) => updateModel({ ...model, keyword: target.value })}
                    onSubmit={handleSubmit}
                    showSearchIcon={false}
                    ref={searchInputRef}
                    suffix={
                        model.keyword ? (
                            <Button shape="ghost" color="weak" size="small" type="button" onClick={handleClear}>
                                {c('Action').t`Clear`}
                            </Button>
                        ) : null
                    }
                />
            </div>
            <div className={classnames(['pt1 px1-5 pb0'])}>
                {showEncryptedSearch && (
                    <EncryptedSearchField esState={esState} showMore={showMore} toggleShowMore={toggleShowMore} />
                )}
                <div>
                    <LocationField
                        value={model.labelID}
                        onChange={(nextLabelId) => updateModel({ ...model, labelID: nextLabelId })}
                    />
                </div>
                <hr className="my1" />
                {showMore && (
                    <>
                        <div className="mt1">
                            <Button
                                className="mb0-5 on-mobile-w100"
                                onClick={toggleShowMore}
                                title={c('Action').t`Show fewer search options`}
                            >
                                {c('Action').t`Fewer search options`}
                            </Button>
                        </div>
                        <div className="mb0-5 flex flex-justify-space-between on-mobile-flex-column">
                            <div className={classnames(['flex-item-fluid', isNarrow ? 'on-mobile-pr0' : 'pr1'])}>
                                <Label className="advanced-search-label text-semibold" htmlFor="begin-date">{c('Label')
                                    .t`From`}</Label>
                                <DateInput
                                    placeholder={c('Placeholder').t`Start date`}
                                    id="begin-date"
                                    value={model.begin}
                                    onChange={async (begin) => {
                                        if (begin) {
                                            let oldestTime = -1;
                                            if (wasIndexingDone(user.ID) && isDBLimited) {
                                                oldestTime = await getOldestTimeMail(user.ID, 1000);
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
                            <div className="flex-item-fluid">
                                <Label className="advanced-search-label text-semibold" htmlFor="end-date">{c('Label')
                                    .t`To`}</Label>
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
                        <div className="mb0-5" ref={senderListAnchorRef}>
                            <Label
                                title={c('Label').t`Sender`}
                                className="advanced-search-label text-semibold"
                                htmlFor="from"
                            >{c('Label').t`Sender`}</Label>
                            <AddressesInput
                                id="from"
                                recipients={model.from}
                                onChange={(from) => updateModel({ ...model, from })}
                                placeholder={c('Placeholder').t`Name or email address`}
                                anchorRef={senderListAnchorRef}
                            />
                        </div>
                        <div className="mb0-5" ref={toListAnchorRef}>
                            <Label
                                title={c('Label').t`Recipient`}
                                className="advanced-search-label text-semibold"
                                htmlFor="to"
                            >{c('Label').t`Recipient`}</Label>
                            <AddressesInput
                                id="to"
                                recipients={model.to}
                                onChange={(to) => updateModel({ ...model, to })}
                                placeholder={c('Placeholder').t`Name or email address`}
                                anchorRef={toListAnchorRef}
                            />
                        </div>
                        <div className="mb0-5">
                            <Label
                                title={c('Label').t`Address`}
                                className="advanced-search-label text-semibold"
                                htmlFor="address"
                            >{c('Label').t`Address`}</Label>
                            <SelectTwo
                                id="address"
                                value={model.address}
                                onChange={({ value }) => updateModel({ ...model, address: value })}
                            >
                                {[{ ID: ALL_ADDRESSES, Email: c('Option').t`All` }, ...addresses].map(
                                    ({ ID, Email }) => (
                                        <Option key={ID} value={ID} title={Email} />
                                    )
                                )}
                            </SelectTwo>
                        </div>
                        <div className="mb0-5">
                            <Label
                                className="advanced-search-label text-semibold"
                                id="advanced-search-attachments-label"
                            >{c('Label').t`Attachments`}</Label>
                            <div className="pt0-5">
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
                                >{c('Attachment radio advanced search').t`With`}</Radio>
                                <Radio
                                    id="advanced-search-attachments-no"
                                    onChange={() => updateModel({ ...model, attachments: NO_ATTACHMENTS })}
                                    checked={model.attachments === NO_ATTACHMENTS}
                                    name="advanced-search-attachments"
                                    aria-describedby="advanced-search-attachments-label"
                                >{c('Attachment radio advanced search').t`Without`}</Radio>
                            </div>
                        </div>
                    </>
                )}
            </div>
            <div className={classnames(['py1 mx1-5 flex flex-align-items-center flex-justify-space-between'])}>
                {showMore ? null : (
                    <Button
                        className="mb0-5 on-mobile-w100"
                        onClick={toggleShowMore}
                        title={c('Action').t`Show more search options`}
                    >
                        {c('Action').t`More search options`}
                    </Button>
                )}
                <div className="mlauto">
                    {canReset ? (
                        <Button
                            className="mb0-5 on-mobile-w100 mr1"
                            type="reset"
                            title={c('Action').t`Reset search form`}
                        >{c('Action').t`Reset`}</Button>
                    ) : null}
                    <PrimaryButton type="submit" className="mb0-5 on-mobile-w100">{c('Action')
                        .t`Search`}</PrimaryButton>
                </div>
            </div>
        </form>
    );
};

export default AdvancedSearch;
