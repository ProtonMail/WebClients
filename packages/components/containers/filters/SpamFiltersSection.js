import React, { useEffect, useState } from 'react';
import { c } from 'ttag';
import { Alert, SubTitle, useApiResult, useApiWithoutResult } from 'react-components';
import { getIncomingDefaults } from 'proton-shared/lib/api/incomingDefaults';
import { MAILBOX_IDENTIFIERS } from 'proton-shared/lib/constants';

import useSpamList from '../../hooks/useSpamList';
import SpamListItem from './spamlist/SpamListItem';
import SearchEmailIntoList from './spamlist/SearchEmailIntoList';

const BLACKLIST_TYPE = +MAILBOX_IDENTIFIERS.spam;
const WHITELIST_TYPE = +MAILBOX_IDENTIFIERS.inbox;

const getWhiteList = () => getIncomingDefaults({ Location: WHITELIST_TYPE });
const getBlackList = () => getIncomingDefaults({ Location: BLACKLIST_TYPE });

function SpamFiltersSection() {
    const reqSearch = useApiWithoutResult(getIncomingDefaults);
    const { blackList, whiteList, refreshWhiteList, refreshBlackList, move, remove, search, create } = useSpamList();

    const { result: white = {}, loading: loadingWhite } = useApiResult(getWhiteList, []);
    const { result: black = {}, loading: loadingBlack } = useApiResult(getBlackList, []);

    const [loader, setLoader] = useState({});

    useEffect(() => {
        refreshWhiteList(white.IncomingDefaults || []);
        setLoader({ ...loader, white: loadingWhite });
    }, [white.IncomingDefaults]);

    useEffect(() => {
        refreshBlackList(black.IncomingDefaults || []);
        setLoader({ ...loader, black: loadingBlack });
    }, [black.IncomingDefaults]);

    const handleAction = (action) => (type, data) => {
        action === 'create' && create(type, data);
        action === 'remove' && remove(data);
        action === 'move' && move(type, data);
    };

    const handleSearchChange = async (Keyword) => {
        search(Keyword);
        setLoader({ white: true, black: true });
        try {
            const { IncomingDefaults = [] } = await reqSearch.request({ Keyword, PageSize: 200 });
            search(Keyword, IncomingDefaults);
            setLoader({ white: false, black: false });
        } catch (e) {
            setLoader({ white: false, black: false });
        }
    };

    return (
        <>
            <SubTitle>{c('FilterSettings').t`Spam Filters`}</SubTitle>
            <Alert learnMore="https://protonmail.com">
                {c('FilterSettings')
                    .t`Sender specific spam rules can be applied here. Whitelist addresses always go to Inbox while Blacklist addresses always go to Spam. Marking a message as spam adds the address to the Blacklist. Marking a message as not spam adds it to the Whitelist.`}
            </Alert>

            <SearchEmailIntoList className="w100" onChange={handleSearchChange} />

            <div className="flex-autogrid p1">
                <SpamListItem
                    list={whiteList}
                    type="whitelist"
                    dest="blacklist"
                    loading={loader.white}
                    onAction={handleAction}
                />
                <SpamListItem
                    list={blackList}
                    type="blacklist"
                    dest="whitelist"
                    className="ml1"
                    loading={loader.black}
                    onAction={handleAction}
                />
            </div>
        </>
    );
}

export default SpamFiltersSection;
