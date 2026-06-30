import type { Parameters } from './interface';
import referAFriend from './refer-a-friend';

const data = (): Parameters => ({
    ...referAFriend(),
});

export default data;
