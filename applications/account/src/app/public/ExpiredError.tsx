import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms/Button';
import { useModalState } from '@proton/components/components';
import { BugModal } from '@proton/components/containers';
import { BRAND_NAME, SSO_PATHS } from '@proton/shared/lib/constants';

import expired from './expired-link.svg';

const ReportLink = () => {
    const [modalProps, setRenderModal, renderModal] = useModalState();

    return (
        <>
            {renderModal && <BugModal {...modalProps} />}
            <Button onClick={() => setRenderModal(true)}>
                {c('Error message, recovery').t`Contact ${BRAND_NAME}`}
            </Button>
        </>
    );
};

interface Props {
    type: 'report' | 'email' | 'unsubscribe';
}

const getTexts = (type: Props['type']) => {
    if (type === 'report') {
        return {
            title: c('Info').t`Report link expired`,
            description: c('Info')
                .t`The link to report that that you didn't set up a ${BRAND_NAME} Account has expired. Please get in touch with our support team to resolve this issue.`,
            cta: <ReportLink />,
        };
    }
    if (type === 'email') {
        return {
            title: c('Info').t`Verification link expired`,
            description: c('Info')
                .t`The email verification link has expired. Please sign in to resend a verification link.`,
            cta: (
                <ButtonLike as="a" href={SSO_PATHS.SWITCH} target="_self">
                    {c('Error message, recovery').t`Sign in to verify`}
                </ButtonLike>
            ),
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
            {cta && <div>{cta}</div>}
        </div>
    );
};

export default ExpiredError;
