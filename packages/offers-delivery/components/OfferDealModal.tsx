import { type MouseEvent, type ReactNode, useContext } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import ModalTwo, { ModalContext } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcCrossBig } from '@proton/icons/icons/IcCrossBig';
import clsx from '@proton/utils/clsx';

import type { MaybeNull } from '../interface';
import { getFeatureLines } from '../lib/features';
import type { OfferSurfaceProps } from './OfferSurface';

import './OfferDealModal.scss';

export interface OfferDealModalProps extends OfferSurfaceProps, Partial<ModalStateProps> {}

const OfferCtaButton = ({ text, onClick }: { text: string; onClick: (event: MouseEvent<HTMLElement>) => void }) => (
    <Button
        size="large"
        onClick={onClick}
        color="norm"
        className="text-bold"
        fullWidth
        data-testid="offer-deal-modal:cta"
    >
        {text}
    </Button>
);

const OfferDismissButton = ({ className, onClick }: { className: string; onClick: () => void }) => (
    <Button
        shape="underline"
        size="small"
        color="norm"
        className={clsx('text-sm', className)}
        onClick={onClick}
        data-testid="offer-deal-modal:dismiss"
    >
        {c('Action').t`Don't show this again`}
    </Button>
);

const OfferDealCloseButton = ({ onClose }: { onClose?: () => void }) => (
    <Tooltip title={c('Action').t`Close`}>
        <Button className="offer-deal-close-button shrink-0 absolute" icon shape="ghost" onClick={onClose}>
            <IcCrossBig className="offer-deal-close-icon" size={3} alt={c('Action').t`Close`} />
        </Button>
    </Tooltip>
);

/** Carries the id `ModalTwo` points the dialog's `aria-labelledby` at, as `ModalHeader` does. */
const OfferDealTitle = ({ className, children }: { className: string; children: ReactNode }) => {
    const { id } = useContext(ModalContext);

    return (
        <h1 id={id} className={className}>
            {children}
        </h1>
    );
};

const OfferDealHeader = ({ title, imageUrl }: { title: string; imageUrl: MaybeNull<string> }) => (
    <div className={clsx('offer-deal-header', !imageUrl && 'offer-deal-header--no-image')}>
        {imageUrl && (
            <>
                <img
                    src={imageUrl}
                    referrerPolicy="no-referrer"
                    alt=""
                    aria-hidden={true}
                    className="offer-deal-image"
                    width={496}
                    height={339}
                />
                <div className="offer-deal-header-overlay" />
            </>
        )}
        <div className="offer-deal-header-content">
            <OfferDealTitle className="offer-deal-title font-arizona">{title}</OfferDealTitle>
        </div>
    </div>
);

const OfferDealFullImage = ({ imageUrl }: { imageUrl: string }) => (
    <img
        src={imageUrl}
        referrerPolicy="no-referrer"
        alt=""
        className="offer-deal-full-image"
        data-testid="offer-deal-modal:image"
    />
);

/** Names the dialog when the campaign has no title. Until the in-app service sends alt text,
 * screen readers get this generic name instead of the text inside an image-only offer. */
const OfferDealScreenReaderTitle = () => (
    <OfferDealTitle className="sr-only">{c('Title').t`Special offer`}</OfferDealTitle>
);

const OfferDealHero = ({ title, imageUrl }: { title: string; imageUrl: MaybeNull<string> }) => {
    if (title) {
        return <OfferDealHeader title={title} imageUrl={imageUrl} />;
    }
    if (imageUrl) {
        return <OfferDealFullImage imageUrl={imageUrl} />;
    }
    return null;
};

const OfferDealFeatureList = ({ features }: { features: string[] }) => (
    <ul className="offer-deal-features my-4">
        {features.map((feature, index) => (
            <li key={`${index}:${feature}`} className="py-2 px-3 flex flex-nowrap flex-row items-start gap-1">
                <IcCheckmark className="shrink-0 mt-0.5" />
                <span className="flex-1">{feature}</span>
            </li>
        ))}
    </ul>
);

const OfferDealRenewalNotice = () => (
    <span className="text-sm text-weak text-center">
        {c('Info')
            .t`Discounts are based on standard monthly pricing. Your subscription will renew at the standard annual rate when the billing cycle ends.`}
    </span>
);

interface OfferDealLayoutProps {
    ctaText: string;
    onAction: (event: MouseEvent<HTMLElement>) => void;
    onDismiss: () => void;
}

const OfferDealPoster = ({ imageUrl, ctaText, onAction, onDismiss }: OfferDealLayoutProps & { imageUrl: string }) => (
    <div className="offer-deal-poster">
        <img
            src={imageUrl}
            referrerPolicy="no-referrer"
            alt=""
            className="offer-deal-poster-image"
            data-testid="offer-deal-modal:image"
        />
        <div className="offer-deal-poster-actions">
            <OfferCtaButton text={ctaText} onClick={onAction} />
            <OfferDismissButton className="offer-deal-poster-dismiss" onClick={onDismiss} />
        </div>
    </div>
);

const OfferDealDetails = ({
    title,
    imageUrl,
    features,
    ctaText,
    onAction,
    onDismiss,
}: OfferDealLayoutProps & { title: string; imageUrl: MaybeNull<string>; features: string[] }) => {
    const hasFeatures = features.length > 0;

    return (
        <>
            <OfferDealHero title={title} imageUrl={imageUrl} />
            <div className={clsx('offer-deal-content', !title && !imageUrl && 'offer-deal-content--no-header')}>
                <OfferCtaButton text={ctaText} onClick={onAction} />
                {hasFeatures && <OfferDealFeatureList features={features} />}
                <div className="flex flex-column items-center gap-2 mt-4">
                    {hasFeatures && <OfferDealRenewalNotice />}
                    <OfferDismissButton className="color-weak hover:color-weak" onClick={onDismiss} />
                </div>
            </div>
        </>
    );
};

export const OfferDealModal = ({ offer, open = true, onClose, onExit }: OfferDealModalProps) => {
    const { campaign, onAction, onDismiss } = offer;
    const { message, cta } = campaign;

    if (!cta) {
        return null;
    }

    const title = message.title.trim();
    const { imageUrl } = message;
    const features = getFeatureLines(message.body);

    const handleAction = (event: MouseEvent<HTMLElement>) => {
        onAction(event);
        onClose?.();
    };

    const handleDismiss = () => {
        onDismiss();
        onClose?.();
    };

    const layoutProps = { ctaText: cta.text, onAction: handleAction, onDismiss: handleDismiss };
    const isImageOnly = !title && features.length === 0 && imageUrl !== null;

    return (
        <ModalTwo
            className={clsx('offer-deal-modal', isImageOnly && 'offer-deal-modal--image-only')}
            size="large"
            open={open}
            onClose={onClose}
            onExit={onExit}
        >
            <ModalTwoContent>
                <OfferDealCloseButton onClose={onClose} />
                {!title && <OfferDealScreenReaderTitle />}
                {isImageOnly ? (
                    <OfferDealPoster imageUrl={imageUrl} {...layoutProps} />
                ) : (
                    <OfferDealDetails title={title} imageUrl={imageUrl} features={features} {...layoutProps} />
                )}
            </ModalTwoContent>
        </ModalTwo>
    );
};
