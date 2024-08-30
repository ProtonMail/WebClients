import { MemoryRouter } from 'react-router-dom';

import { render } from '@testing-library/react';

import { CLIENT_TYPES, SSO_PATHS } from '@proton/shared/lib/constants';
import { applyHOCs, withConfig } from '@proton/testing';

import type { AccountStepProps } from './AccountStep';
import AccountStep from './AccountStep';
import { SignupType } from './interfaces';

const AccountStepWrapper = (props: AccountStepProps) => {
    const AccountStepContext = applyHOCs(withConfig())(AccountStep);

    return (
        <MemoryRouter>
            <AccountStepContext {...props} />
        </MemoryRouter>
    );
};

let props: AccountStepProps;

beforeEach(() => {
    jest.clearAllMocks();

    props = {
        clientType: CLIENT_TYPES.VPN,
        toApp: 'proton-vpn-settings',
        signupTypes: [SignupType.Email, SignupType.Username],
        signupType: SignupType.Email,
        onChangeSignupType: jest.fn(),
        domains: [],
        hasChallenge: false,
        title: 'title123',
        subTitle: 'subTitle123',
        onSubmit: jest.fn(),
        loginUrl: SSO_PATHS.MAIL_SIGN_IN,
    };
});

it('should render', () => {
    const { container } = render(<AccountStepWrapper {...props} />);
    expect(container).not.toBeEmptyDOMElement();
});

it('should display "Already have an account" by default', () => {
    const { getByText } = render(<AccountStepWrapper {...props} />);
    expect(getByText('Already have an account?')).toBeInTheDocument();
});
