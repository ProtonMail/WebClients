import { useState, FormEvent, useMemo } from 'react';
import { History } from 'history';
import { useHistory } from 'react-router-dom';
import { c } from 'ttag';
import { getUnixTime, fromUnixTime, isBefore, isAfter, add, sub } from 'date-fns';
import {
    DateInput,
    Radio,
    Button,
    PrimaryButton,
    Label,
    useToggle,
    useUser,
    SelectTwo,
    Option,
    useAddresses,
    Icon,
    classnames
} from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import { changeSearchParams, getSearchParams } from '@proton/shared/lib/helpers/url';
import { Recipient } from '@proton/shared/lib/interfaces/Address';
import { ESIndexingState, wasIndexingDone } from '@proton/encrypted-search';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { getHumanLabelID } from '../../../helpers/labels';
import AddressesInput from '../../composer/addresses/AddressesInput';
import { extractSearchParameters, keywordToString } from '../../../helpers/mailboxUrl';
import { getOldestTimeMail } from '../../../helpers/encryptedSearch/esUtils';
import SearchField from './AdvancedSearchFields/SearchField';
import LocationField from './AdvancedSearchFields/LocationField';
import EncryptedSearchField from './AdvancedSearchFields/EncryptedSearchField';

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
};

const getRecipients = (value = '') =>
    value
        .split(',')
        .filter(validateEmailAddress)
        .map((Address) => ({ Address, Name: '' }));
const formatRecipients = (recipients: Recipient[] = []) => recipients.map(({ Address }) => Address).join(',');

const initializeModel = (history: History) => () => {
    const { keyword, address, attachments, wildcard, from, to, begin, end } = extractSearchParameters(history.location);

    const { filter } = getSearchParams(history.location.search);

    return {
        ...DEFAULT_MODEL, // labelID re-initialized to ALL_MAIL
        keyword: keyword || '',
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
}

const AdvancedSearch = ({ isNarrow, showEncryptedSearch, onClose, esState, isDBLimited }: Props) => {
    const history = useHistory();
    // const [uid] = useState(generateUID('advanced-search-dropdown'));

    // const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    // useClickMailContent((event) => {
    //     if (anchorRef.current?.contains(event.target as Node)) {
    //         // Click on the anchor will already close the dropdown, doing it twice will reopen it
    //         return;
    //     }
    //     close();
    // });

    const [addresses] = useAddresses();
    const [model, updateModel] = useState<SearchModel>(initializeModel(history));
    const { state: showMore, toggle: toggleShowMore } = useToggle(false);
    const [user] = useUser();
    // const { getESDBStatus, closeDropdown } = useEncryptedSearchContext();
    // const { isDBLimited, dropdownOpened } = getESDBStatus();
    // const esState = useEncryptedSearchToggleState(true);

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

    const handleReset = () => updateModel(DEFAULT_MODEL);

    const isSearch = useMemo(() => {
        return !isDeepEqual(model, DEFAULT_MODEL);
    }, [model]);

    // useEffect(() => {
    //     updateModel(() => {
    //         const { keyword, address, attachments, wildcard, from, to, begin, end } = extractSearchParameters(
    //             history.location
    //         );

    //         console.log('extractSearchParameters', { keyword, address, attachments, wildcard, from, to, begin, end });

    //         const { filter } = getSearchParams(history.location.search);

    //         return {
    //             ...DEFAULT_MODEL, // labelID re-initialized to ALL_MAIL
    //             keyword: keyword || '',
    //             address: address || ALL_ADDRESSES,
    //             attachments,
    //             wildcard,
    //             from: getRecipients(from),
    //             to: getRecipients(to),
    //             begin: begin ? fromUnixTime(begin) : UNDEFINED,
    //             end: end ? sub(fromUnixTime(end), { days: 1 }) : UNDEFINED,
    //             filter,
    //         };
    //     });
    // }, []);

    const showAdvancedSearch = !showEncryptedSearch || showMore;

    return (
        <form name="advanced-search" onSubmit={handleSubmit} onReset={handleReset}>
            <div className="flex border-bottom pl1 pr1 pt0-25 pb0-5">
                <SearchField
                    value={model.keyword}
                    onChange={({ target }) => updateModel({ ...model, keyword: target.value })}
                    onSubmit={handleSubmit}
                    showEncryptedSearch={showEncryptedSearch}
                />
                {isSearch ? (
                    <>
                        <Button
                            shape="ghost"
                            color="weak"
                            className="flex"
                            disabled={!Object.keys(model).length}
                            type="reset">
                                {c('Action').t`Clear`}
                        </Button>
                        <Button
                            type="button"
                            icon
                            shape="ghost"
                            color="weak"
                            className="flex flex-align-items-center"
                            title={c('Action').t`Close ??????????`}
                        >
                            <Icon name="xmark" alt={c('Action').t`Close ??????????????`} />
                        </Button>
                    </>
                ) : null}
            </div>
            <div className={classnames(['pt1 px1-5', showAdvancedSearch ? 'pb0' : 'pb1'])}>
                {showEncryptedSearch && false && (
                    <EncryptedSearchField esState={esState} showMore={showMore} toggleShowMore={toggleShowMore} />
                )}
                <div className="mb0-5">
                    <LocationField
                        value={model.labelID}
                        onChange={(nextLabelId) => updateModel({ ...model, labelID: nextLabelId })}
                    />
                </div>
                {showAdvancedSearch && (
                    <>
                        <div className="mb0-5 flex flex-justify-space-between on-mobile-flex-column">
                            <div className="pr1 on-mobile-pr0 flex-item-fluid">
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
                        <div className="mb0-5">
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
                            />
                        </div>
                        <div className="mb0-5">
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
                                {[{ ID: ALL_ADDRESSES, Email: c('Option').t`All` }, ...addresses].map(({ ID, Email }) => (
                                    <Option key={ID} value={ID} title={Email} />
                                ))}
                            </SelectTwo>
                        </div>
                        <div className="mb1-5">
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
            <div className={classnames(['py1 px1-5 flex flex-justify-space-between', showAdvancedSearch ? '' : 'border-top bg-weak'])}>
                {showAdvancedSearch ? null : (
                    <Button onClick={toggleShowMore} title={c('Action').t`Show more search options`}>
                        {c('Action').t`More search options`}
                    </Button>
                )}
                <PrimaryButton type="submit">{c('Action').t`Search`}</PrimaryButton>
            </div>

        </form>
    );
};

export default AdvancedSearch;
