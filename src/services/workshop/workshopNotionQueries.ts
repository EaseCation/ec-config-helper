export const NOTION_DATABASE_WORKSHOP = '6bde2c7f-f62f-4c8a-ad5b-b503eb706164';

/**
 * 对应 PHP中 WORKSHOP_TYPES 的每个 typeId -> filter & sorts
 */
export const WORKSHOP_TYPES: Record<
  string,
  {
    filter: any;
    sorts: { property: string; direction: 'ascending' | 'descending' }[];
  }
> = {
  addition: {
    filter: {
      property: '类型',
      relation: {
        contains: '35ffa49ebb934d5bbb589529955df2e0'
      }
    },
    sorts: [
      {
        property: '稀有度（新）',
        direction: 'ascending'
      }
    ]
  },
  key: {
    filter: {
      property: '类型',
      relation: {
        contains: 'd63cf2ada66c4431898da85166758d42'
      }
    },
    sorts: [
      {
        property: '稀有度（新）',
        direction: 'ascending'
      }
    ]
  },
  prefix: {
    filter: {
      property: '类型',
      relation: {
        contains: '46ea69daf86444878ae92a5e1cc3e8d8'
      }
    },
    sorts: [
      {
        property: '稀有度（新）',
        direction: 'ascending'
      },
      {
        property: 'idItem',
        direction: 'ascending'
      }
    ]
  },
  music: {
    filter: {
      property: '类型',
      relation: {
        contains: '9358310ccf1d41cb85b62b945abbdaca'
      }
    },
    sorts: [
      {
        property: '稀有度（新）',
        direction: 'ascending'
      }
    ]
  },
  pet: {
    filter: {
      property: '类型',
      relation: {
        contains: '1b7e1ccae30f4b46966bb3f29181a93c'
      }
    },
    sorts: [
      {
        property: '稀有度（新）',
        direction: 'ascending'
      },
      {
        property: 'idItem',
        direction: 'ascending'
      }
    ]
  },
  'attack-eff': {
    filter: {
      property: '类型',
      relation: {
        contains: 'a8815038e47b4ca99cbe099c3034f90d'
      }
    },
    sorts: [
      {
        property: '稀有度（新）',
        direction: 'ascending'
      }
    ]
  },
  resourcepack: {
    filter: {
      property: '类型',
      relation: {
        contains: '03186d3ad6b14fb58b65654bb6f23b00'
      }
    },
    sorts: [
      {
        property: '稀有度（新）',
        direction: 'ascending'
      }
    ]
  },
  'resourcepack.aim': {
    filter: {
      property: '类型',
      relation: {
        contains: 'ca76b9a7d8ec4f5eb04121b87234ee8e'
      }
    },
    sorts: [
      {
        property: '名称',
        direction: 'ascending'
      }
    ]
  },
  zb: {
    filter: {
      property: '类型',
      relation: {
        contains: '1a0616197f0b4c9e891ad2405ac8c95a'
      }
    },
    sorts: [
      {
        property: '稀有度（新）',
        direction: 'ascending'
      }
    ]
  },
  deathshow: {
    filter: {
      property: '类型',
      relation: {
        contains: 'ec6ac49b81fe4c39ac7bc1baa40d00dd'
      }
    },
    sorts: [
      {
        property: '稀有度（新）',
        direction: 'ascending'
      }
    ]
  },
  'ornament.suit': {
    filter: {
      and: [
        {
          property: '类型',
          relation: {
            contains: 'e996be9a734c460f8b85967b8ae8450c'
          }
        },
        {
          property: '4D装扮部位',
          select: {
            equals: '套装'
          }
        }
      ]
    },
    sorts: [
      {
        property: '稀有度（新）',
        direction: 'ascending'
      }
    ]
  },
  'ornament.prefix': {
    filter: {
      and: [
        {
          property: '类型',
          relation: {
            contains: 'e996be9a734c460f8b85967b8ae8450c'
          }
        },
        {
          property: '4D装扮部位',
          select: {
            equals: '4D称号'
          }
        }
      ]
    },
    sorts: [
      {
        property: '稀有度（新）',
        direction: 'ascending'
      }
    ]
  },
  'ornament.head': {
    filter: {
      and: [
        {
          property: '类型',
          relation: {
            contains: 'e996be9a734c460f8b85967b8ae8450c'
          }
        },
        {
          property: '4D装扮部位',
          select: {
            equals: '头饰'
          }
        }
      ]
    },
    sorts: [
      {
        property: '稀有度（新）',
        direction: 'ascending'
      }
    ]
  },
  'ornament.body': {
    filter: {
      and: [
        {
          property: '类型',
          relation: {
            contains: 'e996be9a734c460f8b85967b8ae8450c'
          }
        },
        {
          property: '4D装扮部位',
          select: {
            equals: '服饰'
          }
        }
      ]
    },
    sorts: [
      {
        property: '稀有度（新）',
        direction: 'ascending'
      }
    ]
  },
  'ornament.leftarm': {
    filter: {
      and: [
        {
          property: '类型',
          relation: {
            contains: 'e996be9a734c460f8b85967b8ae8450c'
          }
        },
        {
          property: '4D装扮部位',
          select: {
            equals: '左手'
          }
        }
      ]
    },
    sorts: [
      {
        property: '稀有度（新）',
        direction: 'ascending'
      }
    ]
  },
  'ornament.rightarm': {
    filter: {
      and: [
        {
          property: '类型',
          relation: {
            contains: 'e996be9a734c460f8b85967b8ae8450c'
          }
        },
        {
          property: '4D装扮部位',
          select: {
            equals: '右手'
          }
        }
      ]
    },
    sorts: [
      {
        property: '稀有度（新）',
        direction: 'ascending'
      }
    ]
  },
  'ornament.back': {
    filter: {
      and: [
        {
          property: '类型',
          relation: {
            contains: 'e996be9a734c460f8b85967b8ae8450c'
          }
        },
        {
          property: '4D装扮部位',
          select: {
            equals: '背饰'
          }
        }
      ]
    },
    sorts: [
      {
        property: '稀有度（新）',
        direction: 'ascending'
      }
    ]
  },
  'ornament.wings': {
    filter: {
      and: [
        {
          property: '类型',
          relation: {
            contains: 'e996be9a734c460f8b85967b8ae8450c'
          }
        },
        {
          property: '4D装扮部位',
          select: {
            equals: '翅膀'
          }
        }
      ]
    },
    sorts: [
      {
        property: '稀有度（新）',
        direction: 'ascending'
      }
    ]
  },
  'ornament.halo': {
    filter: {
      and: [
        {
          property: '类型',
          relation: {
            contains: 'e996be9a734c460f8b85967b8ae8450c'
          }
        },
        {
          property: '4D装扮部位',
          select: {
            equals: '脚底光环'
          }
        }
      ]
    },
    sorts: [
      {
        property: '稀有度（新）',
        direction: 'ascending'
      }
    ]
  },
  'ornament.skin': {
    filter: {
      and: [
        {
          property: '类型',
          relation: {
            contains: 'e996be9a734c460f8b85967b8ae8450c'
          }
        },
        {
          property: '4D装扮部位',
          select: {
            equals: '皮肤'
          }
        }
      ]
    },
    sorts: [
      {
        property: '稀有度（新）',
        direction: 'ascending'
      }
    ]
  },
  'weaponskin.diamond-sword': {
    filter: {
      and: [
        {
          property: '类型',
          relation: {
            contains: '865041dfed424188b8ed42664f19ee1d'
          }
        },
        {
          property: 'idItem',
          rich_text: {
            starts_with: 'diamond-sword.'
          }
        }
      ]
    },
    sorts: [
      {
        property: '稀有度（新）',
        direction: 'descending'
      },
      {
        property: 'idItem',
        direction: 'ascending'
      }
    ]
  },
  'weaponskin.diamond-axe': {
    filter: {
      and: [
        {
          property: '类型',
          relation: {
            contains: '865041dfed424188b8ed42664f19ee1d'
          }
        },
        {
          property: 'idItem',
          rich_text: {
            starts_with: 'diamond-axe.'
          }
        }
      ]
    },
    sorts: [
      {
        property: '稀有度（新）',
        direction: 'descending'
      },
      {
        property: 'idItem',
        direction: 'ascending'
      }
    ]
  },
  'weaponskin.diamond-pickaxe': {
    filter: {
      and: [
        {
          property: '类型',
          relation: {
            contains: '865041dfed424188b8ed42664f19ee1d'
          }
        },
        {
          property: 'idItem',
          rich_text: {
            starts_with: 'diamond-pickaxe.'
          }
        }
      ]
    },
    sorts: [
      {
        property: '稀有度（新）',
        direction: 'descending'
      },
      {
        property: 'idItem',
        direction: 'ascending'
      }
    ]
  }
};