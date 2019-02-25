import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';

// Jan 17, 2016
const readableTime = (time, format = 'LL') => {
    dayjs.extend(LocalizedFormat);

    const d = dayjs.unix(time);

    if (d.isSame(dayjs(), 'day')) {
        return d.format('LT');
    }

    return d.format(format);
};

export default readableTime;
