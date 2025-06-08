/**
 * Computes the percentage of occurrences of a specific value in an array
 * @param values - Array of values to analyze
 * @param targetValue - The value to count occurrences for
 * @returns The percentage (0-100) of occurrences of the target value
 */
export const computePercentage = (values: string[], targetValue: string): number => {
  if (!values?.length) {
    return 0;
  }
  const totalValues = values.length;
  const targetCount = values.filter(value => value === targetValue).length;
  return Math.floor((targetCount / totalValues) * 100);
}; 