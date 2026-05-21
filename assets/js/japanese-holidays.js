(() => {
  const cache = new Map();

  const pad = (n) => String(n).padStart(2, '0');

  const toKey = (year, month, day) => `${year}-${pad(month)}-${pad(day)}`;

  const parseKey = (key) => {
    const [year, month, day] = key.split('-').map(Number);
    return { year, month, day };
  };

  const toDate = (key) => {
    const { year, month, day } = parseKey(key);
    return new Date(year, month - 1, day);
  };

  const addDaysKey = (key, days) => {
    const date = toDate(key);
    date.setDate(date.getDate() + days);
    return toKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
  };

  const nthWeekday = (year, month, weekday, nth) => {
    const lastDay = new Date(year, month, 0).getDate();
    let count = 0;

    for (let day = 1; day <= lastDay; day += 1) {
      if (new Date(year, month - 1, day).getDay() === weekday) {
        count += 1;
        if (count === nth) return day;
      }
    }

    return null;
  };

  const vernalEquinoxDay = (year) => {
    if (year >= 1980 && year <= 2099) {
      return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
    }
    return 20;
  };

  const autumnalEquinoxDay = (year) => {
    if (year >= 1980 && year <= 2099) {
      return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
    }
    return 23;
  };

  const setHoliday = (map, year, month, day, name) => {
    if (!day) return;
    const key = toKey(year, month, day);
    map.set(key, map.has(key) ? `${map.get(key)}・${name}` : name);
  };

  const buildBaseHolidays = (year) => {
    const map = new Map();

    setHoliday(map, year, 1, 1, '元日');
    setHoliday(map, year, 1, nthWeekday(year, 1, 1, 2), '成人の日');
    setHoliday(map, year, 2, 11, '建国記念の日');

    if (year >= 2020) {
      setHoliday(map, year, 2, 23, '天皇誕生日');
    } else if (year >= 1989 && year <= 2018) {
      setHoliday(map, year, 12, 23, '天皇誕生日');
    }

    setHoliday(map, year, 3, vernalEquinoxDay(year), '春分の日');
    setHoliday(map, year, 4, 29, '昭和の日');
    setHoliday(map, year, 5, 3, '憲法記念日');
    setHoliday(map, year, 5, 4, 'みどりの日');
    setHoliday(map, year, 5, 5, 'こどもの日');
    setHoliday(map, year, 7, nthWeekday(year, 7, 1, 3), '海の日');
    setHoliday(map, year, 8, 11, '山の日');
    setHoliday(map, year, 9, nthWeekday(year, 9, 1, 3), '敬老の日');
    setHoliday(map, year, 9, autumnalEquinoxDay(year), '秋分の日');
    setHoliday(map, year, 10, nthWeekday(year, 10, 1, 2), 'スポーツの日');
    setHoliday(map, year, 11, 3, '文化の日');
    setHoliday(map, year, 11, 23, '勤労感謝の日');

    return map;
  };

  const applySubstituteHolidays = (holidays) => {
    [...holidays.keys()].forEach((key) => {
      if (toDate(key).getDay() !== 0) return;

      const name = holidays.get(key);
      let cursor = addDaysKey(key, 1);

      while (holidays.has(cursor)) {
        cursor = addDaysKey(cursor, 1);
      }

      holidays.set(cursor, `振替休日（${name}）`);
    });
  };

  const applyBridgeHolidays = (year, holidays) => {
    for (let month = 1; month <= 12; month += 1) {
      const lastDay = new Date(year, month, 0).getDate();

      for (let day = 1; day <= lastDay; day += 1) {
        const key = toKey(year, month, day);
        if (holidays.has(key)) continue;

        const weekday = new Date(year, month - 1, day).getDay();
        if (weekday === 0 || weekday === 6) continue;

        const prev = addDaysKey(key, -1);
        const next = addDaysKey(key, 1);

        if (holidays.has(prev) && holidays.has(next)) {
          holidays.set(key, '国民の休日');
        }
      }
    }
  };

  const getHolidaysForYear = (year) => {
    if (cache.has(year)) return cache.get(year);

    const holidays = buildBaseHolidays(year);
    applySubstituteHolidays(holidays);
    applyBridgeHolidays(year, holidays);
    cache.set(year, holidays);
    return holidays;
  };

  const getHoliday = (key) => {
    const { year } = parseKey(key);
    return getHolidaysForYear(year).get(key) || null;
  };

  window.JapaneseHolidays = {
    getHoliday,
    getHolidaysForYear,
  };
})();
