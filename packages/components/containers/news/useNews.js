import { useState } from 'react';
import { fromBitmap } from 'proton-shared/lib/helpers/object';

const useNews = (initialNews, keys = []) => {
    const [news, set] = useState(fromBitmap(initialNews, keys));
    const setNews = (bitmap) => set(fromBitmap(bitmap, keys));

    return { news, setNews };
};

export default useNews;