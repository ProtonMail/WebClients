import React, { useEffect, useState } from 'react';
import { c } from 'ttag';
import {
    Alert,
    useApiResult,
    useApiWithoutResult,
    useApi,
    useNotifications,
    useModals,
    SearchInput
} from 'react-components';
import {
    getIncomingDefaults,
    updateIncomingDefault,
    deleteIncomingDefaults
} from 'proton-shared/lib/api/incomingDefaults';
import { WHITELIST_LOCATION, BLACKLIST_LOCATION } from 'proton-shared/lib/constants';

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
        edit
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
        search(Keyword);
        setLoader({ white: true, black: true });
        try {
            const { IncomingDefaults = [] } = await reqSearch.request({ Keyword, PageSize: 100 });
            search(Keyword, IncomingDefaults);
            setLoader({ white: false, black: false });
        } catch (e) {
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
        const item = Email || Domain;
        createNotification({
            text:
                Location === WHITELIST_LOCATION
                    ? c('Spam filter moved to blacklist').t`${item} moved to blacklist`
                    : c('Spam filter moved to whitelist').t`${item} moved to whitelist`
        });
        move(type, data);
    };

    const handleRemove = async (incomingDefault) => {
        const { Email, Domain, ID } = incomingDefault;
        await api(deleteIncomingDefaults([ID]));
        const item = Email || Domain;
        createNotification({ text: c('Moved to black/whitelist').t`${item} removed` });
        remove(incomingDefault);
    };

    return (
        <>
            <Alert learnMore="https://protonmail.com/support/knowledge-base/spam-filtering/">
                {c('FilterSettings')
                    .t`Sender specific spam rules can be applied here. Whitelist addresses always go to Inbox while Blacklist addresses always go to Spam. Marking a message as spam adds the address to the Blacklist. Marking a message as not spam adds it to the Whitelist.`}
            </Alert>
            <div className="mb1">
                <SearchInput
                    onChange={handleSearchChange}
                    placeholder={c('FilterSettings').t`Search in Whitelist and Blacklist`}
                />
            </div>

            <div className="flex onmobile-flex-column">
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
                    className="ml1 onmobile-ml0"
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
