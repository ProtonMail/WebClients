import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Alert, Prompt } from '@proton/components';
import { selectPassPlan } from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';

type Props = {
    open: boolean;
    promptText: string;
    onClose: () => void;
};

export const AccessLimitPrompt: FC<Props> = ({ open, promptText, onClose }) => {
    const plan = useSelector(selectPassPlan);
    const b2b = plan === UserPassPlan.BUSINESS;

    return (
        <Prompt
            buttons={
                <Button pill onClick={onClose} className="w-full" shape="solid" color="weak">
                    {c('Action').t`OK`}
                </Button>
            }
            className="text-left"
            onClose={onClose}
            open={open}
            title={c('Title').t`Member limit`}
            enableCloseWhenClickOutside
        >
            <Alert className="mb-4 text-sm" type="error">
                {b2b ? (
                    <>
                        {c('Error').t`Cannot send invitations at the moment`}{' '}
                        {c('Warning').t`Please contact us to investigate the issue`}
                    </>
                ) : (
                    promptText
                )}
            </Alert>
        </Prompt>
    );
};
