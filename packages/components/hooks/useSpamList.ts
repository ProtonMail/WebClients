import { useState } from 'react';
import { WHITELIST_LOCATION, BLACKLIST_LOCATION } from 'proton-shared/lib/constants';
import { IncomingDefault } from 'proton-shared/lib/interfaces/IncomingDefault';

import { WHITE_OR_BLACK_LOCATION } from '../containers/filters/interfaces';

const getFilterSearch = (input = '') => {
    const defaultFilter = (i: IncomingDefault) => i;

    if (!input) {
        return defaultFilter;
    }

    return ({ Email = '', Domain = '' }: IncomingDefault) =>
        Email.toLowerCase().includes(input.toLowerCase()) || Domain.toLowerCase().includes(input.toLowerCase());
};

const useSpamList = () => {
    const [whiteList, setWhiteList] = useState<IncomingDefault[]>([]);
    const [blackList, setBlackList] = useState<IncomingDefault[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [whiteListFiltered, filterWhiteList] = useState(whiteList);
    const [blackListFiltered, filterBlackList] = useState(blackList);

    const refreshList = (type: 'blackList' | 'whitelist') => (
        data: IncomingDefault[],
        { updateRawList = true, refreshSearch = true } = {}
    ) => {
        const filter = getFilterSearch(searchQuery);

        if (type === 'blackList') {
            if (updateRawList) {
                setBlackList(data);
            }
            const list = !refreshSearch ? data : data.filter(filter);
            return filterBlackList(list);
        }

        if (updateRawList) {
            setWhiteList(data);
        }
        const list = !refreshSearch ? data : data.filter(filter);
        return filterWhiteList(list);
    };
    const refreshWhiteList = refreshList('whitelist');
    const refreshBlackList = refreshList('blackList');

    const search = (input = '', data?: IncomingDefault[]) => {
        const filter = getFilterSearch(input);
        const config = { updateRawList: false, refreshSearch: false };
        setSearchQuery(input);

        if (!data) {
            refreshWhiteList(whiteList.filter(filter), config);
            return refreshBlackList(blackList.filter(filter), config);
        }

        const { white, black } = data.reduce<{
            white: IncomingDefault[];
            black: IncomingDefault[];
        }>(
            (acc, item) => {
                const key = item.Location === WHITELIST_LOCATION ? 'white' : 'black';
                acc[key].push(item);
                return acc;
            },
            { white: [], black: [] }
        );

        refreshWhiteList(white.filter(filter), config);
        refreshBlackList(black.filter(filter), config);
    };

    const move = (dest: WHITE_OR_BLACK_LOCATION, data: IncomingDefault) => {
        if (dest === WHITELIST_LOCATION) {
            refreshBlackList(blackList.filter((item) => item.ID !== data.ID));
            refreshWhiteList(whiteList.concat(data));
        }

        if (dest === BLACKLIST_LOCATION) {
            refreshWhiteList(whiteList.filter((item) => item.ID !== data.ID));
            refreshBlackList(blackList.concat(data));
        }
    };

    const remove = ({ ID, Location }: IncomingDefault) => {
        if (Location === WHITELIST_LOCATION) {
            refreshWhiteList(whiteList.filter((item) => item.ID !== ID));
        }

        if (Location === BLACKLIST_LOCATION) {
            refreshBlackList(blackList.filter((item) => item.ID !== ID));
        }
    };

    const create = (dest: WHITE_OR_BLACK_LOCATION, data: IncomingDefault) => {
        if (dest === WHITELIST_LOCATION) {
            refreshWhiteList(whiteList.concat(data));
        }

        if (dest === BLACKLIST_LOCATION) {
            refreshBlackList(blackList.concat(data));
        }
    };

    const edit = (dest: WHITE_OR_BLACK_LOCATION, data: IncomingDefault) => {
        if (dest === WHITELIST_LOCATION) {
            refreshWhiteList(whiteList.filter(({ ID }) => ID !== data.ID).concat(data));
        }

        if (dest === BLACKLIST_LOCATION) {
            refreshBlackList(blackList.filter(({ ID }) => ID !== data.ID).concat(data));
        }
    };

    return {
        whiteList: whiteListFiltered,
        blackList: blackListFiltered,
        refreshWhiteList,
        refreshBlackList,
        remove,
        create,
        edit,
        search,
        move,
    };
};

export default useSpamList;
