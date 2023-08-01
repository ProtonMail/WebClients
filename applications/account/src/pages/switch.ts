import { Parameters } from './interface';
import login from './login';

const data = (): Parameters => ({
    ...login(),
});

export default data;
