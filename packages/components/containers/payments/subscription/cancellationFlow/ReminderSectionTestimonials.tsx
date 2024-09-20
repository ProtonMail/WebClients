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
    learMoreLink,
    testimonials,
}: PlanConfigTestimonial) => {
    return (
        <SettingsSectionWide className="container-section-sticky-section">
            <SettingsSection className="mb-6">
                <SettingsSectionTitle className="mb-4">{title}</SettingsSectionTitle>
                <SettingsParagraph>
                    <>
                        {description}
                        {learnMoreCTA && learMoreLink && (
                            <>
                                <a className="block mt-3" href={learMoreLink} target="_blank" rel="noopener noreferrer">
                                    {learnMoreCTA}
                                </a>
                            </>
                        )}
                    </>
                </SettingsParagraph>
            </SettingsSection>
            <section className="testimonial-grid">
                {testimonials.map(({ title, description, ctaText, link, picture }) => (
                    <div key={title} className="border flex flex-column gap-2 rounded-lg h-full p-4">
                        <img src={picture} alt={title} className="rounded-lg object-cover" />
                        <p className="m-0 text-bold">{title}</p>
                        <p className="m-0 grow color-weak text-sm">{description}</p>
                        <a href={link} target="_blank" rel="noopener noreferrer">
                            {ctaText}
                        </a>
                    </div>
                ))}
            </section>
        </SettingsSectionWide>
    );
};

export default ReminderSectionTestimonials;
