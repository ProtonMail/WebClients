import type { FC, PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

import { getApi } from 'proton-authenticator/lib/api';
import type { AppModal } from 'proton-authenticator/store';
import { setupStore } from 'proton-authenticator/store';
import { init } from 'proton-authenticator/store/app';
import { c } from 'ttag';

import { Banner, BannerVariants, Button } from '@proton/atoms';
import { Prompt, useNotifications } from '@proton/components';
import useEffectOnce from '@proton/hooks/useEffectOnce';
import useInstance from '@proton/hooks/useInstance';
import { useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import { useStatefulRef } from '@proton/pass/hooks/useStatefulRef';
import clsx from '@proton/utils/clsx';

export const StoreProvider: FC<PropsWithChildren> = ({ children }) => {
    const { createNotification } = useNotifications();
    const appModal = useAsyncModalHandles<boolean, AppModal>({ getInitialModalState: () => ({}) });
    const appModalRef = useStatefulRef(appModal);

    const store = useInstance(() =>
        setupStore({
            get api() {
                /** API may be re-initialized during
                 * a user session (logout -> login) */
                return getApi();
            },
            createNotification,
            createModal: (modal) =>
                new Promise<boolean>((res) =>
                    appModalRef.current.handler({
                        ...modal,
                        onSubmit: (result) => res(result),
                        onAbort: () => res(false),
                        onError: () => res(false),
                    })
                ),
        })
    );

    useEffectOnce(() => {
        void store.dispatch(init());
    });

    return (
        <Provider store={store}>
            {children}

            {appModal.state.open && (
                <Prompt
                    open
                    title={
                        appModal.state.title && (
                            <span className="text-break text-ellipsis-four-lines">{appModal.state.title}</span>
                        )
                    }
                    buttons={[
                        <Button onClick={() => appModal.resolver(true)} pill>
                            {appModal.state.submitText ?? c('Action').t`Confirm`}
                        </Button>,
                        <Button
                            onClick={() => appModal.abort()}
                            color="danger"
                            pill
                            className={clsx(!appModal.state.cancelable && 'hidden')}
                        >
                            {appModal.state.cancelText ?? c('Action').t`Cancel`}
                        </Button>,
                    ]}
                >
                    <span> {appModal.state.message}</span>
                    {appModal.state.warning && (
                        <Banner variant={BannerVariants.DANGER} noIcon className="mt-4">
                            <div className="text-sm">{appModal.state.warning}</div>
                        </Banner>
                    )}
                </Prompt>
            )}
        </Provider>
    );
};
