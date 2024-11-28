import type { Parameters } from './interface';
import { getSignupDescription, getSignupTitle } from './interface';

const data = (): Parameters => ({
    title: getSignupTitle('Porkbun'),
    description: getSignupDescription('Porkbun'),
});

export default data;
