export function toFormData(
  payload: object,
  files: File[] = [],
  fileKey = 'attachments[]',
): FormData {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => form.append(`${key}[]`, String(item)));
    else if (typeof value === 'boolean') form.append(key, value ? '1' : '0');
    else if (value !== null && value !== undefined) form.append(key, String(value));
  });
  files.forEach((file) => form.append(fileKey, file));
  return form;
}
