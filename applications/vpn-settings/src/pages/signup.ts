import { Parameters } from 'proton-account/src/pages/interface';
import pricing from 'proton-account/src/pages/vpn.signup';

const data = (): Parameters => ({
    ...pricing(),
});

export default data;
