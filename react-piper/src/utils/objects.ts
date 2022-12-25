export const objectSetOrExcludeField = (
  obj: object,
  field: string,
  value: any
): object => {
  if (value) {
    return { ...obj, [field]: value };
  }
  const _obj: { [index: string]: any } = { ...obj };
  delete _obj[field];
  return _obj;
};
