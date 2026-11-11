import { fireEvent, render, screen } from '@testing-library/react';

import LiteSettingsRow from './LiteSettingsRow';
import LiteSettingsSection from './LiteSettingsSection';

describe('LiteSettingsRow', () => {
    it('names its control with the label and shows the description', () => {
        render(
            <LiteSettingsRow label="Week start" description="Info" htmlFor="week-start">
                <input id="week-start" />
            </LiteSettingsRow>
        );

        expect(screen.getByLabelText('Week start')).toHaveAttribute('id', 'week-start');
        expect(screen.getByText('Info')).toBeInTheDocument();
    });

    it('shows a read-only value', () => {
        render(<LiteSettingsRow label="Default language" value="English" />);

        expect(screen.getByText('English')).toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('is a button when it navigates', () => {
        const onClick = jest.fn();
        render(<LiteSettingsRow label="Calendars" onClick={onClick} />);

        fireEvent.click(screen.getByRole('button', { name: /Calendars/ }));

        expect(onClick).toHaveBeenCalledTimes(1);
    });
});

describe('LiteSettingsSection', () => {
    it('renders a section heading', () => {
        render(
            <LiteSettingsSection title="Layout">
                <LiteSettingsRow label="Week start" />
            </LiteSettingsSection>
        );

        expect(screen.getByRole('heading', { name: 'Layout' })).toBeInTheDocument();
    });
});
