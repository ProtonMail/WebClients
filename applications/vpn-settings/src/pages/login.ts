import { Parameters } from 'proton-account/src/pages/interface';
import result from 'proton-account/src/pages/vpn.login';

const data = (): Parameters => ({
    ...result(),
});

export default data;
