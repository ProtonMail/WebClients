import { fireEvent, screen, waitFor } from '@testing-library/react';

import { clearAll, renderWithProviders } from '@proton/components/containers/contacts/tests/vitest/render';
import { addApiMock, apiMock, clearApiMocks } from '@proton/test-api/vitest/api';

import type { AdvancedSimpleFilterModalModel } from '../../interfaces';
import AdvancedFilterModal from './AdvancedFilterModal';

vi.mock('./SieveForm', () => ({
    default: ({
        model,
        onChange,
    }: {
        model: AdvancedSimpleFilterModalModel;
        onChange: (model: AdvancedSimpleFilterModalModel) => void;
    }) => (
        <textarea
            aria-label="Sieve"
            aria-invalid={model.issues.length > 0}
            value={model.sieve}
            onChange={(event) => onChange({ ...model, sieve: event.target.value })}
        />
    ),
}));

describe('AdvancedFilterModal', () => {
    afterEach(() => {
        clearAll();
        clearApiMocks();
    });

    it('checks the script as typed when saved right away', async () => {
        addApiMock('mail/v4/filters', () => ({ Filters: [] }), 'get');
        addApiMock('mail/v4/filters/check', () => ({ Issues: [{ line: 1, column: 1, message: 'unknown command' }] }));
        renderWithProviders(<AdvancedFilterModal open />);

        fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'My filter' } });
        fireEvent.change(screen.getByLabelText('Sieve'), { target: { value: 'nonsense;' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() =>
            expect(apiMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: 'mail/v4/filters/check',
                    data: expect.objectContaining({ Sieve: 'nonsense;' }),
                })
            )
        );
        await waitFor(() => expect(screen.getByLabelText('Sieve')).toHaveAttribute('aria-invalid', 'true'));
        expect(apiMock).not.toHaveBeenCalledWith(expect.objectContaining({ url: 'mail/v4/filters', method: 'post' }));
    });
});
