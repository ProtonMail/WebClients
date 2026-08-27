import { defaultESContextMail } from '../../constants';
import * as encryptedSearchProviderModule from '../../containers/EncryptedSearchProvider';

jest.mock('../../containers/EncryptedSearchProvider', () => ({
    __esModule: true,
    ...jest.requireActual('../../containers/EncryptedSearchProvider'),
    useEncryptedSearchContext: jest.fn(),
}));

export const mockUseEncryptedSearchContext = (
    value?: Partial<ReturnType<typeof encryptedSearchProviderModule.useEncryptedSearchContext>>
) => {
    const mockedUseEncryptedSearchContext = jest.mocked(encryptedSearchProviderModule.useEncryptedSearchContext);

    mockedUseEncryptedSearchContext.mockReturnValue({
        ...defaultESContextMail,
        ...value,
    });

    return mockedUseEncryptedSearchContext;
};
