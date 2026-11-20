import { defaultESContextMail } from '../../constants';
import * as encryptedSearchProviderModule from '../../containers/EncryptedSearchProvider';

vi.mock('../../containers/EncryptedSearchProvider', async () => ({
    __esModule: true,
    ...(await vi.importActual('../../containers/EncryptedSearchProvider')),
    useEncryptedSearchContext: vi.fn(),
}));

export const mockUseEncryptedSearchContext = (
    value?: Partial<ReturnType<typeof encryptedSearchProviderModule.useEncryptedSearchContext>>
) => {
    const mockedUseEncryptedSearchContext = vi.mocked(encryptedSearchProviderModule.useEncryptedSearchContext);

    mockedUseEncryptedSearchContext.mockReturnValue({
        ...defaultESContextMail,
        ...value,
    });

    return mockedUseEncryptedSearchContext;
};
