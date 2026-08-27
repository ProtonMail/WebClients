import { useMemo } from 'react';

import Option from '@proton/components/components/option/Option';

const STATIC_PODCASTS: { name: string; value: string }[] = [
    {
        name: 'La Ingobernable',
        value: 'la_ingobernable',
    },
    {
        name: 'Soul Boom',
        value: 'soul_boom',
    },
    {
        name: 'Only If You Get Caught',
        value: 'only_if_you_get_caught',
    },
    {
        name: 'Rompiendo el Mercado',
        value: 'rompiendo_el_mercado',
    },
    {
        name: 'Mom Uncharted',
        value: 'mom_uncharted',
    },
    {
        name: 'The MinnMax Show',
        value: 'the_minnmax_show',
    },
    {
        name: 'Athletic FC podcast',
        value: 'athletic_fc_podcast',
    },
    {
        name: 'Objetivo Libertad Financiera',
        value: 'objetivo_libertad_financiera',
    },
    {
        name: 'Tengo un Plan',
        value: 'tengo_un_plan',
    },
    {
        name: 'The Gist',
        value: 'the_gist',
    },
    {
        name: 'Today Explained',
        value: 'today_explained',
    },
    {
        name: 'Expreso de Medianoche',
        value: 'expreso_de_medianoche',
    },
    {
        name: 'How I Built This',
        value: 'how_i_built_this',
    },
    {
        name: '9to5 Mac Happy Hour',
        value: '9to5_mac_happy_hour',
    },
    {
        name: 'The Vergecast',
        value: 'the_vergecast',
    },
    {
        name: 'What Next: TBD',
        value: 'what_next_tbd',
    },
    {
        name: 'Take Your Shoes Off',
        value: 'take_your_shoes_off',
    },
    {
        name: 'Missed Apex Formula 1 Podcast',
        value: 'missed_apex_formula_1_podcast',
    },
    {
        name: 'The HoneyDew with Ryan Sickler',
        value: 'the_honeydew_with_ryan_sickler',
    },
    {
        name: 'Podcast de Juan Ramón Rallo',
        value: 'podcast_de_juan_ramon_rallo',
    },
    {
        name: 'Door Handle Podcast',
        value: 'door_handle_podcast',
    },
    {
        name: 'J vs Ben',
        value: 'j_vs_ben',
    },
    {
        name: 'Mac Geek Gab — Apple Tips, Tricks, and Troubleshooting',
        value: 'mac_geek_gab_apple_tips_tricks_and_troubleshooting',
    },
    {
        name: 'Total Soccer Show',
        value: 'total_soccer_show',
    },
    {
        name: "Let's Learn Everything",
        value: 'lets_learn_everything',
    },
    {
        name: 'Pew Pew Bang',
        value: 'pew_pew_bang',
    },
    {
        name: 'Cuéntanos',
        value: 'cuentanos',
    },
    {
        name: 'Un Podcast Sobre Bitcoin',
        value: 'un_podcast_sobre_bitcoin',
    },
    {
        name: 'The Race F1 Podcast',
        value: 'the_race_f1_podcast',
    },
    {
        name: 'Search Engine',
        value: 'search_engine',
    },
    {
        name: 'No es el fin del mundo',
        value: 'no_es_el_fin_del_mundo',
    },
    {
        name: 'Alan Barroso',
        value: 'alan_barroso',
    },
    {
        name: 'Factually! with Adam Conover',
        value: 'factually_with_adam_conover',
    },
    {
        name: 'Real Politik FC',
        value: 'real_politik_fc',
    },
    {
        name: 'No Obstante',
        value: 'no_obstante',
    },
    {
        name: 'Crashing Out',
        value: 'crashing_out',
    },
    {
        name: 'Tierra de Hackers',
        value: 'tierra_de_hackers',
    },
    {
        name: 'The Besties',
        value: 'the_besties',
    },
    {
        name: 'My World with Jeff Jarrett',
        value: 'my_world_with_jeff_jarrett',
    },
    {
        name: 'Data Skeptic',
        value: 'data_skeptic',
    },
    {
        name: 'Kinda Funny',
        value: 'kinda_funny',
    },
    {
        name: "Founder's Story",
        value: 'founders_story',
    },
    {
        name: 'WhatCulture Gaming',
        value: 'whatculture_gaming',
    },
    {
        name: 'Snake & Banter',
        value: 'snake_banter',
    },
    {
        name: 'WORLDCAST',
        value: 'worldcast',
    },
    {
        name: 'WIRED | Uncanny Valley',
        value: 'wired_uncanny_valley',
    },
    {
        name: 'Spicy 4 tuna',
        value: 'spicy_4_tuna',
    },
    {
        name: 'OpTic Podcast',
        value: 'optic_podcast',
    },
    {
        name: 'Wrestling is Cool!',
        value: 'wrestling_is_cool',
    },
    {
        name: 'TechLinked',
        value: 'techlinked',
    },
    {
        name: 'The Kit & Krysta Podcast',
        value: 'the_kit_krysta_podcast',
    },
    {
        name: 'Worklife with Molly Graham',
        value: 'worklife_with_molly_graham',
    },
    {
        name: 'Finding Mastery',
        value: 'finding_mastery',
    },
    {
        name: 'Locked On MLB - Daily Podcast On Major League Baseball',
        value: 'locked_on_mlb_daily_podcast_on_major_league_baseball',
    },
    {
        name: 'The Prof G Show with Scott Galloway',
        value: 'the_prof_g_show_with_scott_galloway',
    },
    {
        name: 'Monos Estocásticos',
        value: 'monos_estocasticos',
    },
    {
        name: 'Gente Interesante',
        value: 'gente_interesante',
    },
    {
        name: 'Hacked',
        value: 'hacked',
    },
    {
        name: 'Freelance to Founder',
        value: 'freelance_to_founder',
    },
    {
        name: 'Armchair Expert',
        value: 'armchair_expert',
    },
    {
        name: 'Never Post',
        value: 'never_post',
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
