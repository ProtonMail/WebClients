import { render } from '@testing-library/react';

import { LastActivityValue, LastConnectionValue } from './MemberUsageValues';

// Isolate the relative-day + gateway logic from TimeIntl's locale formatting.
jest.mock('../../../components/time/TimeIntl', () => ({
    __esModule: true,
    default: ({ children }: { children: number }) => <span>{`time:${children}`}</span>,
}));

const DAY = 24 * 60 * 60;
const now = Math.floor(Date.now() / 1000);
const yesterday = now - DAY;
const older = now - 10 * DAY;

describe('LastActivityValue', () => {
    it('renders a dash when there is no activity', () => {
        const { container } = render(<LastActivityValue lastActivity={null} />);
        expect(container.textContent).toBe('-');
    });

    it('renders the Today / Yesterday words without a time', () => {
        expect(render(<LastActivityValue lastActivity={now} />).container.textContent).toBe('Today');
        expect(render(<LastActivityValue lastActivity={yesterday} />).container.textContent).toBe('Yesterday');
    });

    it('renders a day-level date (no time) for older activity', () => {
        const { container } = render(<LastActivityValue lastActivity={older} />);
        expect(container.textContent).toBe(`time:${older}`);
    });
});

describe('LastConnectionValue', () => {
    it('renders a dash when there is no connection', () => {
        const { container } = render(<LastConnectionValue lastConnection={null} />);
        expect(container.textContent).toBe('-');
    });

    it('renders the relative time with a time part and the gateway name', () => {
        const { container } = render(
            <LastConnectionValue lastConnection={{ LastConnectionTime: now, Gateway: 'DEV-VPN' }} />
        );
        expect(container.textContent).toContain('Today');
        expect(container.textContent).toContain(`time:${now}`);
        expect(container.textContent).toContain('DEV-VPN');
    });
});
