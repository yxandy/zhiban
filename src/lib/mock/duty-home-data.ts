export type DutyOverviewItem = {
  id: number;
  unitName: string;
  unitSlug: string;
  leaderName: string;
  leaderPhone?: string;
  middleManagerName: string;
  middleManagerPhone?: string;
  staffName: string;
  staffPhone?: string;
  accentColor: string;
};

export type DutyDayRecord = {
  date: string;
  label: string;
  monthLabel: string;
  overviewItems: DutyOverviewItem[];
};

export type DutyContactItem = {
  id: number;
  departmentName: string;
  personName: string;
  phone?: string;
  mobilePhone?: string;
  landlineType?: "internal" | "landline" | "none";
  landlinePhone?: string;
  statusTag?: "shutdown";
};

export type DutyContactGroup = {
  departmentName: string;
  contacts: DutyContactItem[];
};

export type DutyUnitDetailRecord = {
  date: string;
  unitSlug: string;
  unitName: string;
  groups: DutyContactGroup[];
};

export const dutyDayRecords: DutyDayRecord[] = [
  {
    date: "2026-04-10",
    label: "2026年4月10日",
    monthLabel: "2026年4月",
    overviewItems: [
      {
        id: 1,
        unitName: "路桥运营事业部",
        unitSlug: "luqiao-yunying",
        leaderName: "范文东",
        leaderPhone: "18660196617",
        middleManagerName: "白雪倩",
        middleManagerPhone: "15668177521",
        staffName: "杨洋",
        staffPhone: "",
        accentColor: "#2c7fb8",
      },
      {
        id: 2,
        unitName: "工程建设事业部",
        unitSlug: "gongcheng-jianshe",
        leaderName: "孙乔吉",
        leaderPhone: "",
        middleManagerName: "张敏",
        middleManagerPhone: "",
        staffName: "韩超",
        staffPhone: "",
        accentColor: "#d47b2a",
      },
      {
        id: 3,
        unitName: "综合管理部",
        unitSlug: "zonghe-guanli",
        leaderName: "王昊",
        leaderPhone: "",
        middleManagerName: "刘婷",
        middleManagerPhone: "",
        staffName: "吴书昌",
        staffPhone: "",
        accentColor: "#5c8a5b",
      },
    ],
  },
  {
    date: "2026-04-11",
    label: "2026年4月11日",
    monthLabel: "2026年4月",
    overviewItems: [
      {
        id: 1,
        unitName: "路桥运营事业部",
        unitSlug: "luqiao-yunying",
        leaderName: "王昊",
        leaderPhone: "",
        middleManagerName: "宋雪",
        middleManagerPhone: "",
        staffName: "陈龙",
        staffPhone: "",
        accentColor: "#2c7fb8",
      },
      {
        id: 2,
        unitName: "工程建设事业部",
        unitSlug: "gongcheng-jianshe",
        leaderName: "高翔",
        leaderPhone: "",
        middleManagerName: "李娜",
        middleManagerPhone: "",
        staffName: "张晨",
        staffPhone: "",
        accentColor: "#d47b2a",
      },
      {
        id: 3,
        unitName: "综合管理部",
        unitSlug: "zonghe-guanli",
        leaderName: "段锐",
        leaderPhone: "",
        middleManagerName: "郭静",
        middleManagerPhone: "",
        staffName: "许峰",
        staffPhone: "",
        accentColor: "#5c8a5b",
      },
    ],
  },
];

export const dutyUnitDetailRecords: DutyUnitDetailRecord[] = [
  {
    date: "2026-04-10",
    unitSlug: "luqiao-yunying",
    unitName: "路桥运营事业部",
    groups: [
      {
        departmentName: "运营调度中心",
        contacts: [
          {
            id: 1,
            departmentName: "运营调度中心",
            personName: "范文东",
            phone: "18660196617",
            mobilePhone: "18660196617",
            landlineType: "landline",
            landlinePhone: "0531-88990011",
          },
          {
            id: 2,
            departmentName: "运营调度中心",
            personName: "白雪倩",
            phone: "15668177521",
            mobilePhone: "15668177521",
            landlineType: "internal",
            landlinePhone: "262751",
          },
        ],
      },
      {
        departmentName: "收费管理科",
        contacts: [
          {
            id: 3,
            departmentName: "收费管理科",
            personName: "杨洋",
            phone: "",
            landlineType: "none",
          },
        ],
      },
      {
        departmentName: "平原南站",
        contacts: [
          {
            id: 4,
            departmentName: "平原南站",
            personName: "",
            statusTag: "shutdown",
          },
        ],
      },
    ],
  },
  {
    date: "2026-04-11",
    unitSlug: "luqiao-yunying",
    unitName: "路桥运营事业部",
    groups: [
      {
        departmentName: "运营调度中心",
        contacts: [
          { id: 5, departmentName: "运营调度中心", personName: "王昊", phone: "" },
          { id: 6, departmentName: "运营调度中心", personName: "宋雪", phone: "" },
        ],
      },
      {
        departmentName: "收费管理科",
        contacts: [{ id: 7, departmentName: "收费管理科", personName: "陈龙", phone: "" }],
      },
    ],
  },
];

export function getDutyDayRecord(date?: string) {
  if (!date) {
    return dutyDayRecords[0];
  }

  return dutyDayRecords.find((record) => record.date === date) ?? dutyDayRecords[0];
}

export function getDutyUnitDetailRecord(unitSlug: string, date?: string) {
  const targetDate = date ?? dutyDayRecords[0]?.date;

  return (
    dutyUnitDetailRecords.find((record) => record.unitSlug === unitSlug && record.date === targetDate) ?? null
  );
}
