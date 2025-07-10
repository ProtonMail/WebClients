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

    return `Anonymous ${particleNames[randomIndex]} ${Math.floor(Math.random() * 1000)}`;
};
