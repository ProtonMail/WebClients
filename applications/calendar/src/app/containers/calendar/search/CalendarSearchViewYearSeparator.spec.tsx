import { render, screen } from '@testing-library/react';

import CalendarSearchViewYearSeparator from './CalendarSearchViewYearSeparator';

describe('CalendarSearchViewYearSeparator', () => {
    it('should render line with correct year', () => {
        render(<CalendarSearchViewYearSeparator year={2023} />);
        expect(screen.getByRole('heading', { name: /2023/, level: 3 }));
    });
});
