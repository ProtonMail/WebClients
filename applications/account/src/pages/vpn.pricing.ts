import { Parameters } from './interface';
import signup from './vpn.signup';

const data = (): Parameters => ({
    ...signup(),
});

export default data;
