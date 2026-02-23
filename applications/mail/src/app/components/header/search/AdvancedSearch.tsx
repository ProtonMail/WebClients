import type { FormEvent } from 'react';
import { useMemo, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { add, fromUnixTime, getUnixTime, isAfter, isBefore, isEqual, sub } from 'date-fns';
import type { History } from 'history';
import isDeepEqual from 'lodash/isEqual';
import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Checkbox, DateInput, Label, Option, SelectTwo, useActiveBreakpoint } from '@proton/components';
import type { ESIndexingState } from '@proton/encrypted-search';
import { contentIndexingProgress } from '@proton/encrypted-search/esIDB';
import { useSearchTelemetry } from '@proton/encrypted-search/useSearchTelemetry';
import { getHumanLabelID } from '@proton/mail/helpers/location';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import { omit } from '@proton/shared/lib/helpers/object';
import { changeSearchParams } from '@proton/shared/lib/helpers/url';
import type { Recipient } from '@proton/shared/lib/interfaces/Address';
import clsx from '@proton/utils/clsx';

import AddressInput from 'proton-mail/components/composer/addresses/AddressInput';

import { useEncryptedSearchContext } from '../../../containers/EncryptedSearchProvider';
import { extractSearchParameters, filterFromUrl, keywordToString, setFilterInUrl } from '../../../helpers/mailboxUrl';
import AddressesInput from '../../composer/addresses/AddressesInput';
import EncryptedSearchField from './AdvancedSearchFields/EncryptedSearchField';
import LocationField from './AdvancedSearchFields/LocationField';
import SearchField from './AdvancedSearchFields/SearchField';

interface SearchModel {
    keyword: string;
    labelID: string;
    from?: string;
    to: Recipient[];
    address?: string;
    begin?: Date;
    end?: Date;
    wildcard?: number;
    filter?: string;
    hasAttachments?: boolean;
}

const UNDEFINED = undefined;
const AUTO_WILDCARD = undefined;
const ALL_ADDRESSES = 'all';

const DEFAULT_MODEL_WITHOUT_LABEL_ID: Omit<SearchModel, 'labelID'> = {
    keyword: '',
    from: '',
    to: [],
    address: ALL_ADDRESSES,
    wildcard: AUTO_WILDCARD,
    filter: UNDEFINED,
    begin: undefined,
    end: undefined,
    hasAttachments: false,
};

const getRecipients = (value = '') =>
    value
        .split(',')
        .filter(validateEmailAddress)
        .map((Address) => ({ Address, Name: '' }));
const formatRecipients = (recipients: Recipient[] = []) => recipients.map(({ Address }) => Address).join(',');

const initializeModel = (history: History, selectedLabelID: string, searchInputValue: string) => {
    const { keyword, address, wildcard, from = '', to, begin, end } = extractSearchParameters(history.location);
    const filterUrl = filterFromUrl(history.location);
    const hasAttachments = filterUrl.Attachments === 1;
    const filter = hasAttachments ? 'has-file' : UNDEFINED;

    return {
        ...(keyword && { labelID: selectedLabelID }),
        keyword: searchInputValue ?? keyword ?? '',
        address: address || ALL_ADDRESSES,
        wildcard,
        from,
        to: getRecipients(to),
        begin: begin ? fromUnixTime(begin) : UNDEFINED,
        end: end ? sub(fromUnixTime(end), { days: 1 }) : UNDEFINED,
        filter,
        hasAttachments,
    };
};

// Get right keyword value depending on the current situation
const getKeyword = ({
    keyword,
    reset,
    isSmallViewport,
}: {
    keyword: string;
    reset?: boolean;
    isSmallViewport: boolean;
}) => {
    if (reset) {
        return UNDEFINED;
    }
    const value = isSmallViewport ? keyword : keywordToString(keyword);
    if (value) {
        return value;
    }
    return UNDEFINED;
};

interface Props {
    showEncryptedSearch: boolean;
    onClose: () => void;
    esIndexingProgressState: ESIndexingState;
    showMore: boolean;
    toggleShowMore: () => void;
    searchInputValue: string;
    labelID: string;
}

