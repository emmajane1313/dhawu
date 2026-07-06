import { PersonNumber } from "../core/types";

export function expandInclusiveExclusive(persons: PersonNumber[]): PersonNumber[] {
  const expanded = new Set<PersonNumber>();
  for (const person of persons) {
    expanded.add(person);
    if (person === "1+2_Plur") {
      expanded.add("1+3_Plur");
    }
    if (person === "1+2_Dual") {
      expanded.add("1+3_Dual");
    }
  }
  return Array.from(expanded);
}
