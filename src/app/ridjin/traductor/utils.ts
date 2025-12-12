export function generateCombinations<T>(optionsPerSlot: T[][]): T[][] {
  if (optionsPerSlot.length === 0) return [[]];

  let combinations: T[][] = [[]];
  for (const options of optionsPerSlot) {
    const newCombinations: T[][] = [];
    for (const combo of combinations) {
      for (const option of options) {
        newCombinations.push([...combo, option]);
      }
    }
    combinations = newCombinations;
  }
  return combinations;
}
