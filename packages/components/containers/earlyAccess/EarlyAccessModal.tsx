import React from 'react';
import { c } from 'ttag';

import { Button, Checkbox, FormModal } from '../../components';
import useEarlyAccess from '../../hooks/useEarlyAccess';
import useSynchronizingState from '../../hooks/useSynchronizingState';

const EarlyAccessModal = (props: { onClose?: () => void }) => {
    const earlyAccess = useEarlyAccess();

    const [earlyAccessEnabled, setEarlyAccessEnabled] = useSynchronizingState(earlyAccess.value);

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setEarlyAccessEnabled(e.target.checked);
    };

    const update = async () => {
        await earlyAccess.update(earlyAccessEnabled);
        window.location.reload();
    };

    const loading = earlyAccess.loading || !earlyAccess.canUpdate;

    return (
        <FormModal
            {...props}
            intermediate
            close={c('Action').t`Cancel`}
            submit={
                <Button
                    type="submit"
                    color="norm"
                    loading={loading}
                    disabled={earlyAccessEnabled === earlyAccess.value}
                >
                    {c('Action').t`Apply`}
                </Button>
            }
            loading={loading}
            onSubmit={update}
        >
            <div className="h2">{c('Title').t`Early access`}</div>
            <p>
                {c('Early access description')
                    .t`Early access gives you access to the beta version of Proton which has new features and improvements. Our beta versions undergo the same reliability testing as our public versions, but if you encounter any issues, you can switch off early access.`}
            </p>
            <div className="mb0-5 flex flex-align-items-center">
                <label className="flex flex-nowrap" htmlFor="enable-early-access-checkbox">
                    <Checkbox
                        id="enable-early-access-checkbox"
                        checked={earlyAccessEnabled}
                        onChange={handleChange}
                        className="mr0-5"
                    />
                    {c('Label').t`Enable early access`}
                </label>
            </div>
            <p className="mb0-5 color-weak">
                {c('Refresh on apply warning')
                    .t`Note: upon clicking the "Apply" button, the application will be reloaded`}
            </p>
        </FormModal>
    );
};

export default EarlyAccessModal;
