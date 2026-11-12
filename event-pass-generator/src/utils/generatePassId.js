/**
 * Generates a unique pass ID in the format EVT-YYYY-XXXXX.
 *
 * @param {string[]} existingIds - IDs already in use (to avoid duplicates)
 * @returns {string} a unique pass ID
 *
 * Concepts used: pure utility function, string building, randomness, loop.
 */
export function generatePassId(existingIds = []) {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id;
  let attempts = 0;

  // Keep generating until the ID is unique (or we give up after 1000 tries)
  do {
    const suffix = Array.from({ length: 5 }, () => {
      return chars[Math.floor(Math.random() * chars.length)];
    }).join('');
    id = `EVT-${year}-${suffix}`;
    attempts += 1;
  } while (existingIds.includes(id) && attempts < 1000);

  return id;
}
