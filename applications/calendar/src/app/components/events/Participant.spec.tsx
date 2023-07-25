import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { render } from '../../helpers/test/render';
import Participant from './Participant';

describe('Participant', () => {
    const onCreateOrEditContactCallback = jest.fn();
    const props = {
        icon: <span>{'Icon'}</span>,
        name: 'text',
        title: 'title',
        tooltip: 'tooltip',
        initials: 'initials',
        email: 'email@provider.com',
        isContact: true,
        isCurrentUser: false,
        onCreateOrEditContact: onCreateOrEditContactCallback,
    };

    afterEach(() => {
        onCreateOrEditContactCallback.mockClear();
    });

    it('should render correctly', () => {
        const { rerender } = render(<Participant {...props} />);

        expect(screen.getByText(props.name)).toBeInTheDocument();
        expect(screen.getByText(props.email)).toBeInTheDocument();
        expect(screen.getByText(props.initials)).toBeInTheDocument();
        expect(screen.getByText('Icon')).toBeInTheDocument();

        rerender(<Participant {...props} extraText="extraText" />);
        expect(screen.getByText('extraText')).toBeInTheDocument();
    });

    it('should render email only one time', () => {
        render(<Participant {...props} name={props.email} />);
        expect(screen.getByText(props.email)).toBeInTheDocument();
        expect(screen.queryAllByText(props.email)).toHaveLength(1);
    });

    it('should not render email if isCurrentUser', () => {
        render(<Participant {...props} isCurrentUser />);
        expect(screen.queryByText(props.email)).not.toBeInTheDocument();
    });

    it('should render dropdown on user click', async () => {
        render(<Participant {...props} />);

        userEvent.click(screen.getByTitle('More options'));

        await waitFor(() => {
            expect(screen.getByText('Copy email address')).toBeInTheDocument();
        });
        expect(screen.getByText('View contact details')).toBeInTheDocument();
    });

    describe('Contact modals callbacks', () => {
        it('should call contact details modal callback', async () => {
            render(<Participant {...props} isContact />);

            userEvent.click(screen.getByTitle('More options'));

            await waitFor(() => {
                expect(screen.getByText('View contact details')).toBeInTheDocument();
            });

            userEvent.click(screen.getByText('View contact details'));

            expect(onCreateOrEditContactCallback).toHaveBeenCalledTimes(1);
        });

        it('should call add contact modal callback', async () => {
            render(<Participant {...props} isContact={false} />);

            userEvent.click(screen.getByTitle('More options'));

            await waitFor(() => {
                expect(screen.getByText('Create new contact')).toBeInTheDocument();
            });

            userEvent.click(screen.getByText('Create new contact'));

            expect(onCreateOrEditContactCallback).toHaveBeenCalledTimes(1);
        });
    });
});
