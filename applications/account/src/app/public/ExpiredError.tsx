import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';

import expired from './expired-link.svg';

interface Props {
    type: 'email' | 'unsubscribe';
}

const getTexts = (type: 'email' | 'unsubscribe') => {
    if (type === 'email') {
        return {
            title: c('Info').t`Verification link expired`,
            description: c('Info')
                .t`The email verification link has expired. Please sign in to resend a verification link.`,
            cta: c('Error message, recovery').t`Sign in to verify`,
        };
    }
    return {
        title: c('Info').t`Unsubscribe link expired`,
        description: c('Info')
            .t`This unsubscribe link has expired. Please open a more recent email from this mailing list.`,
    };
};

const ExpiredError = ({ type }: Props) => {
    const { title, description, cta } = getTexts(type);
    return (
        <div className="m-auto text-center max-w20e">
            <div className="mb-8">
                <img src={expired} alt={c('Error').t`Expired`} />
            </div>
            <h1 className="text-bold h2 mb-2">{title}</h1>
            <div className="mb-10">{description}</div>
            {cta && (
                <div>
                    <ButtonLike as="a" href="/switch" target="_self">
                        {cta}
                    </ButtonLike>
                </div>
            )}
        </div>
    );
};

export default ExpiredError;
