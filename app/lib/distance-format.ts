const KM = 1e3;
const AU = 1.496e11;
const LY = 9.461e15;

interface FormattedDistance {
  value: string;
  unit: string;
  full: string;
}

export function formatDistance(distanceM: number): FormattedDistance {
  // < 1,000km → km
  if (distanceM < 1e6) {
    const km = distanceM / KM;
    return fmt(km, "km");
  }

  // < 0.01AU → 万km
  if (distanceM < 0.01 * AU) {
    const manKm = distanceM / KM / 1e4;
    return fmt(manKm, "万km");
  }

  // < 100AU → AU
  if (distanceM < 100 * AU) {
    const au = distanceM / AU;
    return fmt(au, "AU");
  }

  // < 1光年 → 光時/光分
  if (distanceM < 1 * LY) {
    const lightHours = distanceM / (2.998e8 * 3600);
    if (lightHours < 1) {
      const lightMin = lightHours * 60;
      return fmt(lightMin, "光分");
    }
    return fmt(lightHours, "光時");
  }

  // < 1,000光年 → 光年
  if (distanceM < 1e3 * LY) {
    const ly = distanceM / LY;
    return fmt(ly, "光年");
  }

  // < 100万光年 → 万光年
  if (distanceM < 1e6 * LY) {
    const manLy = distanceM / LY / 1e4;
    return fmt(manLy, "万光年");
  }

  // < 10億光年 → 万/億光年
  if (distanceM < 1e9 * LY) {
    const okuLy = distanceM / LY;
    if (okuLy < 1e8) {
      return fmt(okuLy / 1e4, "万光年");
    }
    return fmt(okuLy / 1e8, "億光年");
  }

  // ≥ 10億光年 → 億光年
  const okuLy = distanceM / LY / 1e8;
  return fmt(okuLy, "億光年");
}

function fmt(value: number, unit: string): FormattedDistance {
  let v: string;
  if (value >= 100) {
    v = value.toFixed(0);
  } else if (value >= 10) {
    v = value.toFixed(1);
  } else {
    v = value.toFixed(2);
  }
  // remove trailing zeros after decimal
  if (v.includes(".")) {
    v = v.replace(/\.?0+$/, "");
  }
  return { value: v, unit, full: `${v}${unit}` };
}
