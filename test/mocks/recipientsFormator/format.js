import _ from 'lodash';

const list = [
    {
      "Name": "OK",
      "Address": "ZFw5YsPwGyBPL7bOjOyYfN89yqPbRz1wqH9pKfapN0LG1URLXf406q2v5TEZpN9ffZUtNLlCaTqX364l_q7zcg==",
      "isContactGroup": true,
      "list": [
        {
          "Name": "Jeanne",
          "Address": "test2+jeanne@protonmail.com",
          "Group": "OK"
        },
        {
          "Name": "Jean roger sur seine",
          "Address": "testdew@protonmail.com",
          "Group": "OK"
        }
      ]
    },
    {
      "Name": "jojo",
      "Address": "_pQY9uBBrX2qCWoBn60s78dKdkhNtjBkFXzXp_NuRwN13bdLi2T0qV4TWpXRqDE3CZVqcAaS9kxbr-ZHPGIR0g==",
      "isContactGroup": true,
      "list": [
        {
          "Name": "{{2*2}}",
          "Address": "test@protonmail.com",
          "Group": "jojo"
        },
        {
          "Name": "ProtonMail 123",
          "Address": "test2+test@protonmail.com",
          "Group": "jojo"
        },
        {
          "Name": "kkok",
          "Address": "test2+kkok@pm.me",
          "Group": "jojo"
        },
        {
          "Name": "‹awesome",
          "Address": "test2+awesome@protonmail.com",
          "Group": "jojo"
        }
      ]
    },
    {
      "Name": "lol2",
      "Address": "LAfAt3tFgqqbm2pXV2l8Z6QWzD3i_IcCKpWsGw5wvca-fgGf5qQyJX8_SfquNCbLCwE_ILDt1wohWpQ9LYNbGg==",
      "isContactGroup": true,
      "list": [
        {
          "Name": "jeja",
          "Address": "test2+kirikou@protonmail.com",
          "Group": "lol2"
        }
      ]
    },
    {
      "Name": "pedro@protonmail.com",
      "Address": "pedro@protonmail.com",
      "Group": "",
      "isContactGroup": false
    },
    {
      "Name": "Neilerua",
      "Address": "test1@protonmail.com",
      "Group": "",
      "isContactGroup": false
    }
];

const MessageID = 'OToREB-1fGGuOD1Kt94fpJIJalIvpZhaWfjwKDjvV1CJ9aZXEynu7vmfJ8_71fpHUZxgN1ZiZKPxEL4RbOZvrA==';

export const output = [
  {
    "Address": "test2+jeanne@protonmail.com",
    "ContactID": "7FuNLozvtZutkpq1FfR84lsyEl0sT7wz7b6OE8YTzUzDVJ8OVDCleACjOCKqCU8-2060fcKPQlOwn07XYLuJ-A==",
    "Name": "Jeanne",
    "Group": "OK"
  },
  {
    "Address": "testdew@protonmail.com",
    "ContactID": "Wa8nGM667gT1l9PtvKO2-qoG0Cef3XgIy-Ko3G4q4XWUs3aVfF3OLQ-gJAJzFjVaNDYywmqtJMleARzH3r8F9w==",
    "Name": "Jean roger sur seine",
    "Group": "OK"
  },
  {
    "Address": "test@protonmail.com",
    "ContactID": "B1RDp1LvDTSDTZv-11Bjo1ilFcg1islhc0i_Vlxo2Lj9H4AEuj9TWCdqKyEVhXhamqppQo5BsRJHQkKvGzizUw==",
    "Name": "{{2*2}}",
    "Group": "jojo"
  },
  {
    "Address": "test2+test@protonmail.com",
    "ContactID": "hmmp4bq_x23OOFKl5jnr1H26h1B7Z2DjlNQK9wdSxhQm3WbCuEq-l-1kGgOPRFUKUmA2Mce41TpxGvYogTLlfg==",
    "Name": "ProtonMail 123",
    "Group": "jojo"
  },
  {
    "Address": "test2+kkok@pm.me",
    "ContactID": "-Q96aaohQbClqKrrAtqZmI8yMnWnWaf4Mo1-j64x1Bx7Hr80L13ImQYhBjB2EeUnc4Q3sUwcBSLM5C7d03iqdw==",
    "Name": "kkok",
    "Group": "jojo"
  },
  {
    "Address": "test2+awesome@protonmail.com",
    "ContactID": "PaMne3o_jmzPuvm4TECMd44V5uIbtt7_1TmHbdxiXA3MhMlTsXj6GzuoyPIZ1EwhwhpuJrWcoZMnDPkyLkyuRw==",
    "Name": "‹awesome",
    "Group": "jojo"
  },
  {
    "Address": "test2+kirikou@protonmail.com",
    "ContactID": "urxeVJ_zBUPAvsZk7FHqPPEIYDh9k24bRbGWnJj-vyA6s-KJob85szliADisDUiUMverVyfcagTLe6Yuut0pcQ==",
    "Name": "jeja",
    "Group": "lol2"
  },
  {
    "Name": "pedro@protonmail.com",
    "Address": "pedro@protonmail.com",
    "Group": "",
    "isContactGroup": false
  },
  {
    "Name": "Neilerua",
    "Address": "test1@protonmail.com",
    "Group": "",
    "isContactGroup": false
  }
];

