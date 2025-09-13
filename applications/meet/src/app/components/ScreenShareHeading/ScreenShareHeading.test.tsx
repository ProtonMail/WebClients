import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ScreenShareHeading } from './ScreenShareHeading';

describe('ScreenShareHeading', () => {
    it('should have the proper title and the stop button if the user is local', async () => {
        const onStopScreenShare = vi.fn();

        render(<ScreenShareHeading name="test" isLocalUser={true} onStopScreenShare={onStopScreenShare} />);

        const user = userEvent.setup();

        expect(screen.getByText('test (you) is presenting')).toBeInTheDocument();

        const stopButton = screen.getByText('Stop presenting');

        expect(stopButton).toBeInTheDocument();

        await user.click(stopButton);

        expect(onStopScreenShare).toHaveBeenCalled();
    });

    it('should have the proper title and no stop button if the user is not local', () => {
        render(<ScreenShareHeading name="test" isLocalUser={false} onStopScreenShare={() => {}} />);

        expect(screen.getByText('test is presenting')).toBeInTheDocument();

        expect(screen.queryByText('Stop presenting')).not.toBeInTheDocument();
    });
});
