export const formatNPR = (value) => `रु. ${Number(value).toLocaleString('en-IN')}`;

export const formatKg = (value) => `${Number(value).toFixed(1)} kg`;

export const getTrendArrow = (trend) => {
  if (trend === 'up') return '↑';
  if (trend === 'down') return '↓';
  return '→';
};
