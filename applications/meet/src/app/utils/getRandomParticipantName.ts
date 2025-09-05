import { c } from 'ttag';

const particleNames = [
    'Photon',
    'Electron',
    'Proton',
    'Neutron',
    'Quark',
    'Gluon',
    'Neutrino',
    'Muon',
    'Tau',
    'Boson',
    'Graviton',
];

export const getRandomParticipantName = () => {
    const randomIndex = Math.floor(Math.random() * particleNames.length);

    const particle = particleNames[randomIndex];
    const participantNumber = Math.floor(Math.random() * 1000);

    const localizedName = c('Info').t`Anonymous ${particle} ${participantNumber}`;

    return localizedName;
};
