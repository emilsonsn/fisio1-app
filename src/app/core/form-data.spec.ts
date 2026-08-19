import { toFormData } from './form-data';

describe('toFormData', () => {
  it('serializes booleans and arrays for Laravel requests', () => {
    const form = toFormData({ is_active: false, access_group_ids: [1, 3] });
    expect(form.get('is_active')).toBe('0');
    expect(form.getAll('access_group_ids[]')).toEqual(['1', '3']);
  });
});
