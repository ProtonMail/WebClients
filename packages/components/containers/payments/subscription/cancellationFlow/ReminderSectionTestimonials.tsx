import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import SettingsSectionTitle from '@proton/components/containers/account/SettingsSectionTitle';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';

import type { PlanConfigTestimonial } from './interface';

import './ReminderSectionTestimonials.scss';

const ReminderSectionTestimonials = ({
    title,
    description,
    learnMoreCTA,
    learnMoreLink,
    testimonials,
}: PlanConfigTestimonial) => {
    return (
        <SettingsSectionWide className="container-section-sticky-section">
            <SettingsSection className="mb-6">
                <SettingsSectionTitle className="mb-4">{title}</SettingsSectionTitle>
                <SettingsParagraph>
                    <>
                        {description}
                        {learnMoreCTA && learnMoreLink ? (
                            <a className="block mt-3" href={learnMoreLink} target="_blank" rel="noopener noreferrer">
                                {learnMoreCTA}
                            </a>
                        ) : null}
                    </>
                </SettingsParagraph>
            </SettingsSection>
            <section className="flex flex-column">
                {testimonials.map(({ title, description, ctaText, link, picture }) => (
                    <div key={title} className="flex flex-row flex-nowrap gap-2 rounded-lg h-full py-3">
                        <img src={picture} alt={title} className="rounded-lg object-cover w-1/3 min-w-1/3" />
                        <div className="flex flex-column gap-2 h-full pl-4">
                            <p className="m-0 text-bold">{title}</p>
                            <p className="m-0 grow color-weak text-sm">{description}</p>
                            <a href={link} target="_blank" rel="noopener noreferrer">
                                {ctaText}
                            </a>
                        </div>
                    </div>
                ))}
            </section>
        </SettingsSectionWide>
    );
};

export default ReminderSectionTestimonials;
