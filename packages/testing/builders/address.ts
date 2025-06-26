import type { Address, AddressKey } from '@proton/shared/lib/interfaces';

export const buildAddress = (value?: Partial<Address>): Address => {
    return {
        CatchAll: false,
        ID: 'YC-yr6jeFLCSwO5DuGBxGYMSHesNSgl3FcIZ-ITJtvTu2w6gBAmGnufX8Hnl0TK4P5p2VOPJ3kVcjHBSj9hQKw==',
        DomainID: 'l8vWAXHBQmv0u7OVtPbcqMa4iwQaBqowINSQjPrxAr-Da8fVPKUkUcqAq30_BCxj1X0nW70HQRmAa-rIvzmKUA==',
        Email: 'jovan@proton.me',
        Status: 0,
        Type: 2,
        Receive: 0,
        Send: 0,
        DisplayName: 'Jovan',
        Signature: '<div>pred&gt;&lt;posle</div>',
        Order: 37,
        Priority: 37,
        HasKeys: 1,
        Keys: [
            {
                ID: 'Rw8hqmbcdWaSfNy2lxbJ54xDlwFvUtYbyTK4YPva6Gw_WWQ6yMOvOsRF_a-v5ddOP2fsTv-vX-ZM0R_JdKSUGg==',
                Primary: 1,
                Flags: 3,
                Fingerprint: '6afee2a00d36edbf42f7f28c332d35bb9d2fce91',
                Fingerprints: ['6afee2a00d36edbf42f7f28c332d35bb9d2fce91', 'a28a3964196a4fe0a0dcb7f10ffa6f0097158327'],
                Active: 1,
                Version: 3,
                PrivateKey:
                    '-----BEGIN PGP PRIVATE KEY BLOCK-----\nVersion: ProtonMail\n\n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\n=w8zS\n-----END PGP PRIVATE KEY BLOCK-----\n',
                Token: '-----BEGIN PGP MESSAGE-----\nVersion: ProtonMail\n\nwcBMA+d3/RmquWBYAQf/U9ovKmpXSnD8hMVlKe/NHPteUMY+Kb+D2P6lXh/K\ny7mWAQJzr49gX6Gp9JfNA3y34VD8E+vgab/7FYVX1Z2E/iRa+bzmmE0W6lPX\nPgm5COKkRmfovDtgOoUffvBi9aEG6BgxtkXY1r1H2Jf2mmqKBPNJirzVdvJ5\neEO1TdgnHLu8caXeofBQgoBa5ObfolpSIMFLsBWVD8kPr4jBPKifbF+3SjZ9\n15lhyQa+AE/Z0+7HL/xdQ5V81cGZiUvmpv0thZE80x8j2dMrovWyPc5bD/gW\n0xDZlZAy++fAd66aYSPjFaSlJ+/TFmWoeyMPe0cxYvY5c7o9dZPzWUJ/UeQe\n99J4AcvL3ORCg/TowGVcvWDvE9ib4D3ZjcP+sPhhidmqjAjw9yTbaCHLyx6n\nfA5hwdPFO9vCGnBVwarx7Dqyjr02ICxzpIHicPqeBimrT52XKTPo9TP+a767\nyVrRZf0C08jWkR128bfSivn2axlgj/B6Pj8NW27WlEC8\n=odVa\n-----END PGP MESSAGE-----\n',
                Signature:
                    '-----BEGIN PGP SIGNATURE-----\nVersion: ProtonMail\n\nwsBzBAEBCAAGBQJhl45HACEJEMO1ZjhE3f0jFiEEmo5cq93ZoSWYGoi3w7Vm\nOETd/SMGMwgAhM/J/ZniEw+eXk9zOPYSuk7muhG/OOVj42RqXNM151Dhe3qA\ncUg4KX1RahoMWEIasegw062xtancNwpE9xm0yO4/UaccVe6x3sucIGRcIlUR\nxEMsu843sl5G00m6ajras3QNCaKm7AcPatiQqL1aVTbIuVR/lF/TSo29BsA6\nMfC7LObXLP8zU89/88u879gW+Vsfnt9m/lRSPEU2bgEVCGWvSP3huoExH938\nHgWRtTd+ySe+CaGCPFL0YjYdBL6nQi4oQRcQTXWJkG+DFbISR6AaRBLyxxMt\nDlCl8izyvBov0jYeoblyeEFDsTU2Fy8OnYGgYP/LITK71t0KkimPcw==\n=U6I7\n-----END PGP SIGNATURE-----\n',
            } as AddressKey,
        ],
        SignedKeyList: null,
        ProtonMX: true,
        ConfirmationState: 1,
        Permissions: 7,
        ...value,
    };
};
