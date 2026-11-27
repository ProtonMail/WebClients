import { render } from '@testing-library/react';

import { mockUseSpotlightOnFeature } from '../../../../testing/mockUseSpotlightOnFeature';
import BreachAlertsSpotlight from './BreachAlertsSpotlight';

vi.mock('@proton/account/organization/hooks', () => ({ useOrganization: vi.fn(() => [undefined]) }));
vi.mock('@proton/account/subscription/hooks', () => ({ useSubscription: vi.fn(() => [undefined]) }));
vi.mock('@proton/account/user/hooks', () => ({ useUser: vi.fn(() => [{ CreateTime: 0 }]) }));
vi.mock('@proton/account/welcomeFlags', () => ({ useWelcomeFlags: vi.fn(() => ({ welcomeFlags: { isDone: true } })) }));
vi.mock('../../../spotlight/useSpotlightShow', () => ({ __esModule: true, default: vi.fn(() => true) }));

const renderBreachAlerts = (replaced: boolean) => {
    return render(
        <BreachAlertsSpotlight replaced={replaced}>
            <button type="button">Security center</button>
        </BreachAlertsSpotlight>
    );
};

describe('BreachAlertsSpotlight', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('closes the breach alerts bubble when replaced', () => {
        const onClose = vi.fn();
        mockUseSpotlightOnFeature({ show: true, onClose });

        const { rerender } = renderBreachAlerts(false);
        rerender(
            <BreachAlertsSpotlight replaced>
                <button type="button">Security center</button>
            </BreachAlertsSpotlight>
        );

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('leaves it alone otherwise', () => {
        const onClose = vi.fn();
        mockUseSpotlightOnFeature({ show: true, onClose });

        renderBreachAlerts(false);

        expect(onClose).not.toHaveBeenCalled();
    });
});
