import * as useScheduleSendFeature from '../../components/composer/actions/scheduleSend/useScheduleSendFeature';

export const mockUseScheduleSendFeature = (value?: Partial<ReturnType<typeof useScheduleSendFeature.default>>) => {
    const mockedUseScheduleSendFeature = jest.spyOn(useScheduleSendFeature, 'default');

    mockedUseScheduleSendFeature.mockReturnValue({
        canScheduleSend: false,
        canScheduleSendCustom: false,
        loading: false,
        ...value,
    });

    return mockedUseScheduleSendFeature;
};
