import { defaultESContextMail } from '../../constants';
import * as encryptedSearchProviderModule from '../../containers/EncryptedSearchProvider';

export const mockUseEncryptedSearchContext = (
    value?: Partial<ReturnType<typeof encryptedSearchProviderModule.useEncryptedSearchContext>>
) => {
    const mockedUseEncryptedSearchContext = jest.spyOn(encryptedSearchProviderModule, 'useEncryptedSearchContext');

    mockedUseEncryptedSearchContext.mockReturnValue({
        ...defaultESContextMail,
        ...value,
    });

    return mockedUseEncryptedSearchContext;
};