const AdvancedSearch = ({
    showEncryptedSearch,
    onClose,
    esIndexingProgressState,
    showMore,
    searchInputValue,
    toggleShowMore,
    labelID,
}: Props) => {
    const searchInputRef = useRef<HTMLInputElement>(null);
    const history = useHistory();
    const [addresses = []] = useAddresses();

    const breakpoints = useActiveBreakpoint();
    const isSmallViewport = breakpoints.viewportWidth['<=small'] || breakpoints.viewportWidth.medium;

    const { sendClearSearchFieldsReport } = useSearchTelemetry();
    const [{ AlmostAllMail }] = useMailSettings();

    const DEFAULT_MODEL: SearchModel = useMemo(
        () => ({
            ...DEFAULT_MODEL_WITHOUT_LABEL_ID,
            labelID: AlmostAllMail ? MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL : MAILBOX_LABEL_IDS.ALL_MAIL,
        }),
        [AlmostAllMail]
    );

    const [model, updateModel] = useState<SearchModel>({
        ...DEFAULT_MODEL,
        ...initializeModel(history, labelID, searchInputValue),
    });

    const [user] = useUser();
    const { esStatus } = useEncryptedSearchContext();
    const { isDBLimited, lastContentTime, esEnabled } = esStatus;

    const senderListAnchorRef = useRef<HTMLDivElement>(null);
    const toListAnchorRef = useRef<HTMLDivElement>(null);

    const handleSubmit = (event: FormEvent, reset?: boolean) => {
        event.preventDefault(); // necessary to not run a basic submission
        event.stopPropagation(); // necessary to not submit normal search from header

        const { keyword, begin, end, wildcard, from, to, address, hasAttachments } = reset ? DEFAULT_MODEL : model;
        const filter = hasAttachments ? 'has-file' : UNDEFINED;

        history.push(
            changeSearchParams(`/${getHumanLabelID(model.labelID)}`, history.location.hash, {
                keyword: getKeyword({ keyword, reset, isSmallViewport }),
                from: from ? String(from) : UNDEFINED,
                to: to.length ? formatRecipients(to) : UNDEFINED,
                address: address === ALL_ADDRESSES ? UNDEFINED : address,
                begin: begin ? String(getUnixTime(begin)) : UNDEFINED,
                end: end ? String(getUnixTime(add(end, { days: 1 }))) : UNDEFINED,
                wildcard: wildcard ? String(wildcard) : UNDEFINED,
                filter,
                sort: UNDEFINED, // Make sure to reset sort parameter when performing an advanced search
                page: UNDEFINED, // Reset page parameter when performing an advanced search so that search results are shown from the first page
            })
        );

        onClose();
    };

    const handleStartDateChange = async (begin: Date | undefined) => {
        if (esEnabled && isDBLimited && begin) {
            const wasIndexingDone = await contentIndexingProgress.isIndexingDone(user.ID);
            // In an encrypted search context, it's not possible to search for data that predates the timestamp of the most recently indexed content
            if (wasIndexingDone && isBefore(begin, lastContentTime)) {
                return;
            }
        }
        if (!model.end || isBefore(begin || -Infinity, model.end)) {
            updateModel({ ...model, begin });
        }
    };

    const handleEndDateChange = (end: Date | undefined) => {
        if (!model.begin || isEqual(model.begin, end || Infinity) || isAfter(end || Infinity, model.begin)) {
            updateModel({ ...model, end });
        }
    };

    const handleClear = () => {
        updateModel((currentModel) => ({
            ...currentModel,
            keyword: '',
            filter: undefined,
        }));
        searchInputRef.current?.focus();
        sendClearSearchFieldsReport(esEnabled);
    };

    const handleReset = (event: FormEvent) => {
        event.preventDefault(); // necessary to block native reset behaviour

        updateModel(DEFAULT_MODEL);

        const newLocation = setFilterInUrl(history.location, {});
        history.push(newLocation);

        searchInputRef.current?.focus();
        sendClearSearchFieldsReport(esEnabled);
    };

    const canReset = useMemo(() => !isDeepEqual(omit(model, ['labelID']), DEFAULT_MODEL_WITHOUT_LABEL_ID), [model]);

    return (
        <form name="advanced-search" onSubmit={handleSubmit} onReset={handleReset}>
            <div className="flex border-bottom px-1 pt-1 pb-2">
                <SearchField
                    unstyled
                    value={model.keyword}
                    onChange={({ target }) => updateModel({ ...model, keyword: target.value })}
                    onSubmit={handleSubmit}
                    showSearchIcon={false}
                    ref={searchInputRef}
                    suffix={
                        model.keyword ? (
                            <Button
                                shape="ghost"
                                color="weak"
                                size="small"
                                type="button"
                                data-testid="advanced-search:clear"
                                onClick={handleClear}
                            >
                                {c('Action').t`Clear`}
                            </Button>
                        ) : null
                    }
                    esEnabled={esEnabled}
                />
            </div>
            <div className="pt-4 px-5 pb-0">
                {showEncryptedSearch && <EncryptedSearchField esIndexingProgressState={esIndexingProgressState} />}
                <div>
                    <LocationField
                        value={model.labelID}
                        onChange={(nextLabelId) => updateModel({ ...model, labelID: nextLabelId })}
                    />
                </div>
                <hr className="my-4" />
                {showMore && (
                    <>
                        <div className="mt-4">
                            <Button
                                className="mb-2 w-full md:w-auto"
                                onClick={toggleShowMore}
                                data-testid="advanced-search:show-less"
                                title={c('Action').t`Show fewer search options`}
                            >
                                {c('Action').t`Fewer search options`}
                            </Button>
                        </div>
                        <div
                            className={clsx(
                                'mb-2 flex justify-space-between flex-column md:flex-row',
                                isSmallViewport ? 'gap-2' : 'gap-4'
                            )}
                        >
                            <div className="md:flex-1">
                                <Label className="advanced-search-label text-semibold" htmlFor="begin-date">{c(
                                    'Label (begin date/advanced search)'
                                ).t`From`}</Label>
                                <DateInput
                                    placeholder={c('Placeholder').t`Start date`}
                                    id="begin-date"
                                    data-testid="advanced-search:start-date"
                                    value={model.begin}
                                    onChange={handleStartDateChange}
                                />
                            </div>
                            <div className="md:flex-1">
                                <Label className="advanced-search-label text-semibold" htmlFor="end-date">{c(
                                    'Label (end date/advanced search)'
                                ).t`To`}</Label>
                                <DateInput
                                    placeholder={c('Placeholder').t`End date`}
                                    id="end-date"
                                    data-testid="advanced-search:end-date"
                                    value={model.end}
                                    onChange={handleEndDateChange}
                                />
                            </div>
                        </div>
                        <div className="mb-2" ref={senderListAnchorRef}>
                            <Label
                                title={c('Label').t`Sender`}
                                className="advanced-search-label text-semibold"
                                htmlFor="from"
                            >{c('Label').t`Sender`}</Label>
                            <AddressInput
                                anchorRef={senderListAnchorRef}
                                classname="flex-1"
                                dataTestId="advanced-search:sender"
                                id="from"
                                onChange={(from) => updateModel({ ...model, from })}
                                placeholder={c('Placeholder').t`Name or email address`}
                                value={model.from}
                            />
                        </div>
                        <div className="mb-2" ref={toListAnchorRef}>
                            <Label
                                title={c('Label').t`Recipient`}
                                className="advanced-search-label text-semibold"
                                htmlFor="to"
                            >{c('Label').t`Recipient`}</Label>
                            <AddressesInput
                                id="to"
                                dataTestId="advanced-search:recipient"
                                recipients={model.to}
                                onChange={(to) => updateModel({ ...model, to })}
                                placeholder={c('Placeholder').t`Name or email address`}
                                anchorRef={toListAnchorRef}
                                classname="flex-1"
                            />
                        </div>
                        <div className="mb-2">
                            <Label
                                title={c('Label').t`Address`}
                                className="advanced-search-label text-semibold"
                                htmlFor="address"
                            >{c('Label').t`Address`}</Label>
                            <SelectTwo
                                id="address"
                                data-testid="advanced-search:address"
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
                        <div className="mb-2">
                            <Label className="advanced-search-label text-semibold">{c('Label').t`Filters`}</Label>
                            <Checkbox
                                checked={model.hasAttachments || false}
                                onChange={({ target }) =>
                                    updateModel({
                                        ...model,
                                        hasAttachments: target.checked,
                                        filter: target.checked ? 'has-file' : UNDEFINED,
                                    })
                                }
                                className="block"
                            >
                                {c('Label').t`Has attachments`}
                            </Checkbox>
                        </div>
                    </>
                )}
            </div>
            <div className="my-4 mx-5 flex items-center justify-space-between">
                {showMore || (
                    <Button
                        data-testid="advanced-search:show-more"
                        className="mb-2 w-full md:w-auto"
                        onClick={toggleShowMore}
                        title={c('Action').t`Show more search options`}
                    >
                        {c('Action').t`More search options`}
                    </Button>
                )}
                <div className="ml-auto w-full md:w-auto">
                    {canReset && (
                        <Button
                            data-testid="advanced-search:reset"
                            className="mb-2 w-full md:w-auto mr-4"
                            type="reset"
                            title={c('Action').t`Reset search form`}
                        >{c('Action').t`Reset`}</Button>
                    )}
                    <Button
                        color="norm"
                        data-testid="advanced-search:submit"
                        type="submit"
                        className="mb-2 w-full md:w-auto"
                    >{c('Action').t`Search`}</Button>
                </div>
            </div>
        </form>
    );
};

export default AdvancedSearch;
