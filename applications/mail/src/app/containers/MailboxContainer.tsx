import React, { useState, useMemo, useEffect } from 'react';
import { Loader, classnames } from 'react-components';
import { History, Location } from 'history';

import { Element } from '../models/element';
import { Sort, Filter, Page, SearchParameters } from '../models/tools';

import { useMailboxPageTitle } from '../hooks/useMailboxPageTitle';
import { useElements } from '../hooks/useElements';

import { isColumnMode, isConversationMode } from '../helpers/mailSettings';
import { getSearchParams } from '../helpers/url';
import {
    pageFromUrl,
    sortFromUrl,
    filterFromUrl,
    setPageInUrl,
    setSortInUrl,
    setFilterInUrl,
    setPathInUrl,
    extractSearchParameters
} from '../helpers/mailboxUrl';

import Toolbar from '../components/toolbar/Toolbar';
import List from '../components/list/List';
import ConversationView from '../components/conversation/ConversationView';
import PlaceholderView from '../components/view/PlaceholderView';
import MessageOnlyView from '../components/message/MessageOnlyView';
import { OnCompose } from './ComposerContainer';
import { PAGE_SIZE } from '../constants';
import { isMessage } from '../helpers/elements';
import { isDraft } from '../helpers/message/messages';

import './main-area.scss';

interface Props {
    labelID: string;
    mailSettings: any;
    elementID?: string;
    location: Location;
    history: History;
    onCompose: OnCompose;
}

const MailboxContainer = ({
    labelID: inputLabelID,
    mailSettings,
    elementID: inputElementID,
    location,
    history,
    onCompose
}: Props) => {
    const columnMode = isColumnMode(mailSettings);

    // Page state is hybrid: page number is handled by the url, total computed in useElements, size and limit are constants
    // Yet, it is simpler to co-localize all these data in one object
    const [page, setPage] = useState<Page>({
        page: pageFromUrl(location),
        total: 0,
        size: PAGE_SIZE,
        limit: PAGE_SIZE
    });

    const searchParams = getSearchParams(location);
    const conversationMode = isConversationMode(inputLabelID, mailSettings, location);
    const searchParameters = useMemo<SearchParameters>(() => extractSearchParameters(location), [
        searchParams.address,
        searchParams.from,
        searchParams.to,
        searchParams.keyword,
        searchParams.begin,
        searchParams.end,
        searchParams.attachments,
        searchParams.wildcard
    ]);
    const sort = useMemo<Sort>(() => sortFromUrl(location), [searchParams.sort]);
    const filter = useMemo<Filter>(() => filterFromUrl(location), [searchParams.filter]);

    const [checkedElements, setCheckedElements] = useState(Object.create(null));
    const [checkAll, setCheckAll] = useState(false);

    const [labelID, elements, loading, total] = useElements({
        conversationMode,
        labelID: inputLabelID,
        page,
        sort,
        filter,
        search: searchParameters
    });

    useEffect(() => setPage({ ...page, page: pageFromUrl(location) }), [searchParams.page]);
    useEffect(() => setPage({ ...page, total }), [total]);

    useMailboxPageTitle(labelID, location);

    const checkedIDs = useMemo(() => {
        return Object.entries(checkedElements).reduce((acc, [elementID, isChecked]) => {
            if (!isChecked) {
                return acc;
            }
            acc.push(elementID);
            return acc;
        }, [] as string[]);
    }, [checkedElements]);

    const elementID = useMemo(() => {
        if (checkedIDs.length > 0) {
            return undefined;
        }
        return inputElementID;
    }, [inputElementID, checkedIDs]);

    const selectedIDs = useMemo(() => {
        if (checkedIDs.length) {
            return checkedIDs;
        }
        if (elementID) {
            return [elementID];
        }
        return [];
    }, [checkedIDs, elementID]);

    const handleElement = (element: Element) => {
        history.push(setPathInUrl(location, labelID, element.ID));
        if (isMessage(element) && isDraft(element)) {
            onCompose({ existingDraft: { data: element } });
        }
    };
    const handleBack = () => history.push(setPathInUrl(location, labelID));
    const handlePage = (pageNumber: number) => history.push(setPageInUrl(location, pageNumber));
    const handleSort = (sort: Sort) => history.push(setSortInUrl(location, sort));
    const handleFilter = (filter: Filter) => history.push(setFilterInUrl(location, filter));

    const handleCheck = (IDs: string[] = [], checked = false) => {
        const update = IDs.reduce((acc, contactID) => {
            acc[contactID] = checked;
            return acc;
        }, Object.create(null));
        setCheckedElements({ ...checkedElements, ...update });
        setCheckAll(checked && IDs.length === elements.length);
    };

    const handleCheckAll = (checked = false) =>
        handleCheck(
            elements.map(({ ID = '' }: Element) => ID),
            checked
        );

    const handleUncheckAll = () => handleCheckAll(false);

    return (
        <>
            <Toolbar
                location={location}
                labelID={labelID}
                elementID={elementID}
                selectedIDs={selectedIDs}
                elements={elements}
                mailSettings={mailSettings}
                checkAll={checkAll}
                onCheckAll={handleCheckAll}
                page={page}
                onPage={handlePage}
                sort={sort}
                onSort={handleSort}
                filter={filter}
                onFilter={handleFilter}
                onBack={handleBack}
            />
            <div
                className={classnames([
                    'main-area--withToolbar flex-item-fluid flex reset4print',
                    !columnMode && 'main-area--rowMode'
                ])}
            >
                {(columnMode || !elementID) && (
                    <div className="items-column-list scroll-if-needed scroll-smooth-touch">
                        {loading ? (
                            <div className="flex flex-justify-center h100">
                                <Loader />
                            </div>
                        ) : (
                            <List
                                location={location}
                                labelID={labelID}
                                mailSettings={mailSettings}
                                elementID={elementID}
                                elements={elements}
                                checkedIDs={checkedIDs}
                                onCheck={handleCheck}
                                onClick={handleElement}
                            />
                        )}
                    </div>
                )}
                {(columnMode || elementID) && (
                    <section className="view-column-detail p2 flex-item-fluid scroll-if-needed">
                        {elementID ? (
                            conversationMode ? (
                                <ConversationView
                                    labelID={labelID}
                                    mailSettings={mailSettings}
                                    conversationID={elementID}
                                    onCompose={onCompose}
                                />
                            ) : (
                                <MessageOnlyView
                                    mailSettings={mailSettings}
                                    messageID={elementID}
                                    onCompose={onCompose}
                                />
                            )
                        ) : (
                            <PlaceholderView
                                location={location}
                                labelID={labelID}
                                mailSettings={mailSettings}
                                checkedIDs={checkedIDs}
                                onUncheckAll={handleUncheckAll}
                            />
                        )}
                    </section>
                )}
            </div>
        </>
    );
};

export default MailboxContainer;
