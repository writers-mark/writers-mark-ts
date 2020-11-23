/**
 * Returns wether a given property value is acceptable for the given property.
 *
 * @param property The name of the property
 * @param value The value we want to assign to the property.
 */
export const allowValue = (property: string, value: string): boolean => {
  // Santitze "dangerous" characters,
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    //                                      "              '              :              ;              \
    if (code < 32 || code > 126 || code === 34 || code === 39 || code === 58 || code === 59 || code === 92) {
      return false;
    }
  }

  // Any and all reference to urls are disallowed in values.
  if (value.indexOf('url(') !== -1) {
    return false;
  }

  return true;
};
