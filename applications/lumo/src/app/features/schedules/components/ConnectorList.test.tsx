import { fireEvent, render, screen } from '@testing-library/react';

import { supportsDesktopScheduleReadOnly, useDesktopManifests } from '@proton/lumo-api-client/core/desktop-tools';

import { ConnectorList } from './ConnectorList';

jest.mock('@proton/lumo-api-client/core/desktop-tools', () => ({
    supportsDesktopScheduleReadOnly: jest.fn(),
    useDesktopManifests: jest.fn(),
    openDesktopSettings: jest.fn(),
}));

beforeEach(() => {
    jest.mocked(supportsDesktopScheduleReadOnly).mockReturnValue(true);
    jest.mocked(useDesktopManifests).mockReturnValue({
        status: 'ready',
        manifests: [{ id: 'mail', display_name: 'Mail', status: { state: 'ready' }, tools: [] }],
    });
});

test('editing legacy access starts unrestricted and lets the user select read-only access', () => {
    const onChange = jest.fn();
    render(<ConnectorList editMode value={[{ id: 'mail', label: 'Mail' }]} onChange={onChange} />);
    const toggle = screen.getByRole('checkbox', { name: 'Read-only access for Mail' });
    expect(toggle).not.toBeChecked();
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith([{ id: 'mail', label: 'Mail', readOnly: true }]);
});

test('the user can allow write tools without removing the connector', () => {
    const onChange = jest.fn();
    render(<ConnectorList editMode value={[{ id: 'mail', label: 'Mail', readOnly: true }]} onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Read-only access for Mail' }));
    expect(onChange).toHaveBeenCalledWith([{ id: 'mail', label: 'Mail', readOnly: false }]);
});

test('older desktops cannot silently relax an existing read-only selection', () => {
    jest.mocked(supportsDesktopScheduleReadOnly).mockReturnValue(false);
    render(<ConnectorList editMode value={[{ id: 'mail', label: 'Mail', readOnly: true }]} onChange={jest.fn()} />);
    expect(screen.getByRole('checkbox', { name: 'Read-only access for Mail' })).toBeDisabled();
    expect(
        screen.getByText('Update Lumo Desktop to use read-only connector access for this task.')
    ).toBeInTheDocument();
});

test.each([true, false])('new connector selections default to read-only when support is %s', (supported) => {
    jest.mocked(supportsDesktopScheduleReadOnly).mockReturnValue(supported);
    const onChange = jest.fn();
    render(<ConnectorList editMode value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add connector' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mail' }));
    expect(onChange).toHaveBeenCalledWith([{ id: 'mail', label: 'Mail', icon: undefined, readOnly: supported }]);
});
