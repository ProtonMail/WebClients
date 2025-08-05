import type { ComponentProps } from 'react';
import { useRef } from 'react';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getModelState } from '@proton/account/test';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

import { mailTestRender } from 'proton-mail/helpers/test/render';

import AddressInput from './AddressInput';

type AddressInputWrapperProps = Omit<ComponentProps<typeof AddressInput>, 'anchorRef' | 'id'>;

const AddressInputWrapper = (props: AddressInputWrapperProps) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    return (
        <div ref={wrapperRef}>
            <AddressInput anchorRef={wrapperRef} dataTestId="sender" id="sender" {...props} />
        </div>
    );
};
const setup = async (props: AddressInputWrapperProps, options: Parameters<typeof mailTestRender>['1']) => {
    await mailTestRender(<AddressInputWrapper {...props} />, options);
};

describe('AddressInput', () => {
    it('should render and display dropdown on search', async () => {
        const user = userEvent.setup();

        const contact: ContactEmail[] = [
            {
                Email: 'toto@toto.fr',
                Name: 'toto',
                ID: 'too',
                ContactID: 'toto',
                Defaults: 1,
                LabelIDs: ['toto'],
                LastUsedTime: 0,
                Order: 0,
                Type: ['toto'],
            },
        ];

        await setup({ value: '', onChange: jest.fn() }, { preloadedState: { contactEmails: getModelState(contact) } });

        const input = screen.getByTestId('sender');

        await user.type(input, 'toto');

        expect(screen.getByTestId('dropdown-button')).toBeInTheDocument();
        expect(screen.getByTestId('dropdown-button')).toHaveTextContent('toto@toto.fr');
    });
});
