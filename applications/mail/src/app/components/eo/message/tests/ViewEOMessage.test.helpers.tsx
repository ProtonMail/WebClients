import { EORender } from '../../../../helpers/tests/eo/EORender';
import type { EOOriginalMessageOptions } from '../../../../helpers/tests/eo/helpers';
import ViewEOMessage from '../ViewEOMessage';

export const setup = async (options?: EOOriginalMessageOptions) => {
    const renderResult = await EORender(<ViewEOMessage setSessionStorage={jest.fn()} />, {
        routePath: '/eo/message/:id',
        initialRoute: 'message',
        options,
    });
    return renderResult;
};
