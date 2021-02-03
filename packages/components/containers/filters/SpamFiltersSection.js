import React, { useEffect, useState } from 'react';
import { c } from 'ttag';
import {
    getIncomingDefaults,
    updateIncomingDefault,
    deleteIncomingDefaults,
} from 'proton-shared/lib/api/incomingDefaults';
import { WHITELIST_LOCATION, BLACKLIST_LOCATION } from 'proton-shared/lib/constants';
import { Alert, SearchInput } from '../../components';
import { useApiResult, useApiWithoutResult, useApi, useNotifications, useModals } from '../../hooks';

import useSpamList from '../../hooks/useSpamList';
import SpamListItem from './spamlist/SpamListItem';
import AddEmailToListModal from './AddEmailToListModal';

const getWhiteList = () => getIncomingDefaults({ Location: WHITELIST_LOCATION });
const getBlackList = () => getIncomingDefaults({ Location: BLACKLIST_LOCATION });

function SpamFiltersSection() {
    const api = useApi();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const reqSearch = useApiWithoutResult(getIncomingDefaults);
    const {
        blackList,
        whiteList,
        refreshWhiteList,
        refreshBlackList,
        move,
        remove,
        search,
        create,
        edit,
    } = useSpamList();

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

    const handleSearchChange = async (Keyword) => {
        if (!Keyword) {
            return search();
        }

        setLoader({ white: true, black: true });
        try {
            const [whiteResult, blackResult] = await Promise.all([
                reqSearch.request({ Keyword, Location: WHITELIST_LOCATION, PageSize: 100 }),
                reqSearch.request({ Keyword, Location: BLACKLIST_LOCATION, PageSize: 100 }),
            ]);
            search(Keyword, [...whiteResult.IncomingDefaults, ...blackResult.IncomingDefaults]);
        } finally {
            setLoader({ white: false, black: false });
        }
    };

    const handleCreate = async (type) => {
        const data = await new Promise((resolve) => {
            createModal(<AddEmailToListModal type={type} onAdd={resolve} />);
        });
        create(type, data);
    };

    const handleEdit = async (type, incomingDefault) => {
        const data = await new Promise((resolve) => {
            createModal(<AddEmailToListModal type={type} onAdd={resolve} incomingDefault={incomingDefault} />);
        });
        edit(type, data);
    };

    const handleMove = async (incomingDefault) => {
        const { Email, Domain, ID, Location } = incomingDefault;
        const type = Location === WHITELIST_LOCATION ? BLACKLIST_LOCATION : WHITELIST_LOCATION;
        const { IncomingDefault: data } = await api(updateIncomingDefault(ID, { Location: type }));
        const domainTxt =
            Location === WHITELIST_LOCATION
                ? c('Spam filter moved to blacklist').t`${Domain} moved to Block List`
                : c('Spam filter moved to whitelist').t`${Domain} moved to Allow List`;
        const emailTxt =
            Location === WHITELIST_LOCATION
                ? c('Spam filter moved to blacklist').t`${Email} moved to Block List`
                : c('Spam filter moved to whitelist').t`${Email} moved to Allow List`;
        createNotification({
            text: Email ? emailTxt : domainTxt,
        });
        move(type, data);
    };

    const handleRemove = async (incomingDefault) => {
        const { Email, Domain, ID } = incomingDefault;
        await api(deleteIncomingDefaults([ID]));
        const domainTxt = c('Moved to black/whitelist').t`${Domain} removed`;
        const emailTxt = c('Moved to black/whitelist').t`${Email} removed`;
        createNotification({ text: Email ? emailTxt : domainTxt });
        remove(incomingDefault);
    };

    return (
        <>
            <Alert learnMore="https://protonmail.com/support/knowledge-base/spam-filtering/">
                {c('FilterSettings')
                    .t`Sender specific spam rules can be applied here. Allow List addresses always go to Inbox while Block List addresses always go to Spam. Marking a message as spam adds the address to the Block List. Marking a message as not spam adds it to the Allow List.`}
            </Alert>
            <div className="mb1">
                <SearchInput
                    onChange={handleSearchChange}
                    placeholder={c('FilterSettings').t`Search in Allow List and Block List`}
                />
            </div>

            <div className="flex on-mobile-flex-column">
                <SpamListItem
                    list={whiteList}
                    type={WHITELIST_LOCATION}
                    loading={loader.white}
                    onCreate={handleCreate}
                    onEdit={handleEdit}
                    onRemove={handleRemove}
                    onMove={handleMove}
                />
                <SpamListItem
                    list={blackList}
                    type={BLACKLIST_LOCATION}
                    className="ml1 on-mobile-ml0"
                    loading={loader.black}
                    onCreate={handleCreate}
                    onEdit={handleEdit}
                    onRemove={handleRemove}
                    onMove={handleMove}
                />
            </div>
        </>
    );
}

export default SpamFiltersSection;
