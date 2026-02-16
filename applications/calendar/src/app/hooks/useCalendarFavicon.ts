import useDynamicFavicon from '@proton/components/hooks/useDynamicFavicon';
import useDynamicMonthDay from '@proton/components/hooks/useDynamicMonthDay';

import favicons from '../../assets/favicons';

const useCalendarFavicon = () => {
    const monthDay = useDynamicMonthDay();
    useDynamicFavicon(favicons[monthDay]);
};

export default useCalendarFavicon;
