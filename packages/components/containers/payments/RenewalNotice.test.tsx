import { render } from '@testing-library/react';

import RenewalNotice from './RenewalNotice';

describe('<RenewalNotice />', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should render', () => {
        const { container } = render(
            <RenewalNotice renewCycle={12} isCustomBilling={false} subscription={undefined} />
        );
        expect(container).not.toBeEmptyDOMElement();
    });

    it('should display the correct renewal date', () => {
        const mockedDate = new Date(2023, 10, 1);
        jest.setSystemTime(mockedDate);

        const renewCycle = 12;
        const expectedDateString = '01/11/2024'; // because months are 0-indexed ¯\_(ツ)_/¯

        const { container } = render(
            <RenewalNotice renewCycle={renewCycle} isCustomBilling={false} subscription={undefined} />
        );
        expect(container).toHaveTextContent(`Your subscription will renew automatically on ${expectedDateString}.`);
    });

    it('should use period end date if custom billing is enabled', () => {
        const mockedDate = new Date(2023, 10, 1);
        jest.setSystemTime(mockedDate);

        const renewCycle = 12;
        const expectedDateString = '08/08/2025'; // because months are 0-indexed ¯\_(ツ)_/¯

        const { container } = render(
            <RenewalNotice
                renewCycle={renewCycle}
                isCustomBilling={true}
                subscription={
                    {
                        PeriodEnd: +new Date(2025, 7, 8) / 1000,
                    } as any
                }
            />
        );
        expect(container).toHaveTextContent(`Your subscription will renew automatically on ${expectedDateString}.`);
    });
});
