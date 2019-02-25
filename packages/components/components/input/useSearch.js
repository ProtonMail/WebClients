import { useState } from 'react';
import { debounce } from 'proton-shared/lib/helpers/function';
import { normalize } from 'proton-shared/lib/helpers/string';

/**
 * Custom hook to use <Search> component
 * @param {String} initialKeywords
 * @param {Number} wait delay for debounce, set 0 for no debounce
 * @returns {String} o.keywords
 * @returns {Function} o.set contains debounce to set keywords value
 * @returns {Function} o.reset directly set an empty string
 */
const useSearch = (initialKeywords = '', wait = 500) => {
    const [keywords, setKeywords] = useState(normalize(initialKeywords));
    const set = (value = '') => debounce(() => setKeywords(normalize(value)), wait);
    const reset = () => setKeywords('');

    return {
        keywords,
        set,
        reset
    };
};

export default useSearch;