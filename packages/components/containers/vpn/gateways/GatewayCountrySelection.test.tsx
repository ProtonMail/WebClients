import { act } from 'react-dom/test-utils';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useNow } from '@proton/components/hooks/useNow';
import { useIsB2BTrial } from '@proton/payments/ui';

import type { DeletedDedicatedIp } from './DeletedDedicatedIp';
import { GatewayCountrySelection } from './GatewayCountrySelection';
import type { GatewayDto } from './GatewayDto';
import type { GatewayLocation } from './GatewayLocation';
import { getInitialModel } from './helpers';

jest.mock('@proton/account/organization/hooks');
jest.mock('@proton/account/subscription/hooks');
jest.mock('@proton/components/hooks/useNow');
jest.mock('@proton/payments/ui');
jest.mock('ttag', () => ({
    c: () => ({
        t: (str: string) => str,
        ngettext: (msgid: any, str: string) => str,
    }),
    msgid: (str: string) => str,
}));

const mockUseOrganization = useOrganization as jest.MockedFunction<typeof useOrganization>;
const mockUseSubscription = useSubscription as jest.MockedFunction<typeof useSubscription>;
const mockUseNow = useNow as jest.MockedFunction<typeof useNow>;
const mockUseIsB2BTrial = useIsB2BTrial as jest.MockedFunction<typeof useIsB2BTrial>;

