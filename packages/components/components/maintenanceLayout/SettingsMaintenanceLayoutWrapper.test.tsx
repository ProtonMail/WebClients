import { render } from '@testing-library/react';

import { useFlag } from '@proton/unleash';

import type { SettingsAreaConfig } from '../../containers/layout/interface';
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

        const { getByText, queryByText } = render(
            <SettingsMaintenanceLayoutWrapper config={config} maintenanceFlag="MaintenanceImporter">
                <div>children</div>
            </SettingsMaintenanceLayoutWrapper>
        );

        expect(queryByText(config.text)).toBeTruthy();
        expect(getByText('This feature is temporarily unavailable')).toBeInTheDocument();
    });
    it('should handle is not in maintenance', () => {
        mockUseFlag.mockReturnValue(false);

        const { getByText, queryByText } = render(
            <SettingsMaintenanceLayoutWrapper config={config} maintenanceFlag="MaintenanceImporter">
                <div>children</div>
            </SettingsMaintenanceLayoutWrapper>
        );

        expect(queryByText(config.text)).toBeNull();
        expect(getByText('children')).toBeInTheDocument();
    });

    it('should handle is in maintenance and is subsection', () => {
        mockUseFlag.mockReturnValue(true);

        const { getByText, queryByText } = render(
            <SettingsMaintenanceLayoutWrapper config={config} maintenanceFlag="MaintenanceImporter" isSubsection>
                <div>children</div>
            </SettingsMaintenanceLayoutWrapper>
        );

        expect(queryByText(config.text)).toBeNull();
        expect(getByText('This feature is temporarily unavailable')).toBeInTheDocument();
    });

    it('should handle is not in maintenance and is subsection', () => {
        mockUseFlag.mockReturnValue(false);

        const { getByText, queryByText } = render(
            <SettingsMaintenanceLayoutWrapper config={config} maintenanceFlag="MaintenanceImporter" isSubsection>
                <div>children</div>
            </SettingsMaintenanceLayoutWrapper>
        );

        expect(queryByText(config.text)).toBeNull();
        expect(getByText('children')).toBeInTheDocument();
    });
});
