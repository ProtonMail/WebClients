import { Parameters } from './interface';
import signup from './signup';

const data = (): Parameters => ({
    ...signup(),
});

export default data;