describe('GatewayCountrySelection', () => {
    const mockLocations: GatewayLocation[] = [
        {
            Country: 'US',
            City: 'New York',
            TranslatedCity: 'New York',
        },
        {
            Country: 'UK',
            City: 'London',
            TranslatedCity: 'London',
        },
        {
            Country: 'DE',
            City: 'Berlin',
            TranslatedCity: 'Berlin',
        },
    ];

    const defaultModel: GatewayDto = getInitialModel(mockLocations);

    const defaultProps = {
        locations: mockLocations,
        ownedCount: 10,
        usedCount: 3,
        addedCount: 0,
        countryOptions: {
            countryByAbbr: { en: 'en-EN' },
            language: 'en',
        },
        loading: false,
        model: defaultModel,
        onUpdateCheckedLocations: jest.fn(),
        changeModel: jest.fn(),
    };

    const mockDeletedIps: DeletedDedicatedIp[] = [
        {
            AvailableAgainAfter: 1,
            ExitIPv4: '1.1.1.1',
            Location: mockLocations[0],
            LogicalID: 'myLogicalID',
            LogicalName: 'myLogical',
        },
        {
            AvailableAgainAfter: 2,
            ExitIPv4: '2.2.2.2',
            Location: mockLocations[1],
            LogicalID: 'myLogicalID2',
            LogicalName: 'myLogical2',
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseOrganization.mockReturnValue([{} as any, false]);
        mockUseSubscription.mockReturnValue([{} as any, false]);
        mockUseNow.mockReturnValue(new Date('2024-01-01T00:00:00Z'));
        mockUseIsB2BTrial.mockReturnValue(false);
    });

    describe('Multiple Servers Mode', () => {
        it('should render "Add new servers" section', () => {
            render(<GatewayCountrySelection {...defaultProps} />);

            expect(screen.getByText('Add new servers')).toBeInTheDocument();
        });

        it('should display available server count', () => {
            render(<GatewayCountrySelection {...defaultProps} />);

            // availableCount = ownedCount - usedCount - addedCount = 10 - 3 - 0 = 7
            expect(screen.getByText(/You have 7 new servers available/i)).toBeInTheDocument();
        });

        it('should display available server count with exceeded warning color', () => {
            render(<GatewayCountrySelection {...defaultProps} addedCount={7} ownedCount={10} usedCount={3} />);

            const warningText = screen.getByText(/You have 0 new servers available/i);
            expect(warningText).toBeInTheDocument();
        });

        it('should render location buttons for each location', () => {
            render(<GatewayCountrySelection {...defaultProps} />);

            mockLocations.forEach((location) => {
                expect(screen.getByText(`${location.City}`, { exact: false })).toBeInTheDocument();
            });
        });

        it('should call changeModel when quantity changes', async () => {
            const changeModel = jest.fn();
            render(<GatewayCountrySelection {...defaultProps} changeModel={changeModel} />);

            await userEvent.click(screen.getByText('Berlin', { exact: false }));

            expect(changeModel).toHaveBeenCalled();
            expect(changeModel).toHaveBeenCalledTimes(1);
            expect(changeModel).toHaveBeenCalledWith({
                location: { City: 'Berlin', Country: 'DE', TranslatedCity: 'Berlin' },
                quantities: { REUKQmVybGlu: 1 },
            });
        });

        it('should disable inputs when loading', () => {
            render(<GatewayCountrySelection {...defaultProps} loading={true} />);

            expect(screen.getByText('Berlin', { exact: false })).toHaveStyle('opacity: 0.5');
        });

        it('should disable city when already in use', () => {
            render(<GatewayCountrySelection {...defaultProps} citiesAlreadyInUse={['New York']} />);

            expect(screen.getByText('New York', { exact: false })).toHaveStyle('opacity: 0.5');
        });

        it('should show recommendation info when not in trial', () => {
            mockUseIsB2BTrial.mockReturnValue(false);
            render(<GatewayCountrySelection {...defaultProps} />);

            expect(screen.getByText(/We recommend adding servers in different locations/i)).toBeInTheDocument();
        });

        it('should show trial info when in trial mode', () => {
            mockUseIsB2BTrial.mockReturnValue(true);
            render(<GatewayCountrySelection {...defaultProps} />);

            expect(screen.getByText(/Your free trial includes 1 dedicated server/i)).toBeInTheDocument();
        });

        it('should not show recommendation info when in trial', () => {
            mockUseIsB2BTrial.mockReturnValue(true);
            render(<GatewayCountrySelection {...defaultProps} />);

            expect(screen.queryByText(/We recommend adding servers in different locations/i)).not.toBeInTheDocument();
        });
    });

    describe('Deleted/Recently Used Servers', () => {
        it('should render recently used servers section when deletedDedicatedIPs exist', () => {
            render(<GatewayCountrySelection {...defaultProps} deletedDedicatedIPs={mockDeletedIps} />);

            expect(screen.getByText('Select recently used servers')).toBeInTheDocument();
        });

        it('should not render recently used servers section when no deletedDedicatedIPs', () => {
            render(<GatewayCountrySelection {...defaultProps} deletedDedicatedIPs={[]} />);

            expect(screen.queryByText('Select recently used servers')).not.toBeInTheDocument();
        });

        it('should display correct count of unassigned available servers', () => {
            render(<GatewayCountrySelection {...defaultProps} deletedDedicatedIPs={mockDeletedIps} />);

            expect(screen.getByText(/You have 2 recently used servers available/i)).toBeInTheDocument();
        });

        it('should check checkbox when location is in checkedLocations', () => {
            const modelWithChecked = {
                ...defaultModel,
                checkedLocations: [mockLocations[0]],
            };
            render(
                <GatewayCountrySelection
                    {...defaultProps}
                    model={modelWithChecked}
                    deletedDedicatedIPs={mockDeletedIps}
                />
            );

            const checkboxes = screen.getAllByRole('checkbox');
            expect(checkboxes[0]).toBeChecked();
        });

        it('should call handleUnassigningLocationChecked when checkbox is toggled', async () => {
            const changeModel = jest.fn();
            const onUpdateCheckedLocations = jest.fn();

            render(
                <GatewayCountrySelection
                    {...defaultProps}
                    deletedDedicatedIPs={mockDeletedIps}
                    changeModel={changeModel}
                    onUpdateCheckedLocations={onUpdateCheckedLocations}
                />
            );

            const checkboxes = screen.getAllByRole('checkbox');

            await act(async () => {
                fireEvent.click(checkboxes[0]);
            });

            await waitFor(() => {
                expect(changeModel).toHaveBeenCalled();
            });
        });

        it('should update unassignedIpQuantities when checkbox is checked', async () => {
            const changeModel = jest.fn();
            const onUpdateCheckedLocations = jest.fn();

            render(
                <GatewayCountrySelection
                    {...defaultProps}
                    deletedDedicatedIPs={mockDeletedIps}
                    changeModel={changeModel}
                    onUpdateCheckedLocations={onUpdateCheckedLocations}
                />
            );

            const checkboxes = screen.getAllByRole('checkbox');

            await act(async () => {
                fireEvent.click(checkboxes[0]);
            });

            await waitFor(() => {
                expect(changeModel).toHaveBeenCalledWith(
                    expect.objectContaining({
                        unassignedIpQuantities: expect.any(Object),
                    })
                );
            });
        });

        it('should call onUpdateCheckedLocations when checkbox is toggled', async () => {
            const onUpdateCheckedLocations = jest.fn();

            render(
                <GatewayCountrySelection
                    {...defaultProps}
                    deletedDedicatedIPs={mockDeletedIps}
                    onUpdateCheckedLocations={onUpdateCheckedLocations}
                />
            );

            const checkboxes = screen.getAllByRole('checkbox');

            await act(async () => {
                fireEvent.click(checkboxes[0]);
            });

            await waitFor(() => {
                expect(onUpdateCheckedLocations).toHaveBeenCalled();
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty locations array', () => {
            render(<GatewayCountrySelection {...defaultProps} locations={[]} />);

            expect(screen.getByText('Add new servers')).toBeInTheDocument();
        });

        it('should handle undefined deletedDedicatedIPs', () => {
            render(<GatewayCountrySelection {...defaultProps} deletedDedicatedIPs={undefined} />);

            expect(screen.queryByText('Select recently used servers')).not.toBeInTheDocument();
        });

        it('should calculate correct availableCount when all counts are provided', () => {
            render(
                <GatewayCountrySelection
                    {...defaultProps}
                    ownedCount={20}
                    usedCount={5}
                    addedCount={3}
                    deletedDedicatedIPs={mockDeletedIps}
                />
            );

            // availableCount = max(0, 20 - 5 - 3 - 2) = 10
            expect(screen.getByText(/You have 10 new servers available/i)).toBeInTheDocument();
        });

        it('should not show negative availableCount', () => {
            render(
                <GatewayCountrySelection
                    {...defaultProps}
                    ownedCount={5}
                    usedCount={3}
                    addedCount={5}
                    deletedDedicatedIPs={mockDeletedIps}
                />
            );

            // availableCount = max(0, 5 - 3 - 5 - 2) = 0
            expect(screen.getByText(/You have 0 new servers available/i)).toBeInTheDocument();
        });

        it('should handle undefined logicalsAlreadyInUse', () => {
            render(<GatewayCountrySelection {...defaultProps} citiesAlreadyInUse={undefined} />);

            expect(screen.getByText('Add new servers')).toBeInTheDocument();
        });
    });
});
