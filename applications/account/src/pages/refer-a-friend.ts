import { Parameters } from './interface';
import trial from './trial';

const data = (): Parameters => ({
    ...trial(),
});

export default data;
