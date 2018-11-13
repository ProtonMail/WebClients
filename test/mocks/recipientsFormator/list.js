const list = [
    {
      "Name": "Jeanne",
      "Address": "test2+jeanne@protonmail.com",
      "Group": "OK"
    },
    {
      "Name": "Jean roger sur seine",
      "Address": "testdew@protonmail.com",
      "Group": "OK"
    },
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
    },
    {
      "Name": "jeja",
      "Address": "test2+kirikou@protonmail.com",
      "Group": "lol2"
    },
    {
      "Name": "pedro@protonmail.com",
      "Address": "pedro@protonmail.com",
      "Group": ""
    },
    {
      "Name": "Neilerua",
      "Address": "test1@protonmail.com",
      "Group": ""
    }
];

const MessageID = "OToREB-1fGGuOD1Kt94fpJIJalIvpZhaWfjwKDjvV1CJ9aZXEynu7vmfJ8_71fpHUZxgN1ZiZKPxEL4RbOZvrA==";


export const input = { list, MessageID };


export const output = [
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

const groupStore = {
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
  };

const MAP_NAME_ID = Object.keys(groupStore)
  .reduce((acc, ID) => {
    const [ { Group } ] = groupStore[ID];
    acc[Group] = ID;
    return acc;
  }, {});

const groupModel = (group) => {
  return {
    "ID": MAP_NAME_ID[group],
    "Name": group,
    "Color": "#9b94d1",
    "Display": 0,
    "Order": 1,
    "Type": 2,
    "Exclusive": 0,
    "Notify": 0,
    "notify": false
  };
}

export const details = {
  MAPS: { groupStore, MAP_NAME_ID },
  groupModel
};
