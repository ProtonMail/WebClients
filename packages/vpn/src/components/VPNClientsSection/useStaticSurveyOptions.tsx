import { useMemo } from 'react';

import Option from '@proton/components/components/option/Option';

const STATIC_PODCASTS: { name: string; value: string }[] = [
    {
        name: 'The Kit & Krysta Podcast',
        value: 'the_kit_krysta_podcast',
    },
    {
        name: 'Locked On MLB - Daily Podcast On Major League Baseball',
        value: 'locked_on_mlb_daily_podcast_on_major_league_baseball',
    },
    {
        name: 'My World with Jeff Jarrett',
        value: 'my_world_with_jeff_jarrett',
    },
    {
        name: 'WIRED | Uncanny Valley',
        value: 'wired_uncanny_valley',
    },
    {
        name: 'Worklife with Molly Graham',
        value: 'worklife_with_molly_graham',
    },
    {
        name: 'What Next: TBD',
        value: 'what_next_tbd',
    },
    {
        name: 'Total Soccer Show',
        value: 'total_soccer_show',
    },
    {
        name: 'The Gist',
        value: 'the_gist',
    },
    {
        name: "Founder's Story",
        value: 'founders_story',
    },
    {
        name: 'Freelance to Founder',
        value: 'freelance_to_founder',
    },
    {
        name: 'Search Engine',
        value: 'search_engine',
    },
    {
        name: 'Take Your Shoes Off',
        value: 'take_your_shoes_off',
    },
    {
        name: 'The Prof G Show with Scott Galloway',
        value: 'the_prof_g_show_with_scott_galloway',
    },
    {
        name: 'The Vergecast',
        value: 'the_vergecast',
    },
    {
        name: 'Today Explained',
        value: 'today_explained',
    },
    {
        name: 'The Besties',
        value: 'the_besties',
    },
    {
        name: 'Finding Mastery',
        value: 'finding_mastery',
    },
    {
        name: 'Factually! with Adam Conover',
        value: 'factually_with_adam_conover',
    },
    {
        name: 'The HoneyDew with Ryan Sickler',
        value: 'the_honeydew_with_ryan_sickler',
    },
    {
        name: 'Door Handle Podcast',
        value: 'door_handle_podcast',
    },
    {
        name: 'Armchair Expert',
        value: 'armchair_expert',
    },
    {
        name: 'How I Built This',
        value: 'how_i_built_this',
    },
    {
        name: 'Mom Uncharted',
        value: 'mom_uncharted',
    },
    {
        name: 'Soul Boom',
        value: 'soul_boom',
    },
    {
        name: 'Crashing Out',
        value: 'crashing_out',
    },
    {
        name: 'TechLinked',
        value: 'techlinked',
    },
] as const;

const STATIC_YOUTUBE_CHANNELS: { name: string; value: string }[] = [
    {
        name: 'The Cyberpunk Dingo',
        value: 'the_cyberpunk_dingo',
    },
    {
        name: 'Alán Barroso Clips',
        value: 'alan_barroso_clips',
    },
    {
        name: 'David Bombal',
        value: 'david_bombal',
    },
    {
        name: 'BENDER',
        value: 'bender',
    },
    {
        name: 'Art Chad',
        value: 'art_chad',
    },
    {
        name: 'Kitboga',
        value: 'kitboga',
    },
    {
        name: 'Anders Puck Nielsen',
        value: 'anders_puck_nielsen',
    },
    {
        name: 'JaviPonzo',
        value: 'javiponzo',
    },
    {
        name: 'No Text To Speech',
        value: 'no_text_to_speech',
    },
    {
        name: 'Lord Draugr',
        value: 'lord_draugr',
    },
    {
        name: 'Expressions Oozing',
        value: 'expressions_oozing',
    },
    {
        name: 'foci',
        value: 'foci',
    },
    {
        name: 'The Big 6ix',
        value: 'the_big_6ix',
    },
    {
        name: 'TurkishLDN',
        value: 'turkishldn',
    },
    {
        name: 'Faysal',
        value: 'faysal',
    },
    {
        name: 'Parafantástico',
        value: 'parafantástico',
    },
    {
        name: 'Un Podcast Sobre Bitcoin',
        value: 'un_podcast_sobre_bitcoin',
    },
] as const;

export const useStaticSurveyOptions = () => {
    const [podcasts, youtubeChannels] = useMemo(
        () => [
            STATIC_PODCASTS.map(({ name, value }) => <Option key={value} title={name} value={value} />),
            STATIC_YOUTUBE_CHANNELS.map(({ name, value }) => <Option key={value} title={name} value={value} />),
        ],
        []
    );

    return { podcasts, youtubeChannels };
};
