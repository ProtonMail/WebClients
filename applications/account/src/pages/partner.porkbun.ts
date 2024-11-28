import type { Parameters } from './interface';
import { getLoginDescription, getLoginTitle } from './interface';

const data = (): Parameters => ({
    title: getLoginTitle('Porkbun'),
    description: getLoginDescription('Porkbun'),
});

export default data;
