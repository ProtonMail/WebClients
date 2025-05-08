import { render } from '@testing-library/react';

import { MeetContainer } from './MeetContainer';

describe('MeetContainer', () => {
    it('should render', () => {
        const screen = render(<MeetContainer />);

        expect(screen.getByText('Proton Meet')).toBeInTheDocument();
    });
});
