import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, Tooltip } from '@proton/components/components';
import useLoading from '@proton/hooks/useLoading';
import { DRIVE_APP_NAME, DRIVE_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { useSignupFlowModal } from '../../modals/SignupFlowModal/SignupFlowModal';

export interface Props {
    onClick: () => Promise<void>;
    alreadyBookmarked: boolean;
    className?: string;
    loading?: boolean;
    isLoggedIn: boolean;
}
export const SaveToDriveButton = ({ className, alreadyBookmarked, loading, onClick, isLoggedIn }: Props) => {
    const [isAdding, withAdding] = useLoading();
    const [signupFlowModal, showSignupFlowModal] = useSignupFlowModal();

    return (
        <>
            <Tooltip title={c('Tooltip').t`Add this shared file to your ${DRIVE_APP_NAME} for easy access later.`}>
                <Button
                    disabled={alreadyBookmarked || loading}
                    loading={isAdding}
                    className={clsx('flex items-center', className)}
                    onClick={() => {
                        if (!isLoggedIn) {
                            showSignupFlowModal({});
                        } else {
                            void withAdding(onClick);
                        }
                    }}
                    color="norm"
                >
                    <Icon className="mr-2" name={alreadyBookmarked ? 'lock-check' : 'folder-arrow-in'} />
                    {alreadyBookmarked
                        ? c('Info').t`Saved in ${DRIVE_SHORT_APP_NAME}`
                        : c('Action').t`Save to ${DRIVE_SHORT_APP_NAME}`}
                </Button>
            </Tooltip>
            {signupFlowModal}
        </>
    );
};
