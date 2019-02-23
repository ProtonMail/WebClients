import { useState } from 'react';
import { debounce } from 'proton-shared/lib/helpers/function';
import { normalize } from 'proton-shared/lib/helpers/string';

const useSearch = (initialKeywords = '', wait = 250) => {
    const [keywords, setKeywords] = useState(normalize(initialKeywords));
    const set = (value = '') => debounce(() => setKeywords(normalize(value)), wait);

    return {
        keywords,
        set
    };
};

export default useSearch;