const exportGroupSelection = [
  [
    {
      "ID": "nIvpH-nF0MnwTVkqEv9WqdTaQ-VbVsn_oAGnaNb9U-W6miuFRMexy3SkMLUJa9vDgxmYEjpe2_MgeFeg3Q3jBw==",
      "Name": "Jeanne",
      "Email": "test2+jeanne@protonmail.com",
      "Type": [],
      "Defaults": 1,
      "Order": 1,
      "LastUsedTime": 0,
      "ContactID": "7FuNLozvtZutkpq1FfR84lsyEl0sT7wz7b6OE8YTzUzDVJ8OVDCleACjOCKqCU8-2060fcKPQlOwn07XYLuJ-A==",
      "LabelIDs": [
        "ZFw5YsPwGyBPL7bOjOyYfN89yqPbRz1wqH9pKfapN0LG1URLXf406q2v5TEZpN9ffZUtNLlCaTqX364l_q7zcg==",
        "_pQY9uBBrX2qCWoBn60s78dKdkhNtjBkFXzXp_NuRwN13bdLi2T0qV4TWpXRqDE3CZVqcAaS9kxbr-ZHPGIR0g=="
      ]
    },
    {
      "ID": "6v--26axvEAN37Kp3sMp5PmrzbzLHB1s2yD5y923H_D0SOe2kK5XTZyBMkgTeIvigMALpO_YoroCUX5IIlGC4g==",
      "Name": "Jean roger sur seine",
      "Email": "testdew@protonmail.com",
      "Type": [],
      "Defaults": 0,
      "Order": 1,
      "LastUsedTime": 0,
      "ContactID": "Wa8nGM667gT1l9PtvKO2-qoG0Cef3XgIy-Ko3G4q4XWUs3aVfF3OLQ-gJAJzFjVaNDYywmqtJMleARzH3r8F9w==",
      "LabelIDs": [
        "ZFw5YsPwGyBPL7bOjOyYfN89yqPbRz1wqH9pKfapN0LG1URLXf406q2v5TEZpN9ffZUtNLlCaTqX364l_q7zcg=="
      ]
    }
  ],
  [
    {
      "ID": "1TXjN5LSPoSKtQIHM3pPMPC0h40nnabEEkW2HmW_pHzwdblAFKNRaj__NcySft07_SiOZGhBmpcptzTF0z-gzQ==",
      "Name": "{{2*2}}",
      "Email": "test@protonmail.com",
      "Type": [],
      "Defaults": 0,
      "Order": 1,
      "LastUsedTime": 0,
      "ContactID": "B1RDp1LvDTSDTZv-11Bjo1ilFcg1islhc0i_Vlxo2Lj9H4AEuj9TWCdqKyEVhXhamqppQo5BsRJHQkKvGzizUw==",
      "LabelIDs": [
        "_pQY9uBBrX2qCWoBn60s78dKdkhNtjBkFXzXp_NuRwN13bdLi2T0qV4TWpXRqDE3CZVqcAaS9kxbr-ZHPGIR0g=="
      ]
    },
    {
      "ID": "vrAJru02WtHJ3eOkv6JVAkIsPWHv0PBjHHQwFKmh02jvFejm-nAGYguyfeqzJmcJO4EzhRfZcoGdZB9OsuxmUw==",
      "Name": "ProtonMail 123",
      "Email": "test2+test@protonmail.com",
      "Type": [],
      "Defaults": 1,
      "Order": 1,
      "LastUsedTime": 0,
      "ContactID": "hmmp4bq_x23OOFKl5jnr1H26h1B7Z2DjlNQK9wdSxhQm3WbCuEq-l-1kGgOPRFUKUmA2Mce41TpxGvYogTLlfg==",
      "LabelIDs": [
        "_pQY9uBBrX2qCWoBn60s78dKdkhNtjBkFXzXp_NuRwN13bdLi2T0qV4TWpXRqDE3CZVqcAaS9kxbr-ZHPGIR0g=="
      ]
    },
    {
      "ID": "nIvpH-nF0MnwTVkqEv9WqdTaQ-VbVsn_oAGnaNb9U-W6miuFRMexy3SkMLUJa9vDgxmYEjpe2_MgeFeg3Q3jBw==",
      "Name": "Jeanne",
      "Email": "test2+jeanne@protonmail.com",
      "Type": [],
      "Defaults": 1,
      "Order": 1,
      "LastUsedTime": 0,
      "ContactID": "7FuNLozvtZutkpq1FfR84lsyEl0sT7wz7b6OE8YTzUzDVJ8OVDCleACjOCKqCU8-2060fcKPQlOwn07XYLuJ-A==",
      "LabelIDs": [
        "ZFw5YsPwGyBPL7bOjOyYfN89yqPbRz1wqH9pKfapN0LG1URLXf406q2v5TEZpN9ffZUtNLlCaTqX364l_q7zcg==",
        "_pQY9uBBrX2qCWoBn60s78dKdkhNtjBkFXzXp_NuRwN13bdLi2T0qV4TWpXRqDE3CZVqcAaS9kxbr-ZHPGIR0g=="
      ]
    },
    {
      "ID": "IZ6hGb2avwEq8Zo9aHSe14x9uPahd___LcKgDYi564KpZQgrOyQNwkQ1H0ajzNfWGM2JiN6OvZkauvY8O2eyDA==",
      "Name": "kkok",
      "Email": "test2+kkok@pm.me",
      "Type": [],
      "Defaults": 1,
      "Order": 1,
      "LastUsedTime": 0,
      "ContactID": "-Q96aaohQbClqKrrAtqZmI8yMnWnWaf4Mo1-j64x1Bx7Hr80L13ImQYhBjB2EeUnc4Q3sUwcBSLM5C7d03iqdw==",
      "LabelIDs": [
        "_pQY9uBBrX2qCWoBn60s78dKdkhNtjBkFXzXp_NuRwN13bdLi2T0qV4TWpXRqDE3CZVqcAaS9kxbr-ZHPGIR0g=="
      ]
    },
    {
      "ID": "iKifOzODRFNHQ0LhJyk6Ong8GhwdA020ZqJWXEIvECTV4Rm2GNBuOZUkXp7BUzYqG8ozUfhlZK_vWdXymn5Yvw==",
      "Name": "‹awesome",
      "Email": "test2+awesome@protonmail.com",
      "Type": [],
      "Defaults": 0,
      "Order": 1,
      "LastUsedTime": 0,
      "ContactID": "PaMne3o_jmzPuvm4TECMd44V5uIbtt7_1TmHbdxiXA3MhMlTsXj6GzuoyPIZ1EwhwhpuJrWcoZMnDPkyLkyuRw==",
      "LabelIDs": [
        "_pQY9uBBrX2qCWoBn60s78dKdkhNtjBkFXzXp_NuRwN13bdLi2T0qV4TWpXRqDE3CZVqcAaS9kxbr-ZHPGIR0g==",
        "V8qQux4He1bb1hKihc9GPH6VqLzz9uR-8VbPsRS_HTL_a1up_xJ3Ii07Mgoqi2r8OEc5VoScVOwQe_JMIHN-Zg=="
      ]
    }
  ],
  [
    {
      "ID": "T04swE4m8-cqOGCqSdVS8NwqCSLDyRCh-i0bFCoN-cWJ3De3ktPWIw7m1W3oH4MbAPiFkUyUl8QTvhSYKsxGAA==",
      "Name": "jeja",
      "Email": "test2+kirikou@protonmail.com",
      "Type": [],
      "Defaults": 1,
      "Order": 3,
      "LastUsedTime": 0,
      "ContactID": "urxeVJ_zBUPAvsZk7FHqPPEIYDh9k24bRbGWnJj-vyA6s-KJob85szliADisDUiUMverVyfcagTLe6Yuut0pcQ==",
      "LabelIDs": [
        "LAfAt3tFgqqbm2pXV2l8Z6QWzD3i_IcCKpWsGw5wvca-fgGf5qQyJX8_SfquNCbLCwE_ILDt1wohWpQ9LYNbGg=="
      ]
    }
  ]
];

