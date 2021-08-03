import { useEffect, useState } from 'react';
import { c } from 'ttag';
import {
    getIncomingDefaults,
    updateIncomingDefault,
    deleteIncomingDefaults,
} from '@proton/shared/lib/api/incomingDefaults';
import { WHITELIST_LOCATION, BLACKLIST_LOCATION } from '@proton/shared/lib/constants';
import { IncomingDefault } from '@proton/shared/lib/interfaces/IncomingDefault';

import { SearchInput } from '../../components';
import { useApiResult, useApiWithoutResult, useApi, useNotifications, useModals } from '../../hooks';

import useSpamList from '../../hooks/useSpamList';
import SpamListItem from './spamlist/SpamListItem';
import AddEmailToListModal from './AddEmailToListModal';
import { WHITE_OR_BLACK_LOCATION } from './interfaces';
import { SettingsSectionWide, SettingsParagraph } from '../account';

const getWhiteList = () => getIncomingDefaults({ Location: WHITELIST_LOCATION });
const getBlackList = () => getIncomingDefaults({ Location: BLACKLIST_LOCATION });

interface SpamList {
    IncomingDefaults?: IncomingDefault[];
}

function SpamFiltersSection() {
    const api = useApi();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const reqSearch = useApiWithoutResult(getIncomingDefaults);
    const { blackList, whiteList, refreshWhiteList, refreshBlackList, move, remove, search, create } = useSpamList();

    const {
        result: white = {},
        loading: loadingWhite,
    }: {
        result?: SpamList;
        loading: boolean;
    } = useApiResult(getWhiteList, []);
    const {
        result: black = {},
        loading: loadingBlack,
    }: {
        result?: SpamList;
        loading: boolean;
    } = useApiResult(getBlackList, []);

    const [loader, setLoader] = useState<{ white: boolean; black: boolean }>({
        white: false,
        black: false,
    });

    useEffect(() => {
        refreshWhiteList(white.IncomingDefaults || []);
        setLoader({ ...loader, white: loadingWhite });
    }, [white.IncomingDefaults]);

    useEffect(() => {
        refreshBlackList(black.IncomingDefaults || []);
        setLoader({ ...loader, black: loadingBlack });
    }, [black.IncomingDefaults]);

    const handleSearchChange = async (Keyword: string) => {
        if (!Keyword) {
            return search(Keyword);
        }

        setLoader({ white: true, black: true });

        try {
            const [whiteResult, blackResult] = await Promise.all([
                reqSearch.request({ Keyword, Location: WHITELIST_LOCATION, PageSize: 100 }),
                reqSearch.request({ Keyword, Location: BLACKLIST_LOCATION, PageSize: 100 }),
            ]);

            search(Keyword, [
                ...((whiteResult as SpamList).IncomingDefaults || []),
                ...((blackResult as SpamList).IncomingDefaults || []),
            ]);
        } finally {
            setLoader({ white: false, black: false });
        }
    };

    const handleCreate = async (type: WHITE_OR_BLACK_LOCATION) => {
        const data: IncomingDefault = await new Promise((resolve) => {
            createModal(<AddEmailToListModal type={type} onAdd={resolve} />);
        });
        create(type, data);
    };
    const handleMove = async (incomingDefault: IncomingDefault) => {
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

    const handleRemove = async (incomingDefault: IncomingDefault) => {
        const { Email, Domain, ID } = incomingDefault;
        await api(deleteIncomingDefaults([ID]));
        const domainTxt = c('Moved to black/whitelist').t`${Domain} removed`;
        const emailTxt = c('Moved to black/whitelist').t`${Email} removed`;
        createNotification({ text: Email ? emailTxt : domainTxt });
        remove(incomingDefault);
    };

    return (
        <SettingsSectionWide>
            <SettingsParagraph learnMoreUrl="https://protonmail.com/support/knowledge-base/spam-filtering/">
                {c('FilterSettings')
                    .t`Apply sender-specific spam rules. Messages from addresses or domains on the Allow List always go to your Inbox while messages from addresses or domains on the Block List always go to Spam. Marking a message as spam adds its address to the Block List. Marking a message as not spam adds it to the Allow List.`}
            </SettingsParagraph>
            <div className="mb2">
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
                    onRemove={handleRemove}
                    onMove={handleMove}
                    className="mr1 mb2"
                />
                <SpamListItem
                    list={blackList}
                    type={BLACKLIST_LOCATION}
                    className="ml1 on-mobile-ml0"
                    loading={loader.black}
                    onCreate={handleCreate}
                    onRemove={handleRemove}
                    onMove={handleMove}
                />
            </div>
        </SettingsSectionWide>
    );
}

export default SpamFiltersSection;
