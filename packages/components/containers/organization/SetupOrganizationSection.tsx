import { c } from 'ttag';

import { setupUser } from '@proton/account/addresses/actions';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import Loader from '@proton/components/components/loader/Loader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import AuthModal, { type AuthModalResult } from '@proton/components/containers/password/AuthModal';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useLoading from '@proton/hooks/useLoading';
import { getHasMemberCapablePlan, hasDuo, hasPassFamily } from '@proton/payments';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { unlockPasswordChanges } from '@proton/shared/lib/api/user';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { DRIVE_APP_NAME, MAIL_APP_NAME, ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Organization } from '@proton/shared/lib/interfaces';

import OrganizationSectionUpsell from './OrganizationSectionUpsell';
import SetupOrganizationModal from './SetupOrganizationModal';

interface Props {
    app: APP_NAMES;
    organization?: Organization;
    onSetup: (setup: boolean) => void;
}

export const SetupOrganizationSection = ({ app, organization, onSetup }: Props) => {
    const [user] = useUser();
    const dispatch = useDispatch();
    const [subscription] = useSubscription();
    const [loading, withLoading] = useLoading();
    const [setupOrganizationModalProps, setSetupOrganizationModal, renderSetupOrganizationModal] = useModalState();
    const errorHandler = useErrorHandler();

    const [authModal, showAuthModal] = useModalTwoPromise<undefined, AuthModalResult>();

    const isOrgActive = organization?.State === ORGANIZATION_STATE.ACTIVE;

    if (!organization || !user || !subscription) {
        return <Loader />;
    }

    const hasMemberCapablePlan = getHasMemberCapablePlan(organization, subscription);

    if (!hasMemberCapablePlan || !isOrgActive) {
        return <OrganizationSectionUpsell app={app} />;
    }

    const handleSetup = () => {
        const run = async () => {
            const authResult = await showAuthModal();

            // VPN username only users might arrive here through the VPN business plan in protonvpn.com
            if (user.isPrivate && !user.Keys.length && authResult.type === 'srp') {
                await dispatch(setupUser({ password: authResult.credentials.password, app }));
            }

            onSetup(true);
            setSetupOrganizationModal(true);
        };

        withLoading(run()).catch(errorHandler);
    };

    const { buttonCTA, learnMoreLink, description } = (() => {
        if (organization.RequiresKey) {
            return {
                buttonCTA: c('Action').t`Enable multi-user support`,
                learnMoreLink: getKnowledgeBaseUrl('/proton-for-business'),
                description: c('Info')
                    .t`Create and manage sub-accounts and assign them email addresses on your custom domain.`,
            };
        }

        const familyButtonCta = c('familyOffer_2023:Action').t`Set up family group`;

        if (hasPassFamily(subscription)) {
            return {
                learnMoreLink: getKnowledgeBaseUrl('/get-started-proton-pass-family'),
                description: c('familyOffer_2023:Info').t`Create and manage family members.`,
                buttonCTA: familyButtonCta,
            };
        }

        return {
            learnMoreLink: getKnowledgeBaseUrl(
                hasDuo(subscription) ? '/get-started-proton-duo' : '/get-started-proton-family'
            ),
            description: c('familyOffer_2023:Info')
                .t`Create and manage family members and assign them storage space shared between ${DRIVE_APP_NAME} and ${MAIL_APP_NAME}.`,
            buttonCTA: familyButtonCta,
        };
    })();

    return (
        <>
            {authModal(({ onResolve, onReject, ...props }) => {
                return (
                    <AuthModal
                        {...props}
                        scope="password"
                        config={unlockPasswordChanges()}
                        onCancel={onReject}
                        onSuccess={onResolve}
                    />
                );
            })}
            {renderSetupOrganizationModal && (
                <SetupOrganizationModal
                    {...setupOrganizationModalProps}
                    onExit={() => {
                        setupOrganizationModalProps.onExit();
                        onSetup(false);
                    }}
                />
            )}
            <SettingsParagraph learnMoreUrl={learnMoreLink}>{description}</SettingsParagraph>
            <Button color="norm" loading={loading} onClick={handleSetup}>
                {buttonCTA}
            </Button>
        </>
    );
};
