type ClassValue = string | false | null | undefined;

/** Joins the class names that survive a condition. */
export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
