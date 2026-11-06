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
    expect(screen.queryByRole('button', { name: 'Read only' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add connector' }).closest('fieldset')).toHaveTextContent('Mail');
    fireEvent.click(screen.getByRole('button', { name: 'Permissions' }));
    const readOnly = screen.getByRole('button', { name: 'Read only' });
    expect(readOnly).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(readOnly);
    expect(onChange).toHaveBeenCalledWith([{ id: 'mail', label: 'Mail', readOnly: true }]);
});

test('the user can allow write tools without removing the connector', () => {
    const onChange = jest.fn();
    render(<ConnectorList editMode value={[{ id: 'mail', label: 'Mail', readOnly: true }]} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Permissions' }));
    fireEvent.click(screen.getByRole('button', { name: 'Read and write' }));
    expect(onChange).toHaveBeenCalledWith([{ id: 'mail', label: 'Mail', readOnly: false }]);
});

test('older desktops disable read-only access but allow an explicit change to read and write', () => {
    jest.mocked(supportsDesktopScheduleReadOnly).mockReturnValue(false);
    const onChange = jest.fn();
    render(<ConnectorList editMode value={[{ id: 'mail', label: 'Mail', readOnly: true }]} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Permissions' }));
    const readOnly = screen.getByRole('button', { name: 'Read only' });
    expect(readOnly).toBeDisabled();
    expect(readOnly).toHaveAttribute('title', 'Update Lumo Desktop to use read-only connector access for this task.');
    const readAndWrite = screen.getByRole('button', { name: 'Read and write' });
    expect(readAndWrite).not.toBeDisabled();
    fireEvent.click(readAndWrite);
    expect(onChange).toHaveBeenCalledWith([{ id: 'mail', label: 'Mail', readOnly: false }]);
});

test.each([true, false])('new connector selections stay unrestricted when read-only support is %s', (supported) => {
    jest.mocked(supportsDesktopScheduleReadOnly).mockReturnValue(supported);
    const onChange = jest.fn();
    render(<ConnectorList editMode value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add connector' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mail' }));
    expect(onChange).toHaveBeenCalledWith([{ id: 'mail', label: 'Mail', icon: undefined }]);
});
