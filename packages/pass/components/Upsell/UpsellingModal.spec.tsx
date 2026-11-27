import { fireEvent, screen, waitFor } from '@testing-library/react';

import { PLANS } from '@proton/payments/core/constants';

import { UpsellRef } from '../../constants';
import type { PassPlanResponse } from '../../types/api/pass';
import { PlanType } from '../../types/api/pass';
import { render } from '../../utils/tests/render';
import { UpsellingModal } from './UpsellingModal';

const mailPlus = { Type: PlanType.FREE, InternalName: PLANS.MAIL, DisplayName: 'Mail Plus' } as PassPlanResponse;

describe('UpsellingModal', () => {
    test('a Mail Plus user is upsold to Proton Unlimited, not Pass Plus', async () => {
        const onLink = vi.fn();

        render(<UpsellingModal open upsellType="pass-monitor" upsellRef={UpsellRef.PASS_MONITOR} />, {
            state: { user: { plan: mailPlus } },
            core: { onLink },
        });

        expect(screen.queryByText('Get Pass Plus')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: /Get Proton Unlimited/ }));

        await waitFor(() => expect(onLink).toHaveBeenCalledTimes(1));
        const url = new URL(onLink.mock.calls[0][0], 'https://account.proton.me');
        expect(url.pathname).toBe('/pass/dashboard');
        expect(url.searchParams.get('plan')).toBe(PLANS.BUNDLE);
    });
});
