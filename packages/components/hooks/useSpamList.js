import { useState } from 'react';
import { MAILBOX_IDENTIFIERS } from 'proton-shared/lib/constants';

const BLACKLIST_TYPE = +MAILBOX_IDENTIFIERS.spam;
const WHITELIST_TYPE = +MAILBOX_IDENTIFIERS.inbox;

const getFilterSearch = (input = '') => {
    const defaultFilter = (i) => i;
    if (!input) {
        return defaultFilter;
    }
    return ({ Email }) => Email.toLowerCase().includes(input.toLowerCase());
};

const useSpamList = () => {
    const [whiteList, setWhiteList] = useState([]);
    const [blackList, setBlackList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [whiteListFiltered, filterWhiteList] = useState(whiteList);
    const [blackListFiltered, filterBlackList] = useState(blackList);

    /**
     * Manage the data for the view as we will need
     *     - a state with the list
     *     - a state with the filtered version of the list
     * @param  {String} type  Type of list
     * @return {Function}       (data:<Array>, updateRawList:<Boolean:true>)
     */
    const refreshList = (type) => (data, { updateRawList = true, refreshSearch = true } = {}) => {
        const filter = getFilterSearch(searchQuery);

        if (type === 'blackList') {
            updateRawList && setBlackList(data);
            const list = !refreshSearch ? data : data.filter(filter);
            return filterBlackList(list);
        }

        updateRawList && setWhiteList(data);
        const list = !refreshSearch ? data : data.filter(filter);
        return filterWhiteList(list);
    };
    const refreshWhiteList = refreshList('whitelist');
    const refreshBlackList = refreshList('blackList');

    /**
     * Search through the list for matches.
     * Only update the filtered list as we don't want to lose the satte
     * @param  {String} input search value
     * @param  {Array}  data data coming from the API
     * @return {void}
     */
    const search = (input = '', data) => {
        const filter = getFilterSearch(input);
        const config = { updateRawList: false, refreshSearch: false };
        setSearchQuery(input);

        if (!data) {
            refreshWhiteList(whiteList.filter(filter), config);
            return refreshBlackList(blackList.filter(filter), config);
        }

        const { white, black } = data.reduce(
            (acc, item) => {
                const key = item.Location === WHITELIST_TYPE ? 'white' : 'black';
                acc[key].push(item);
                return acc;
            },
            { white: [], black: [] }
        );

        refreshWhiteList(white.filter(filter), config);
        refreshBlackList(black.filter(filter), config);
    };

    /**
     * Move an email from a list to another
     * @param  {String} dest       (white|black)list
     * @param  {String} options.ID Email's ID
     * @return {void}
     */
    const move = (dest, data) => {
        if (dest === 'whitelist') {
            refreshBlackList(blackList.filter((item) => item.ID !== data.ID));
            refreshWhiteList(whiteList.concat(data));
        }

        if (dest === 'blacklist') {
            refreshWhiteList(whiteList.filter((item) => item.ID !== data.ID));
            refreshBlackList(blackList.concat(data));
        }
    };

    /**
     * Remove an email from a list
     * @param  {String} options.ID       Email's ID
     * @param  {Number} options.Location Email's Location, either Spam or not
     * @return {void}
     */
    const remove = ({ ID, Location }) => {
        if (Location === WHITELIST_TYPE) {
            refreshWhiteList(whiteList.filter((item) => item.ID !== ID));
        }

        if (Location === BLACKLIST_TYPE) {
            refreshBlackList(blackList.filter((item) => item.ID !== ID));
        }
    };

    /**
     * Move an email from a list to another
     * @param  {String} dest       (white|black)list
     * @param  {String} options.ID Email's ID
     * @return {void}
     */
    const create = (dest, data) => {
        if (dest === 'whitelist') {
            refreshWhiteList(whiteList.concat(data));
        }

        if (dest === 'blacklist') {
            refreshBlackList(blackList.concat(data));
        }
    };

    return {
        whiteList: whiteListFiltered,
        blackList: blackListFiltered,
        refreshWhiteList,
        refreshBlackList,
        remove,
        create,
        search,
        move
    };
};

export default useSpamList;
