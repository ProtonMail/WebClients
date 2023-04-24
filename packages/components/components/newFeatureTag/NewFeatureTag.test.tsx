import { render, screen } from '@testing-library/react';

import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';

import NewFeatureTag from './NewFeatureTag';

jest.mock('@proton/shared/lib/helpers/storage');
const mockedGetItem = jest.mocked(getItem);
const mockedSetItem = jest.mocked(setItem);
const mockedRemoveItem = jest.mocked(removeItem);
describe('NewFeatureTag component', () => {
    const featureKey = 'feature-key';
    const localStorageKey = `${featureKey}-new-tag`;
    const defaultValue = 'false';

    beforeEach(() => {
        // Monday, April 24, 2023 9:00:00 AM
        jest.setSystemTime(new Date('2023-04-24T09:00:00'));
        jest.clearAllMocks();
    });

    it('NewFeatureTag should be always shown by default', () => {
        // Friday, December 1, 2023 9:00:00 AM
        const endDate = new Date('2023-12-1T09:00:00');
        mockedGetItem.mockReturnValue(undefined);
        const { rerender } = render(<NewFeatureTag featureKey={featureKey} className="ml-10" endDate={endDate} />);

        expect(screen.getByText('New')).toBeInTheDocument();
        rerender(<NewFeatureTag featureKey={featureKey} className="ml-10" />);

        expect(mockedGetItem).toHaveBeenCalledWith(localStorageKey, defaultValue);
        expect(mockedSetItem).not.toHaveBeenCalled();
        expect(mockedRemoveItem).not.toHaveBeenCalled();
    });

    it('NewFeatureTag should be show once with showOnce', () => {
        const { rerender, unmount } = render(<NewFeatureTag featureKey={featureKey} showOnce className="ml-10" />);

        expect(screen.getByText('New')).toBeInTheDocument();
        expect(mockedGetItem).toHaveBeenCalledWith(localStorageKey, defaultValue);

        unmount();
        expect(mockedSetItem).toHaveBeenCalledWith(`${featureKey}-new-tag`, 'true');

        mockedGetItem.mockReturnValue('true');
        rerender(<NewFeatureTag featureKey={featureKey} showOnce className="ml-10" />);
        expect(mockedRemoveItem).not.toHaveBeenCalledWith();
        expect(screen.queryByText('New')).not.toBeInTheDocument();
    });

    it('NewFeatureTag should not be shown if date end', () => {
        // Thursday, December 1, 2022 9:00:00 AM
        const endDate = new Date('2022-12-01T09:00:00');
        const { unmount } = render(<NewFeatureTag featureKey={featureKey} endDate={endDate} className="ml-10" />);

        expect(screen.queryByText('New')).not.toBeInTheDocument();
        expect(mockedSetItem).not.toHaveBeenCalled();
        expect(mockedRemoveItem).toHaveBeenCalledWith(`${featureKey}-new-tag`);

        unmount();
        expect(setItem).not.toHaveBeenCalled();
    });
});
