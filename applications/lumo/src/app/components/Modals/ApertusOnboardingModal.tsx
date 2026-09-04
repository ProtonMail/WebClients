import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import type { ModalProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import apertusWordmark from '@proton/styles/assets/img/lumo/apertus-wordmark.png';

import { useNativeComposerVisibilityApi } from '../Composer/hooks/useNativeComposerVisibilityApi';

interface ApertusOnboardingModalProps extends ModalProps {
    onConfirm: () => void;
}

export default function ApertusOnboardingModal({ onConfirm, open, ...modalProps }: ApertusOnboardingModalProps) {
    const apertusArticleLink = (
        <Href
            key="apertus-article"
            href="https://www.apertus-ai.org/articles/2026-07-apertus-1-5/"
            target="_blank"
            rel="noopener noreferrer"
        >
            Apertus 1.5
        </Href>
    );
    const apertusCharterLink = (
        <Href
            key="apertus-charter"
            href="https://www.apertus-ai.org/pages/charter/"
            target="_blank"
            rel="noopener noreferrer"
        >
            {c('collider_2025: Link').t`Apertus Charter`}
        </Href>
    );
    const protonBlogLink = (
        <Href
            key="proton-blog"
            href="https://proton.me/blog/lumo-apertus"
            target="_blank"
            rel="noopener noreferrer"
        >
            {c('collider_2025: Link').t`${BRAND_NAME} blog`}
        </Href>
    );

    useNativeComposerVisibilityApi({ hideComposer: Boolean(open) });

    return (
        <ModalTwo size="large" open={open} {...modalProps}>
            <ModalTwoHeader hasClose title={c('collider_2025: Title').t`Meet Apertus 1.5`} />
            <ModalTwoContent>
                <div
                    className="flex items-center justify-center rounded-lg px-8 py-10 mb-6"
                    style={{ backgroundColor: '#f5f7fa' }}
                >
                    <img
                        src={apertusWordmark}
                        alt="Apertus"
                        className="block w-full max-w-custom"
                        style={{ '--max-w-custom': '32rem' }}
                    />
                </div>

                <p className="mt-0 color-weak">{c('collider_2025: Description')
                    .jt`${apertusArticleLink} is a fully open, Swiss-made AI model developed with leading Swiss universities. It is best suited to lighter everyday tasks.`}</p>
                <p className="color-weak">{c('collider_2025: Description')
                    .jt`Its model weights, training data, values, and development details are open for inspection. The ${apertusCharterLink} provides strong ethical guardrails for privacy, responsible data use, transparency, and human agency.`}</p>

                <div className="flex flex-column gap-4 mt-6">
                    <div>
                        <h3 className="text-semibold mb-1">{c('collider_2025: Title').t`You stay in control`}</h3>
                        <p className="m-0 color-weak">{c('collider_2025: Description')
                            .t`After you continue, Apertus will appear as the selected model in the model menu. You can use that menu to switch to another model at any time.`}</p>
                    </div>

                    <div>
                        <h3 className="text-semibold mb-1">{c('collider_2025: Title')
                            .t`Help improve open-source AI`}</h3>
                        <p className="m-0 color-weak">{c('collider_2025: Description')
                            .t`If Apertus gives you a poor response, use the thumbs down button to send feedback. The related prompt and response will be shared with university research teams at ETH Zurich and EPFL to help improve the model. This feedback loop is especially valuable for fully open models, helping them improve faster and remain competitive.`}</p>
                        <p className="mb-0 mt-2 color-weak">{c('collider_2025: Description')
                            .jt`You can learn more on the ${protonBlogLink}.`}</p>
                    </div>
                </div>

            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="button" onClick={modalProps.onClose}>{c('collider_2025: Action').t`Not now`}</Button>
                <Button type="button" color="norm" onClick={onConfirm}>{c('collider_2025: Action')
                    .t`Use Apertus`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
}
