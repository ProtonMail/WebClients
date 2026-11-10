import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import BugModal from '@proton/components/containers/support/BugModal';
import { BRAND_NAME, SSO_PATHS } from '@proton/shared/lib/constants';

import expired from '../assets/expired-link.svg';

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
    type:
        | 'report'
        | 'email'
        | 'unsubscribe'
        | 'forwarding'
        | 'group'
        | 'magic-link'
        | 'magic-link-used'
        | 'magic-link-identity'
        | 'magic-link-invalid'
        | 'joining-link'
        | 'provisioning';
    /** The admin to contact, for the magic link types that need them. */
    adminEmail?: string;
}

const getTexts = (type: Props['type'], adminEmail = '') => {
    const admin = (
        <strong key="admin" className="text-break">
            {adminEmail}
        </strong>
    );
    if (type === 'report') {
        return {
            title: c('Info').t`Report link expired`,
            description: c('Info')
                .t`The link to report that you didn't set up a ${BRAND_NAME} Account has expired. Please get in touch with our support team to resolve this issue.`,
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
    if (type === 'forwarding') {
        return {
            title: c('Info').t`Link expired`,
            description: c('Info').t`We just sent you a new link.`,
        };
    }
    if (type === 'group') {
        return {
            title: c('Info').t`Link expired`,
            description: c('Info').t`This invitation link has expired. We just sent you a new link.`,
        };
    }
    if (type === 'magic-link') {
        return {
            title: c('Info').t`Invitation link expired`,
            description: c('Info')
                .t`This invitation link has expired. Please contact your administrator to request access.`,
        };
    }
    if (type === 'magic-link-used') {
        return {
            title: c('Info').t`Invitation link used`,
            description: c('Info').t`This invitation link is already used. Please sign in directly instead.`,
        };
    }
    if (type === 'magic-link-identity') {
        return {
            title: c('Info').t`Invalid invitation link`,
            description: c('Info')
                .jt`We couldn't verify your organization's identity. Please ask your administrator, ${admin}, to check the organization identity in the organization settings. Then open this link again.`,
        };
    }
    if (type === 'magic-link-invalid') {
        return {
            title: c('Info').t`Invalid invitation link`,
            description: c('Info')
                .jt`We couldn't verify this invitation. Please ask your administrator, ${admin}, to remove you from the organization and add you again.`,
        };
    }
    if (type === 'joining-link') {
        return {
            title: c('Info').t`Invalid joining link`,
            description: c('Info').t`This joining link isn't valid. Please contact your administrator for a new one.`,
        };
    }
    if (type === 'provisioning') {
        return {
            title: c('Info').t`Signup link no longer valid`,
            description: c('Info')
                .t`This signup link has expired, been revoked or already been used. Please contact your ${BRAND_NAME} representative for a new one.`,
        };
    }
    return {
        title: c('Info').t`Unsubscribe link expired`,
        description: c('Info')
            .t`This unsubscribe link has expired. Please open a more recent email from this mailing list.`,
    };
};

const ExpiredError = ({ type, adminEmail }: Props) => {
    const { title, description, cta } = getTexts(type, adminEmail);
    return (
        <div className="m-auto text-center max-w-custom" style={{ '--max-w-custom': '20em' }}>
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
