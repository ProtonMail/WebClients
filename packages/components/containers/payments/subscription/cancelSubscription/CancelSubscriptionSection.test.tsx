import { render } from '@testing-library/react';

import { useSubscription } from '@proton/components/hooks/useSubscription';
import { useUser } from '@proton/components/hooks/useUser';
import { applyHOCs, withApi, withCache, withEventManager, withNotifications } from '@proton/testing/index';

import { CancelSubscriptionSection } from './CancelSubscriptionSection';

jest.mock('@proton/components/hooks/useUser');
const mockUseUser = useUser as jest.MockedFunction<any>;
jest.mock('@proton/components/hooks/useSubscription');
const mockUseSubscription = useSubscription as jest.MockedFunction<any>;

const CancelSubscriptionSectionContext = applyHOCs(
    withApi(),
    withEventManager(),
    withCache(),
    withNotifications()
)(CancelSubscriptionSection);

beforeEach(() => {
    jest.clearAllMocks();
});

it('should render', () => {
    mockUseUser.mockReturnValue([{}, false]);
    mockUseSubscription.mockReturnValue([{}, false]);
    const { container } = render(<CancelSubscriptionSectionContext />);
    expect(container).not.toBeEmptyDOMElement();
});

it('should return empty DOM element if no subscription', () => {
    mockUseUser.mockReturnValue([{}, false]);
    mockUseSubscription.mockReturnValue([null, false]);
    const { container } = render(<CancelSubscriptionSectionContext />);
    expect(container).toBeEmptyDOMElement();
});
