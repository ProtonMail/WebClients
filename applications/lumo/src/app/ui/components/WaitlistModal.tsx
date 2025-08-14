import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalStateProps } from '@proton/components';
import { useApi, useErrorHandler } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { joinLumoWaitlist } from '@proton/shared/lib/api/lumo';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoWaitlistJoin from '@proton/styles/assets/img/lumo/lumo-waitlist-box.svg';

import { useLumoDispatch } from '../../redux/hooks';
import { joinWaitlistSuccess } from '../../redux/slices/meta/eligibilityStatus';
import { LumoPrompt } from './LumoPrompt/LumoPrompt';

interface Props {
    onClick?: () => void;
}

export const WaitlistModal = ({ onClick, ...modalProps }: Props & ModalStateProps) => {
    const api = useApi();
    const handleError = useErrorHandler();
    const [loading, withLoading] = useLoading();
    const dispatch = useLumoDispatch();

    const handleJoinWaitlist = async () => {
        try {
            await api(joinLumoWaitlist());
            dispatch(joinWaitlistSuccess());
        } catch (e) {
            handleError(e);
        }
    };
    return (
        <LumoPrompt
            {...modalProps}
            buttons={[
                <Button color="norm" loading={loading} onClick={() => withLoading(handleJoinWaitlist)}>{c(
                    'collider_2025: Button'
                ).t`Join waitlist`}</Button>,
            ]}
            image={{
                src: lumoWaitlistJoin,
            }}
            // translator: Secure your spot
            title={c('collider_2025: Title').t`Secure your spot`}
            // translator: We're gradually opening access to Lumo. Join the waitlist, and we’ll notify you when your spot becomes available.
            info={c('collider_2025: Waitlist Info')
                .t`We're gradually opening access to ${LUMO_SHORT_APP_NAME}. Join the waitlist, and we’ll notify you when your spot becomes available.`}
        />
    );
};
