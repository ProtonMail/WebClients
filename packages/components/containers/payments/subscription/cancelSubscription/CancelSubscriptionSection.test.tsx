import { render } from '@testing-library/react';

import { mockSubscriptionCache, mockUserCache } from '@proton/components/hooks/helpers/test';
import { applyHOCs, withApi, withCache, withEventManager, withNotifications } from '@proton/testing/index';

import { CancelSubscriptionSection } from './CancelSubscriptionSection';

const CancelSubscriptionSectionContext = applyHOCs(
    withApi(),
    withEventManager(),
    withCache(),
    withNotifications()
)(CancelSubscriptionSection);

beforeEach(() => {
    jest.clearAllMocks();
    mockSubscriptionCache();
    mockUserCache();
});

it('should render', () => {
    const { container } = render(<CancelSubscriptionSectionContext />);
    expect(container).not.toBeEmptyDOMElement();
});

it('should return empty DOM element if no subscription', () => {
    mockSubscriptionCache(null as any);
    const { container } = render(<CancelSubscriptionSectionContext />);
    expect(container).toBeEmptyDOMElement();
});
