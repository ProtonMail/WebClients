import { render, screen } from '@testing-library/react';

import type { SpotlightProps } from '@proton/components/components/spotlight/Spotlight';
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';

import type { IsActiveInEnvironmentContainer } from './NewFeatureTag';
import NewFeatureTag from './NewFeatureTag';

jest.mock('@proton/shared/lib/helpers/storage');
const mockedGetItem = jest.mocked(getItem);
const mockedSetItem = jest.mocked(setItem);
const mockedRemoveItem = jest.mocked(removeItem);

const SPOTLIGHT_ID = 'this-is-a-mocked-spotlight';
const NEW_FEATURE_TAG_ID = 'this-is-a-test-instance-of-new-feature-tag';
jest.mock('@proton/components', () => ({
    __esModule: true,
    Spotlight: () => <div data-testid={SPOTLIGHT_ID}></div>,
}));
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
        const { unmount } = render(<NewFeatureTag featureKey={featureKey} showOnce className="ml-10" />);

        expect(screen.getByText('New')).toBeInTheDocument();
        expect(mockedGetItem).toHaveBeenCalledWith(localStorageKey, defaultValue);

        unmount();
        expect(mockedSetItem).toHaveBeenCalledWith(`${featureKey}-new-tag`, 'true');

        mockedGetItem.mockReturnValue('true');
        render(<NewFeatureTag featureKey={featureKey} showOnce className="ml-10" />);
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

    it('should add a Spotlight', () => {
        const spotlightProps: SpotlightProps = {
            show: true,
            content: <div></div>,
        };
        const result = render(
            <NewFeatureTag featureKey={'doesntmatterhere'} spotlightProps={spotlightProps}></NewFeatureTag>
        );
        expect(result.getByTestId(SPOTLIGHT_ID)).toBeTruthy();
    });

    it('should not render if it was not in the proper environment', () => {
        const environmentDontRender: IsActiveInEnvironmentContainer = {
            default: false,
            alpha: false,
            beta: false,
        };
        const resultNotRendered = render(
            <NewFeatureTag
                data-testid=""
                featureKey={'doesntmatterhere'}
                isActiveInEnvironment={environmentDontRender}
            ></NewFeatureTag>
        );
        expect(() => resultNotRendered.getByTestId(NEW_FEATURE_TAG_ID)).toThrowError(
            'Unable to find an element by: [data-testid="this-is-a-test-instance-of-new-feature-tag"]'
        );
        const environmentRender: IsActiveInEnvironmentContainer = {
            default: true,
            alpha: true,
            beta: true,
        };
        const resultRendered = render(
            <NewFeatureTag
                data-testid=""
                featureKey={'doesntmatterhere'}
                isActiveInEnvironment={environmentRender}
            ></NewFeatureTag>
        );
        expect(() => resultRendered.getByTestId(NEW_FEATURE_TAG_ID)).toBeTruthy();
    });
});
