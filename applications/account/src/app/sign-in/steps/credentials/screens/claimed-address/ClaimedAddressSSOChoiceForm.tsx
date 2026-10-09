import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import Text from '../../../../../public/Text';

interface Props {
    loading?: boolean;
    onContinueWithSSO: () => void;
    onRecover: () => void;
}

/**
 * The address resolves to an organization's identity provider, but it also used to belong to a
 * personal account that the organization claimed. Both are legitimate destinations, so rather than
 * redirecting straight to the IdP we let the user say which one they came for.
 */
const ClaimedAddressSSOChoiceForm = ({ loading, onContinueWithSSO, onRecover }: Props) => {
    return (
        <div data-testid="claimed-address:sso-choice">
            <Text margin="small">
                {c('Info').t`This address now signs in through your organization's identity provider.`}
            </Text>
            <Text>
                {c('Info')
                    .t`If you previously had a personal ${BRAND_NAME} account with this address, you can recover your data separately.`}
            </Text>
            <Button
                size="large"
                color="norm"
                fullWidth
                loading={loading}
                onClick={onContinueWithSSO}
                data-testid="claimed-address:continue-sso"
            >
                {c('Action').t`Continue with single sign-on`}
            </Button>
            <Button
                size="large"
                color="norm"
                shape="outline"
                fullWidth
                className="mt-2"
                disabled={loading}
                onClick={onRecover}
                data-testid="claimed-address:recover"
            >
                {c('Action').t`Recover previous account`}
            </Button>
        </div>
    );
};

export default ClaimedAddressSSOChoiceForm;
