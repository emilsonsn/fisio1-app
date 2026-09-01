import { formatDateBr } from './date-format';

describe('formatDateBr', () => {
  it('formats API date-only values without a timezone shift', () => {
    expect(formatDateBr('2026-09-01')).toBe('01/09/2026');
  });

  it('uses a neutral placeholder when the date is absent', () => {
    expect(formatDateBr(null)).toBe('—');
  });
});
