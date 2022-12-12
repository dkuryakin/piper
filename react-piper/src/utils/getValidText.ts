export const getValidText = (str: string): string => {
  return str.replace(/[^a-zA-Z0-9-_]/g, "");
};
