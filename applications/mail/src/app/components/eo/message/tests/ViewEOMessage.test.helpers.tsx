import { EORender } from '../../../../helpers/test/eo/EORender';
import { EOInitStore, EOOriginalMessageOptions } from '../../../../helpers/test/eo/helpers';
import ViewEOMessage from '../ViewEOMessage';

export const setup = async (options?: EOOriginalMessageOptions) => {
    await EOInitStore('message', options);

    const renderResult = await EORender(<ViewEOMessage setSessionStorage={jest.fn()} />, '/eo/message/:id');

    return renderResult;
};
