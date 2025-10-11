import type { FC } from 'react';

import syncImgDark from 'proton-authenticator/assets/proton-sync-dark.png';
import syncImgLight from 'proton-authenticator/assets/proton-sync-light.png';
import { requestFork } from 'proton-authenticator/store/auth';
import { useAppDispatch } from 'proton-authenticator/store/utils';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { ForkType } from '@proton/shared/lib/authentication/fork/constants';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

type Props = {
    onClose: () => void;
};

export const ProtonSyncModal: FC<Props> = ({ onClose }) => {
    const dispatch = useAppDispatch();

    const onLogin = () => dispatch(requestFork(ForkType.LOGIN));
    const onRegister = () => dispatch(requestFork(ForkType.SIGNUP));

    const withClose = (action: () => void) => () => {
        action();
        onClose();
    };

    return (
        <ModalTwo open onClose={onClose}>
            <ModalTwoHeader />
            <ModalTwoContent>
                <div className={clsx('flex justify-center items-center w-full m-auto pt-14 pb-14 min-h-full')}>
                    <div className="flex flex-column gap-3 text-center h-full">
                        <>
                            <picture className="mb-4">
                                <source media="(prefers-color-scheme: dark)" srcSet={syncImgDark} />
                                <img src={syncImgLight} alt="" />
                            </picture>

                            <div className="flex flex-column gap-1 mb-4">
                                <h3 className="text-bold">{c('Title').t`Device sync`}</h3>
                                <span className="color-weak inline-block mb-2">
                                    {c('Info')
                                        .t`A ${BRAND_NAME} account is required to enable end-to-end encrypted sync between devices.`}
                                </span>
                            </div>

                            <Button
                                pill
                                shape="solid"
                                color="norm"
                                onClick={withClose(onRegister)}
                                className="cta-button"
                            >
                                {c('authenticator-2025:Action').t`Create a free account`}
                            </Button>
                            <Button pill shape="outline" color="weak" onClick={withClose(onLogin)}>
                                {c('authenticator-2025:Action').t`Sign in`}
                            </Button>
                        </>
                    </div>
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};
