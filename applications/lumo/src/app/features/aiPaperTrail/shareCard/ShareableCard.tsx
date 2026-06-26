import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';
import { IcArrowUpFromSquare } from '@proton/icons/icons/IcArrowUpFromSquare';
import { IcBrandFacebook } from '@proton/icons/icons/IcBrandFacebook';
import { IcBrandLinkedin } from '@proton/icons/icons/IcBrandLinkedin';
import { IcBrandReddit } from '@proton/icons/icons/IcBrandReddit';
import { IcBrandTwitter } from '@proton/icons/icons/IcBrandTwitter';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcLink } from '@proton/icons/icons/IcLink';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import type { PaperTrailCardData } from '../reportTypes';
import { CARD_HEIGHT, CARD_WIDTH, type ShareCardTheme, renderShareCard } from './drawShareCard';
import { SHARE_TEXT, SHARE_URL, type SocialPlatform, buildShareIntentUrl } from './socialShare';

import './ShareableCard.scss';

interface Props extends ModalStateProps {
    data: PaperTrailCardData;
}

const FILENAME = 'my-ai-paper-trail.png';

const fileNameForTheme = (theme: ShareCardTheme): string => `my-ai-paper-trail-${theme}.png`;

const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> =>
    new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));

export const ShareableCard = ({ data, ...modalProps }: Props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [canShareFiles, setCanShareFiles] = useState(false);
    const [theme, setTheme] = useState<ShareCardTheme>('dark');
    const [linkCopied, setLinkCopied] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            void renderShareCard(canvas, data, theme);
        }
    }, [data, theme]);

    useEffect(() => {
        try {
            const probe = new File([''], FILENAME, { type: 'image/png' });
            setCanShareFiles(typeof navigator.canShare === 'function' && navigator.canShare({ files: [probe] }));
        } catch {
            setCanShareFiles(false);
        }
    }, []);

    const handleDownload = async () => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const blob = await canvasToBlob(canvas);
        if (!blob) {
            return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileNameForTheme(theme);
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleShare = async () => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const blob = await canvasToBlob(canvas);
        if (!blob) {
            return;
        }
        const file = new File([blob], fileNameForTheme(theme), { type: 'image/png' });
        try {
            await navigator.share({
                files: [file],
                title: c('collider_2025:Title').t`My AI paper trail`,
                text: c('collider_2025:Info')
                    .t`See what Big Tech AI knows about you. Made with ${LUMO_SHORT_APP_NAME}.`,
            });
        } catch {
            // User dismissed the share sheet, or sharing failed; fall back to a download.
            void handleDownload();
        }
    };

    // Web share intents can't carry the image, so save the card first for the user to attach,
    // then open the platform's compose window.
    const handleSocialShare = (platform: SocialPlatform) => {
        const intentUrl = buildShareIntentUrl(platform, { url: SHARE_URL, text: SHARE_TEXT });
        window.open(intentUrl, '_blank', 'noopener,noreferrer');
        void handleDownload();
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(`${SHARE_TEXT} ${SHARE_URL}`);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        } catch {
            // Clipboard unavailable; nothing else to do.
        }
    };

    const socials: { platform: SocialPlatform; label: string; icon: typeof IcBrandTwitter; className: string }[] = [
        { platform: 'x', label: 'X', icon: IcBrandTwitter, className: 'paper-trail-social__btn--x' },
        { platform: 'facebook', label: 'Facebook', icon: IcBrandFacebook, className: 'paper-trail-social__btn--fb' },
        { platform: 'reddit', label: 'Reddit', icon: IcBrandReddit, className: 'paper-trail-social__btn--reddit' },
        {
            platform: 'linkedin',
            label: 'LinkedIn',
            icon: IcBrandLinkedin,
            className: 'paper-trail-social__btn--linkedin',
        },
    ];

    return (
        <ModalTwo {...modalProps} size="large">
            <ModalTwoHeader title={c('collider_2025:Title').t`Your shareable card`} />
            <ModalTwoContent>
                <p className="color-weak mt-0">
                    {c('collider_2025:Info')
                        .t`No personal details are on this card — just your exposure score by area. Lower means you gave away less.`}
                </p>
                {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
                <div
                    className="paper-trail-card-themes"
                    role="group"
                    aria-label={c('collider_2025:Label').t`Card theme`}
                >
                    <Button
                        size="small"
                        pill
                        shape={theme === 'dark' ? 'solid' : 'ghost'}
                        color={theme === 'dark' ? 'norm' : 'weak'}
                        aria-pressed={theme === 'dark'}
                        onClick={() => setTheme('dark')}
                    >
                        {c('collider_2025:Action').t`Dark`}
                    </Button>
                    <Button
                        size="small"
                        pill
                        shape={theme === 'light' ? 'solid' : 'ghost'}
                        color={theme === 'light' ? 'norm' : 'weak'}
                        aria-pressed={theme === 'light'}
                        onClick={() => setTheme('light')}
                    >
                        {c('collider_2025:Action').t`Light`}
                    </Button>
                </div>
                <div className="paper-trail-card-preview">
                    <canvas
                        ref={canvasRef}
                        width={CARD_WIDTH}
                        height={CARD_HEIGHT}
                        className="paper-trail-card-preview__canvas"
                    />
                </div>
                <div className="paper-trail-social">
                    <span className="paper-trail-social__label">{c('collider_2025:Label').t`Share to`}</span>
                    <div className="paper-trail-social__row">
                        {socials.map(({ platform, label, icon: Icon, className }) => (
                            <Tooltip key={platform} title={label}>
                                <button
                                    type="button"
                                    className={`paper-trail-social__btn ${className}`}
                                    aria-label={label}
                                    onClick={() => handleSocialShare(platform)}
                                >
                                    <Icon size={5} />
                                </button>
                            </Tooltip>
                        ))}
                        <Tooltip title={c('collider_2025:Action').t`Copy link & caption`}>
                            <button
                                type="button"
                                className="paper-trail-social__btn paper-trail-social__btn--link"
                                aria-label={c('collider_2025:Action').t`Copy link & caption`}
                                onClick={handleCopyLink}
                            >
                                {linkCopied ? <IcCheckmark size={5} /> : <IcLink size={5} />}
                            </button>
                        </Tooltip>
                    </div>
                    <p className="paper-trail-social__hint">
                        {c('collider_2025:Info')
                            .t`We'll save your card so you can attach it to the post — social sites can't add the image for you.`}
                    </p>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={handleDownload}>
                    <IcArrowDownLine className="mr-2" />
                    {c('collider_2025:Action').t`Download`}
                </Button>
                {canShareFiles && (
                    <Button color="norm" onClick={handleShare}>
                        <IcArrowUpFromSquare className="mr-2" />
                        {c('collider_2025:Action').t`Share`}
                    </Button>
                )}
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ShareableCard;
