export interface DSPDayRow {
  date: string;
  brand: string;
  spend: number;
  impressions: number;
  ctr: number;
  dpv: number;
  atc: number;
  purchases: number;
  ntbPurchases: number;
  ntbPercent: number;
  sales: number;
  ntbSales: number;
  totalDPV: number;
  totalATC: number;
  totalPurchases: number;
  totalNTBPurchases: number;
  totalNTBPercent: number;
  totalSales: number;
  totalROAS: number;
  totalNTBSales: number;
}

export interface DSPSummary {
  brand: string;
  dateRange: { start: string; end: string };
  totalSpend: number;
  totalImpressions: number;
  avgCTR: number;
  totalDPV: number;
  totalATC: number;
  totalPurchases: number;
  totalNTBPurchases: number;
  avgNTBPercent: number;
  totalSales: number;
  totalNTBSales: number;
  overallROAS: number;
  avgDailySpend: number;
  rows: DSPDayRow[];
}

function cleanNum(val: string): number {
  return parseFloat(val.replace(/[,"$%=""]/g, '')) || 0;
}

function cleanPct(val: string): number {
  return parseFloat(val.replace(/["%]/g, '')) || 0;
}

export function parseDSPReport(csvText: string): DSPSummary {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

  const rows: DSPDayRow[] = lines.slice(1).map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQuotes = !inQuotes; }
      else if (c === ',' && !inQuotes) { values.push(current); current = ''; }
      else { current += c; }
    }
    values.push(current);

    return {
      date: values[0]?.trim() || '',
      brand: values[1]?.trim() || '',
      spend: cleanNum(values[3] || '0'),
      impressions: cleanNum(values[4] || '0'),
      ctr: cleanPct(values[5] || '0'),
      dpv: cleanNum(values[6] || '0'),
      atc: cleanNum(values[7] || '0'),
      purchases: cleanNum(values[8] || '0'),
      ntbPurchases: cleanNum(values[9] || '0'),
      ntbPercent: cleanPct(values[10] || '0'),
      sales: cleanNum(values[11] || '0'),
      ntbSales: cleanNum(values[12] || '0'),
      totalDPV: cleanNum(values[13] || '0'),
      totalATC: cleanNum(values[14] || '0'),
      totalPurchases: cleanNum(values[15] || '0'),
      totalNTBPurchases: cleanNum(values[16] || '0'),
      totalNTBPercent: cleanPct(values[18] || '0'),
      totalSales: cleanNum(values[19] || '0'),
      totalROAS: cleanNum(values[20] || '0'),
      totalNTBSales: cleanNum(values[21] || '0'),
    };
  });

  const totalSpend = rows.reduce((s, r) => s + r.spend, 0);
  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);
  const totalDPV = rows.reduce((s, r) => s + r.dpv, 0);
  const totalATC = rows.reduce((s, r) => s + r.atc, 0);
  const totalPurchases = rows.reduce((s, r) => s + r.purchases, 0);
  const totalNTBPurchases = rows.reduce((s, r) => s + r.ntbPurchases, 0);
  const totalSales = rows.reduce((s, r) => s + r.sales, 0);
  const totalNTBSales = rows.reduce((s, r) => s + r.ntbSales, 0);
  const avgCTR = rows.reduce((s, r) => s + r.ctr, 0) / rows.length;
  const avgNTBPercent = rows.reduce((s, r) => s + r.ntbPercent, 0) / rows.length;

  return {
    brand: rows[0]?.brand || 'Unknown',
    dateRange: {
      start: rows[0]?.date || '',
      end: rows[rows.length - 1]?.date || '',
    },
    totalSpend,
    totalImpressions,
    avgCTR,
    totalDPV,
    totalATC,
    totalPurchases,
    totalNTBPurchases,
    avgNTBPercent,
    totalSales,
    totalNTBSales,
    overallROAS: totalSpend > 0 ? totalSales / totalSpend : 0,
    avgDailySpend: totalSpend / rows.length,
    rows,
  };
}
