import { type FC, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { type IconName, ModalTwoContent, ModalTwoFooter } from '@proton/components';
import { useNotifications } from '@proton/components/hooks';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { CardContent } from '@proton/pass/components/Layout/Card/CardContent';
import { getOccurrenceString } from '@proton/pass/lib/i18n/helpers';
import type { SecureLink } from '@proton/pass/types';
import { timeRemaining } from '@proton/pass/utils/time/format';
import clsx from '@proton/utils/clsx';

type SecureLinkCard = { title: string; subtitle: string; icon: IconName; className?: string };

export const SecureLinkDetails: FC<SecureLink> = ({ active, secureLink, readCount, maxReadCount, expirationDate }) => {
    const { writeToClipboard } = usePassCore();
    const { createNotification } = useNotifications();
    const [linkCopied, setLinkCopied] = useState(false);
    const ref = useRef<HTMLButtonElement>(null);

    const copyLink = async () => {
        await writeToClipboard(secureLink);
        ref.current?.focus();
        setLinkCopied(true);
        createNotification({ text: c('Label').t`The URL has been copied to the clipboard` });
    };

    const optionCards = useMemo<SecureLinkCard[]>(() => {
        const cards: SecureLinkCard[] = [
            {
                title: c('Info').t`Expires in`,
                subtitle: timeRemaining(expirationDate),
                icon: 'clock',
            },
        ];

        if (maxReadCount !== null) {
            cards.push({
                title: c('Info').t`Can be viewed`,
                subtitle: getOccurrenceString(maxReadCount),
                icon: 'eye',
            });
        }

        return cards;
    }, [readCount, maxReadCount, expirationDate]);

    return (
        <>
            <ModalTwoContent>
                <section className="flex flex-nowrap align-center gap-3 mb-5">
                    {optionCards.map(({ title, subtitle, icon }) => (
                        <Card type="primary" className="flex justify-center flex-1" key={title}>
                            <CardContent
                                className="text-rg"
                                title={title}
                                titleClassname="color-weak text-sm"
                                subtitle={subtitle}
                                subtitleClassname={clsx('text-bold mt-1', !active && 'color-weak')}
                                icon={icon}
                                iconProps={{ size: 6, className: 'color-primary' }}
                                ellipsis
                            />
                        </Card>
                    ))}
                </section>

                <Card type="primary" onClick={copyLink} className="cursor-pointer">
                    <div className={clsx(['user-select-none text-bold text-ellipsis', linkCopied && 'bg-primary'])}>
                        {secureLink}
                    </div>
                </Card>
            </ModalTwoContent>
            <ModalTwoFooter className="flex flex-column items-stretch text-center">
                <Button
                    color={linkCopied ? 'success' : 'norm'}
                    shape="solid"
                    size="large"
                    pill
                    onBlur={() => setLinkCopied(false)}
                    onClick={copyLink}
                    ref={ref}
                >
                    {linkCopied ? c('Action').t`Link copied to clipboard` : c('Action').t`Copy link`}
                </Button>
            </ModalTwoFooter>
        </>
    );
};
