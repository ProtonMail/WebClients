import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, Tooltip } from '@proton/components/components';
import useLoading from '@proton/hooks/useLoading';
import { DRIVE_APP_NAME, DRIVE_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { DRIVE_SIGNUP } from '@proton/shared/lib/drive/urls';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

import { saveUrlPasswordForRedirection } from '../../../utils/url/password';

export interface Props {
    onClick: () => Promise<void>;
    alreadyBookmarked: boolean;
    urlPassword: string;
    className?: string;
    loading?: boolean;
    isLoggedIn: boolean;
}
export const SaveToDriveButton = ({
    className,
    alreadyBookmarked,
    loading,
    onClick,
    urlPassword,
    isLoggedIn,
}: Props) => {
    const [isAdding, withAdding] = useLoading();

    return (
        <Tooltip title={c('Tooltip').t`Add this shared file to your ${DRIVE_APP_NAME} for easy access later.`}>
            <Button
                disabled={alreadyBookmarked || loading}
                loading={isAdding}
                className={clsx('flex items-center', className)}
                onClick={() => {
                    if (!isLoggedIn) {
                        saveUrlPasswordForRedirection(urlPassword);
                        replaceUrl(DRIVE_SIGNUP);
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
    );
};
