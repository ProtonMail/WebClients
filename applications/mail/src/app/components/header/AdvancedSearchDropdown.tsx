import { useState, useEffect, FormEvent } from 'react';
import { useHistory } from 'react-router-dom';
import { c } from 'ttag';
import { getUnixTime, fromUnixTime, isBefore, isAfter, add, sub } from 'date-fns';
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
    useLabels,
    useFolders,
    useMailSettings,
    useToggle,
    useUser,
    FeatureCode,
    useSpotlightOnFeature,
    Spotlight,
    Href,
    useWelcomeFlags,
    useFeatures,
    SelectTwo,
    Option,
    useAddresses,
    useSpotlightShow,
} from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import { changeSearchParams, getSearchParams } from '@proton/shared/lib/helpers/url';
import { Recipient } from '@proton/shared/lib/interfaces/Address';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { isPaid } from '@proton/shared/lib/user/helpers';

import { getHumanLabelID } from '../../helpers/labels';
import AddressesInput from '../composer/addresses/AddressesInput';
import { extractSearchParameters, keywordToString } from '../../helpers/mailboxUrl';
import { getOldestTime, wasIndexingDone } from '../../helpers/encryptedSearch/esUtils';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';

import './AdvancedSearchDropdown.scss';
import { useClickMailContent } from '../../hooks/useClickMailContent';
import SearchField from './AdvancedSearchFields/SearchField';
import LocationField from './AdvancedSearchFields/LocationField';
import EncryptedSearchField from './AdvancedSearchFields/EncryptedSearchField';
import useEncryptedSearchToggleState from './useEncryptedSearchToggleState';

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

interface Props {
    keyword?: string;
    isNarrow: boolean;
}

const AdvancedSearchDropdown = ({ keyword: fullInput = '', isNarrow }: Props) => {
    const history = useHistory();
    const [uid] = useState(generateUID('advanced-search-dropdown'));
    const [, loadingMailSettings] = useMailSettings();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    useClickMailContent((event) => {
        if (anchorRef.current?.contains(event.target as Node)) {
            // Click on the anchor will already close the dropdown, doing it twice will reopen it
            return;
        }
        close();
    });
    const [, loadingLabels] = useLabels();
    const [, loadingFolders] = useFolders();
    const [addresses, loadingAddresses] = useAddresses();
    const [model, updateModel] = useState<SearchModel>(DEFAULT_MODEL);
    const { state: showMore, toggle: toggleShowMore } = useToggle(false);
    const [user] = useUser();
    const { getESDBStatus, cacheIndexedDB, closeDropdown } = useEncryptedSearchContext();
    const { isDBLimited, dropdownOpened } = getESDBStatus();
    const [{ loading: loadingESFeature, feature: esFeature }, { loading: loadingScheduledFeature }] = useFeatures([
        FeatureCode.EnabledEncryptedSearch,
        FeatureCode.ScheduledSend,
    ]);
    const [welcomeFlags] = useWelcomeFlags();
    const esState = useEncryptedSearchToggleState(isOpen);

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

        close();
    };

    const handleReset = () => updateModel(DEFAULT_MODEL);

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
                    address: address || ALL_ADDRESSES,
                    attachments,
                    wildcard,
                    from: getRecipients(from),
                    to: getRecipients(to),
                    begin: begin ? fromUnixTime(begin) : UNDEFINED,
                    end: end ? sub(fromUnixTime(end), { days: 1 }) : UNDEFINED,
                    filter,
                };
            });
        } else {
            closeDropdown();
        }
    }, [isOpen]);

    useEffect(() => {
        if (dropdownOpened) {
            toggle();
        }
    }, [dropdownOpened]);

    const loading =
        loadingLabels ||
        loadingFolders ||
        loadingMailSettings ||
        loadingAddresses ||
        loadingESFeature ||
        loadingScheduledFeature;

    // Switches
    const showEncryptedSearch = !isMobile() && !!esFeature && !!esFeature.Value && !!isPaid(user);
    const showAdvancedSearch = !showEncryptedSearch || showMore;
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

    const { show: showSpotlight, onDisplayed } = useSpotlightOnFeature(
        FeatureCode.SpotlightEncryptedSearch,
        showEncryptedSearch && !welcomeFlags.isWelcomeFlow && !isOpen
    );

    const shouldShowSpotlight = useSpotlightShow(showSpotlight);

    return (
        <>
            <Spotlight
                originalPlacement="bottom-left"
                show={shouldShowSpotlight}
                onDisplayed={onDisplayed}
                anchorRef={anchorRef}
                content={
                    <>
                        <div className="text-bold text-lg mauto">{c('Spotlight').t`Message Content Search`}</div>
                        {c('Spotlight').t`You can now search the content of your encrypted emails.`}
                        <br />
                        <Href
                            url="https://protonmail.com/support/knowledge-base/search-message-content/"
                            title="Message Content Search"
                        >
                            {c('Info').t`Learn more`}
                        </Href>
                    </>
                }
            >
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
                            name="angle-down"
                            className={classnames(['searchbox-advanced-search-icon mauto', isOpen && 'rotateX-180'])}
                            alt={c('Action').t`Advanced search`}
                        />
                    </DropdownButton>
                )}
            </Spotlight>
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
                disableDefaultArrowNavigation
                UNSTABLE_AUTO_HEIGHT
            >
                <form
                    name="advanced-search"
                    className="pl1-5 pr1-5 pt1 pb1"
                    onSubmit={handleSubmit}
                    onReset={handleReset}
                >
                    {!showEncryptedSearch && (
                        <SearchField
                            value={model.keyword}
                            onChange={({ target }) => updateModel({ ...model, keyword: target.value })}
                            onSubmit={handleSubmit}
                            showEncryptedSearch={showEncryptedSearch}
                        />
                    )}
                    {showEncryptedSearch && (
                        <EncryptedSearchField esState={esState} showMore={showMore} toggleShowMore={toggleShowMore} />
                    )}
                    {showAdvancedSearch && (
                        <>
                            {showEncryptedSearch && (
                                <SearchField
                                    value={model.keyword}
                                    onChange={({ target }) => updateModel({ ...model, keyword: target.value })}
                                    onSubmit={handleSubmit}
                                    showEncryptedSearch={showEncryptedSearch}
                                />
                            )}
                            <div className="mb0-5">
                                <LocationField
                                    value={model.labelID}
                                    onChange={(nextLabelId) => updateModel({ ...model, labelID: nextLabelId })}
                                />
                            </div>
                            <div className="mb0-5 flex flex-justify-space-between on-mobile-flex-column">
                                <div className="pr1 on-mobile-pr0 flex-item-fluid">
                                    <Label className="advanced-search-label text-semibold" htmlFor="begin-date">{c(
                                        'Label'
                                    ).t`From`}</Label>
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
                                <div className="flex-item-fluid">
                                    <Label className="advanced-search-label text-semibold" htmlFor="end-date">{c(
                                        'Label'
                                    ).t`To`}</Label>
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
                                    {[{ ID: ALL_ADDRESSES, Email: c('Option').t`All` }, ...addresses].map(
                                        ({ ID, Email }) => (
                                            <Option key={ID} value={ID} title={Email} />
                                        )
                                    )}
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
                            <div className="flex flex-justify-space-between">
                                <Button disabled={!Object.keys(model).length} type="reset">{c('Action')
                                    .t`Clear`}</Button>
                                <PrimaryButton type="submit">{c('Action').t`Search`}</PrimaryButton>
                            </div>
                        </>
                    )}
                </form>
            </Dropdown>
        </>
    );
};

export default AdvancedSearchDropdown;
