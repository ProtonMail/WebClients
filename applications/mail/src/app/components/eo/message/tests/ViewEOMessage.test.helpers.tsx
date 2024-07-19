import { EORender } from '../../../../helpers/test/eo/EORender';
import type { EOOriginalMessageOptions } from '../../../../helpers/test/eo/helpers';
import ViewEOMessage from '../ViewEOMessage';

export const setup = async (options?: EOOriginalMessageOptions) => {
    const renderResult = await EORender(<ViewEOMessage setSessionStorage={jest.fn()} />, {
        routePath: '/eo/message/:id',
        initialRoute: 'message',
        options,
    });
    return renderResult;
};
