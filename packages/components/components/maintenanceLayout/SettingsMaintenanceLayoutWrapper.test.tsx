import { render } from '@testing-library/react';

import { FeatureFlag, SettingsAreaConfig, useFlag } from '../..';
import SettingsMaintenanceLayoutWrapper from './SettingsMaintenanceLayoutWrapper';

const config: SettingsAreaConfig = {
    text: 'text',
    subsections: [
        {
            text: 'text',
            id: 'id',
        },
    ],
};

jest.mock('../..');
const mockUseFlag = useFlag as unknown as jest.MockedFunction<any>;
jest.mock('@proton/components/hooks/useAppTitle');
jest.mock('react-router', () => ({
    __esModule: true,
    useLocation: jest.fn().mockReturnValue({ location: { pathname: '/' } }),
}));

describe('SettingsMaintenanceLayoutWrapper', () => {
    it('should handle is in Maintenance', () => {
        mockUseFlag.mockReturnValue(true);

        const { getByText } = render(
            <SettingsMaintenanceLayoutWrapper config={config} maintenanceFlag={FeatureFlag.MaintenanceImporter}>
                <div>children</div>
            </SettingsMaintenanceLayoutWrapper>
        );

        expect(getByText('This feature is temporarily unavailable')).toBeInTheDocument();
    });
    it('should handle is not in maintenance', () => {
        mockUseFlag.mockReturnValue(false);

        const { getByText } = render(
            <SettingsMaintenanceLayoutWrapper config={config} maintenanceFlag={FeatureFlag.MaintenanceImporter}>
                <div>children</div>
            </SettingsMaintenanceLayoutWrapper>
        );

        expect(getByText('children')).toBeInTheDocument();
    });
});
