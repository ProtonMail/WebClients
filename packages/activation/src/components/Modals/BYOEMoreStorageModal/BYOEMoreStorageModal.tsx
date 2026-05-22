import type { ReactNode } from 'react';

import { differenceInDays, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks.ts';
import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import UpsellModalUpgradeButton from '@proton/components/components/upsell/UpsellModal/components/UpsellModalUpgradeButton.tsx';
import useUpsellModalConfig from '@proton/components/components/upsell/UpsellModal/hooks/useUpsellModalConfig.ts';
import { useHasInboxDesktopInAppPayments } from '@proton/components/containers/desktop/useHasInboxDesktopInAppPayments.ts';
import useConfig from '@proton/components/hooks/useConfig.ts';
import { Loader } from '@proton/components/index.ts';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper.ts';
import { APPS, MAIL_APP_NAME, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import humanSize from '@proton/shared/lib/helpers/humanSize.ts';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell.ts';
import type { UserModel } from '@proton/shared/lib/interfaces';
import { getAppSpace, getSpace } from '@proton/shared/lib/user/storage.ts';
import clsx from '@proton/utils/clsx.ts';

const BYTES_450MB = 450 * 1024 * 1024;
const BYTES_500MB = 500 * 1024 * 1024;
const BYTES_950MB = 950 * 1024 * 1024;
const BYTES_1GB = 1024 * 1024 * 1024;

const getFreeSpaceText = (freeSpace: number): string | null => {
    if (freeSpace >= BYTES_450MB && freeSpace <= BYTES_500MB) {
        return '500 MB';
    }
    if (freeSpace >= BYTES_950MB && freeSpace <= BYTES_1GB) {
        return '1 GB';
    }
    return null;
};

// When the user is new AND has between 450MB-500MB or 950MB-1GB of free storage, we want to show a special description
// Else show the actual storage.
const getFreeStorageTexts = (user: UserModel, appSpace: { maxSpace: number; usedSpace: number }) => {
    let description: ReactNode;
    let infoText: string;

    const isNewUser = differenceInDays(new Date(), fromUnixTime(user.CreateTime)) <= 10;
    const newUserStorageText = isNewUser ? getFreeSpaceText(appSpace.maxSpace - appSpace.usedSpace) : null;

    if (newUserStorageText !== null) {
        description = (
            <div className="color-weak text-lg text-wrap-balance">{c('Description')
                .t`Your free ${MAIL_APP_NAME} account comes with limited storage so we'll only import ${newUserStorageText} of your most recent Gmail messages`}</div>
        );

        infoText = c('Info').t`Upgrade anytime to bring over the rest`;
    } else {
        const humanFreeSpace = humanSize({ bytes: appSpace.maxSpace - appSpace.usedSpace });

        const storageText = <b key="available_storage">{humanFreeSpace}</b>;
        description = (
            <>
                <div className="color-weak text-lg text-wrap-balance">{c('Description')
                    .t`Your free ${MAIL_APP_NAME} account comes with limited storage so we'll only import your most recent Gmail emails.`}</div>
                <div className="color-weak text-lg text-wrap-balance">{c('Description')
                    .jt`Available storage: ${storageText}`}</div>
            </>
        );

        infoText = c('Info').t`Upgrade or clear space anytime to bring over the rest`;
    }

    return { description, infoText };
};

interface Props extends ModalProps {
    onComplete?: () => void;
}

export const BYOEMoreStorageModal = ({ onClose, onComplete, ...rest }: Props) => {
    const [user] = useUser();
    const { APP_NAME } = useConfig();
    const appSpace = getAppSpace(getSpace(user), APPS.PROTONMAIL);

    const upsellRef =
        getUpsellRefFromApp({
            app: APP_NAME,
            feature: SHARED_UPSELL_PATHS.EASY_SWITCH_BYOE_MORE_STORAGE,
            component: UPSELL_COMPONENT.MODAL,
            fromApp: getAppFromPathnameSafe(window.location.pathname),
        }) || '';

    const handleClose = () => {
        onClose?.();
        void onComplete?.();
    };

    const hasDesktopInAppPayments = useHasInboxDesktopInAppPayments();
    const config = useUpsellModalConfig({ upsellRef, onSubscribed: handleClose });

    const handleUpgrade = () => {
        if (isElectronApp && !hasDesktopInAppPayments) {
            // Desktop case: payment opens in browser, we can't detect completion, so show success modal immediately
            void onComplete?.();
        }
        config?.onUpgrade?.();
        onClose?.();
    };

    const { description, infoText } = getFreeStorageTexts(user, appSpace);

    return (
        <ModalTwo
            size="large"
            fullscreenOnMobile
            {...rest}
            onClose={handleClose}
            className="modal-two-addbyoe"
            data-testid="EasySwitch:BYOEMoreStorageModal"
        >
            <ModalTwoHeader />
            <div className="m-8 mt-0 flex flex-column *:min-size-auto md:flex-row items-center flex-nowrap gap-7">
                <div className="flex flex-column h-full flex-nowrap w-full lg:w-auto flex-1 gap-4">
                    <h1 className="text-break text-4xl text-wrap-balance">
                        <strong>{c('Title').t`Continue with free storage`}</strong>
                    </h1>
                    {description}
                    <div className="mt-auto">
                        <div className="flex flex-column items-center gap-4">
                            <Button onClick={handleClose} fullWidth shape="outline">{c('Action')
                                .t`Continue with Free`}</Button>
                        </div>
                        <div className="text-sm color-weak text-center mt-2">{infoText}</div>
                    </div>
                </div>
                <div className="lg:block modal-two-addbyoe-aside px-8 md:px-10 relative">
                    <h1 className="text-break text-4xl text-wrap-balance pt-4 md:pt-0 mb-4">
                        <strong>{c('Title').t`Get more storage with ${MAIL_APP_NAME} Plus`}</strong>
                    </h1>
                    {config?.offerPrice && (
                        <div className="color-weak text-lg text-wrap-balance">{c('Description')
                            .jt`Unlock 15 GB of storage for just ${config.offerPrice}.`}</div>
                    )}
                    <div className="color-weak text-lg text-wrap-balance">{c('Description')
                        .t`Enough room for years of emails, attachments and more.`}</div>

                    <ul className="unstyled my-4 overflow-hidden">
                        {[
                            { label: c('Feature').t`Storage`, value: '15 GB' },
                            { label: c('Feature').t`Email addresses`, value: '10' },
                            { label: c('Feature').t`Custom email domain`, value: null },
                            { label: c('Feature').t`10+ premium features`, value: null },
                        ].map(({ label, value }, i, arr) => (
                            <li
                                key={label}
                                className={clsx(
                                    'flex items-center justify-space-between px-4 py-3 z-1 relative',
                                    i < arr.length - 1 && 'border-bottom'
                                )}
                            >
                                <span>{label}</span>
                                {value !== null ? (
                                    <strong>{value}</strong>
                                ) : (
                                    <span className="flex items-center justify-center ratio-square shadow-norm rounded-50 p-1 bg-norm">
                                        <IcCheckmark alt={c('Info').t`Included`} />
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>

                    <div className="mt-auto">
                        <div className="flex flex-column items-center gap-4">
                            {config ? (
                                <UpsellModalUpgradeButton
                                    closeModal={handleClose}
                                    onClick={handleUpgrade}
                                    path={config.upgradePath}
                                    submitText={config.submitText}
                                />
                            ) : (
                                <Loader size="medium" className="color-primary" />
                            )}
                        </div>
                        {config?.footerText && (
                            <p className="text-sm color-weak text-center mt-2 mb-0">{config.footerText}</p>
                        )}
                    </div>
                </div>
            </div>
        </ModalTwo>
    );
};
