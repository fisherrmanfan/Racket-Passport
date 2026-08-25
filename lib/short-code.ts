/**
 * Racket short codes (BACKEND doc §11.1).
 *
 * Crockford base32 minus I, L, O and U — the first three are misread off a
 * sweated-on sticker, the last one keeps accidental profanity out of a code a
 * customer reads aloud. Minted once at racket creation and permanent for the
 * racket's life: the sticker outlives the data.
 */

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const LENGTH = 8

export function mintShortCode(taken: Iterable<string> = []): string {
  const used = new Set(taken)
  // Collision at 32^8 is vanishingly unlikely, but a mint that can silently
  // duplicate a permanent identifier is not one to leave unguarded.
  for (let attempt = 0; attempt < 12; attempt++) {
    const code = randomCode()
    if (!used.has(code)) return code
  }
  throw new Error('Could not mint a unique short code')
}

function randomCode(): string {
  const bytes = new Uint8Array(LENGTH)
  crypto.getRandomValues(bytes)
  let code = ''
  for (const byte of bytes) code += ALPHABET[byte % ALPHABET.length]
  return code
}

/** Codes are read off stickers, so accept lowercase and the ambiguous glyphs. */
export function normaliseShortCode(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[IL]/g, '1')
    .replace(/O/g, '0')
    .replace(/U/g, 'V')
    .replace(/[^0-9A-Z]/g, '')
}