const MAPS = {
  "GROUP_EMAILS": {
    "ZFw5YsPwGyBPL7bOjOyYfN89yqPbRz1wqH9pKfapN0LG1URLXf406q2v5TEZpN9ffZUtNLlCaTqX364l_q7zcg==": [
      {
        "ID": "nIvpH-nF0MnwTVkqEv9WqdTaQ-VbVsn_oAGnaNb9U-W6miuFRMexy3SkMLUJa9vDgxmYEjpe2_MgeFeg3Q3jBw==",
        "Name": "Jeanne",
        "Email": "test2+jeanne@protonmail.com",
        "Type": [],
        "Defaults": 1,
        "Order": 1,
        "LastUsedTime": 0,
        "ContactID": "7FuNLozvtZutkpq1FfR84lsyEl0sT7wz7b6OE8YTzUzDVJ8OVDCleACjOCKqCU8-2060fcKPQlOwn07XYLuJ-A==",
        "LabelIDs": [
          "ZFw5YsPwGyBPL7bOjOyYfN89yqPbRz1wqH9pKfapN0LG1URLXf406q2v5TEZpN9ffZUtNLlCaTqX364l_q7zcg==",
          "_pQY9uBBrX2qCWoBn60s78dKdkhNtjBkFXzXp_NuRwN13bdLi2T0qV4TWpXRqDE3CZVqcAaS9kxbr-ZHPGIR0g=="
        ]
      },
      {
        "ID": "6v--26axvEAN37Kp3sMp5PmrzbzLHB1s2yD5y923H_D0SOe2kK5XTZyBMkgTeIvigMALpO_YoroCUX5IIlGC4g==",
        "Name": "Jean roger sur seine",
        "Email": "testdew@protonmail.com",
        "Type": [],
        "Defaults": 0,
        "Order": 1,
        "LastUsedTime": 0,
        "ContactID": "Wa8nGM667gT1l9PtvKO2-qoG0Cef3XgIy-Ko3G4q4XWUs3aVfF3OLQ-gJAJzFjVaNDYywmqtJMleARzH3r8F9w==",
        "LabelIDs": [
          "ZFw5YsPwGyBPL7bOjOyYfN89yqPbRz1wqH9pKfapN0LG1URLXf406q2v5TEZpN9ffZUtNLlCaTqX364l_q7zcg=="
        ]
      }
    ],
    "_pQY9uBBrX2qCWoBn60s78dKdkhNtjBkFXzXp_NuRwN13bdLi2T0qV4TWpXRqDE3CZVqcAaS9kxbr-ZHPGIR0g==": [
      {
        "ID": "1TXjN5LSPoSKtQIHM3pPMPC0h40nnabEEkW2HmW_pHzwdblAFKNRaj__NcySft07_SiOZGhBmpcptzTF0z-gzQ==",
        "Name": "{{2*2}}",
        "Email": "test@protonmail.com",
        "Type": [],
        "Defaults": 0,
        "Order": 1,
        "LastUsedTime": 0,
        "ContactID": "B1RDp1LvDTSDTZv-11Bjo1ilFcg1islhc0i_Vlxo2Lj9H4AEuj9TWCdqKyEVhXhamqppQo5BsRJHQkKvGzizUw==",
        "LabelIDs": [
          "_pQY9uBBrX2qCWoBn60s78dKdkhNtjBkFXzXp_NuRwN13bdLi2T0qV4TWpXRqDE3CZVqcAaS9kxbr-ZHPGIR0g=="
        ]
      },
      {
        "ID": "vrAJru02WtHJ3eOkv6JVAkIsPWHv0PBjHHQwFKmh02jvFejm-nAGYguyfeqzJmcJO4EzhRfZcoGdZB9OsuxmUw==",
        "Name": "ProtonMail 123",
        "Email": "test2+test@protonmail.com",
        "Type": [],
        "Defaults": 1,
        "Order": 1,
        "LastUsedTime": 0,
        "ContactID": "hmmp4bq_x23OOFKl5jnr1H26h1B7Z2DjlNQK9wdSxhQm3WbCuEq-l-1kGgOPRFUKUmA2Mce41TpxGvYogTLlfg==",
        "LabelIDs": [
          "_pQY9uBBrX2qCWoBn60s78dKdkhNtjBkFXzXp_NuRwN13bdLi2T0qV4TWpXRqDE3CZVqcAaS9kxbr-ZHPGIR0g=="
        ]
      },
      {
        "ID": "IZ6hGb2avwEq8Zo9aHSe14x9uPahd___LcKgDYi564KpZQgrOyQNwkQ1H0ajzNfWGM2JiN6OvZkauvY8O2eyDA==",
        "Name": "kkok",
        "Email": "test2+kkok@pm.me",
        "Type": [],
        "Defaults": 1,
        "Order": 1,
        "LastUsedTime": 0,
        "ContactID": "-Q96aaohQbClqKrrAtqZmI8yMnWnWaf4Mo1-j64x1Bx7Hr80L13ImQYhBjB2EeUnc4Q3sUwcBSLM5C7d03iqdw==",
        "LabelIDs": [
          "_pQY9uBBrX2qCWoBn60s78dKdkhNtjBkFXzXp_NuRwN13bdLi2T0qV4TWpXRqDE3CZVqcAaS9kxbr-ZHPGIR0g=="
        ]
      },
      {
        "ID": "iKifOzODRFNHQ0LhJyk6Ong8GhwdA020ZqJWXEIvECTV4Rm2GNBuOZUkXp7BUzYqG8ozUfhlZK_vWdXymn5Yvw==",
        "Name": "‹awesome",
        "Email": "test2+awesome@protonmail.com",
        "Type": [],
        "Defaults": 0,
        "Order": 1,
        "LastUsedTime": 0,
        "ContactID": "PaMne3o_jmzPuvm4TECMd44V5uIbtt7_1TmHbdxiXA3MhMlTsXj6GzuoyPIZ1EwhwhpuJrWcoZMnDPkyLkyuRw==",
        "LabelIDs": [
          "_pQY9uBBrX2qCWoBn60s78dKdkhNtjBkFXzXp_NuRwN13bdLi2T0qV4TWpXRqDE3CZVqcAaS9kxbr-ZHPGIR0g==",
          "V8qQux4He1bb1hKihc9GPH6VqLzz9uR-8VbPsRS_HTL_a1up_xJ3Ii07Mgoqi2r8OEc5VoScVOwQe_JMIHN-Zg=="
        ]
      }
    ],
    "LAfAt3tFgqqbm2pXV2l8Z6QWzD3i_IcCKpWsGw5wvca-fgGf5qQyJX8_SfquNCbLCwE_ILDt1wohWpQ9LYNbGg==": [
      {
        "ID": "T04swE4m8-cqOGCqSdVS8NwqCSLDyRCh-i0bFCoN-cWJ3De3ktPWIw7m1W3oH4MbAPiFkUyUl8QTvhSYKsxGAA==",
        "Name": "jeja",
        "Email": "test2+kirikou@protonmail.com",
        "Type": [],
        "Defaults": 1,
        "Order": 3,
        "LastUsedTime": 0,
        "ContactID": "urxeVJ_zBUPAvsZk7FHqPPEIYDh9k24bRbGWnJj-vyA6s-KJob85szliADisDUiUMverVyfcagTLe6Yuut0pcQ==",
        "LabelIDs": [
          "LAfAt3tFgqqbm2pXV2l8Z6QWzD3i_IcCKpWsGw5wvca-fgGf5qQyJX8_SfquNCbLCwE_ILDt1wohWpQ9LYNbGg=="
        ]
      }
    ]
  },
  "MAP_GROUP_EMAILS": {
    "ZFw5YsPwGyBPL7bOjOyYfN89yqPbRz1wqH9pKfapN0LG1URLXf406q2v5TEZpN9ffZUtNLlCaTqX364l_q7zcg==": [
      {
        "Name": "Jeanne",
        "Address": "test2+jeanne@protonmail.com",
        "Group": "OK"
      },
      {
        "Name": "Jean roger sur seine",
        "Address": "testdew@protonmail.com",
        "Group": "OK"
      }
    ],
    "_pQY9uBBrX2qCWoBn60s78dKdkhNtjBkFXzXp_NuRwN13bdLi2T0qV4TWpXRqDE3CZVqcAaS9kxbr-ZHPGIR0g==": [
      {
        "Name": "{{2*2}}",
        "Address": "test@protonmail.com",
        "Group": "jojo"
      },
      {
        "Name": "ProtonMail 123",
        "Address": "test2+test@protonmail.com",
        "Group": "jojo"
      },
      {
        "Name": "kkok",
        "Address": "test2+kkok@pm.me",
        "Group": "jojo"
      },
      {
        "Name": "‹awesome",
        "Address": "test2+awesome@protonmail.com",
        "Group": "jojo"
      }
    ],
    "LAfAt3tFgqqbm2pXV2l8Z6QWzD3i_IcCKpWsGw5wvca-fgGf5qQyJX8_SfquNCbLCwE_ILDt1wohWpQ9LYNbGg==": [
      {
        "Name": "jeja",
        "Address": "test2+kirikou@protonmail.com",
        "Group": "lol2"
      }
    ]
  },
  "draftList": {
    "ZFw5YsPwGyBPL7bOjOyYfN89yqPbRz1wqH9pKfapN0LG1URLXf406q2v5TEZpN9ffZUtNLlCaTqX364l_q7zcg==": [
      {
        "Name": "Jeanne",
        "Address": "test2+jeanne@protonmail.com",
        "Group": "OK"
      },
      {
        "Name": "Jean roger sur seine",
        "Address": "testdew@protonmail.com",
        "Group": "OK"
      }
    ],
    "_pQY9uBBrX2qCWoBn60s78dKdkhNtjBkFXzXp_NuRwN13bdLi2T0qV4TWpXRqDE3CZVqcAaS9kxbr-ZHPGIR0g==": [
      {
        "Name": "{{2*2}}",
        "Address": "test@protonmail.com",
        "Group": "jojo"
      },
      {
        "Name": "ProtonMail 123",
        "Address": "test2+test@protonmail.com",
        "Group": "jojo"
      },
      {
        "Name": "kkok",
        "Address": "test2+kkok@pm.me",
        "Group": "jojo"
      },
      {
        "Name": "‹awesome",
        "Address": "test2+awesome@protonmail.com",
        "Group": "jojo"
      }
    ],
    "LAfAt3tFgqqbm2pXV2l8Z6QWzD3i_IcCKpWsGw5wvca-fgGf5qQyJX8_SfquNCbLCwE_ILDt1wohWpQ9LYNbGg==": [
      {
        "Name": "jeja",
        "Address": "test2+kirikou@protonmail.com",
        "Group": "lol2"
      }
    ]
  }
};

const MOCK_CONTACT_EMAILS = Object.keys(MAPS.MAP_GROUP_EMAILS)
    .reduce((acc, ID) => {
        const list = _.map(MAPS.MAP_GROUP_EMAILS[ID], 'Address');
        acc[list.toString()] = ID;
        return acc;
    }, Object.create(null));

export const input = { list, MessageID };
export const details = {
    exportGroupSelection,
    MAPS: {
        ...MAPS,
        MOCK_CONTACT_EMAILS
    }
};
