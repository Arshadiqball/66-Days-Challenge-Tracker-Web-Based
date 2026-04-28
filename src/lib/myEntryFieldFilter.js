/** Labels removed from My Entry (legacy custom fields). Match is case-insensitive; trailing ":" ignored. */
const HIDDEN_MY_ENTRY_LABELS = new Set([
  "today's action item",
  "today's short challenge",
]);

export function normalizeMyEntryFieldLabel(label) {
  return String(label || '')
    .replace(/:\s*$/g, '')
    .trim()
    .toLowerCase();
}

export function shouldShowMyEntryCustomField(field) {
  return !HIDDEN_MY_ENTRY_LABELS.has(normalizeMyEntryFieldLabel(field.field_label));
}
