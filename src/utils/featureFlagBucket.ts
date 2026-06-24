// MurmurHash3 32-bit — matches the Kotlin FeatureFlagClient bucket algorithm exactly.
const encoder = new TextEncoder();
function murmur3(key: string, seed = 0): number {
  const data = encoder.encode(key);
  const len = data.length;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  let h1 = seed;

  const numBlocks = Math.trunc(len / 4);
  for (let i = 0; i < numBlocks; i++) {
    const b = i * 4;
    let k1 = data[b] | (data[b + 1] << 8) | (data[b + 2] << 16) | (data[b + 3] << 24);
    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);
    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    // | 0 is signed int32 wrapping (not truncation) — Math.trunc would be wrong here
    h1 = (Math.imul(h1, 5) + -430675100) | 0; // eslint-disable-line unicorn/prefer-math-trunc
  }

  const tail = numBlocks * 4;
  const rem = len & 3;
  if (rem > 0) {
    let k1 = 0;
    if (rem >= 3) k1 ^= data[tail + 2] << 16;
    if (rem >= 2) k1 ^= data[tail + 1] << 8;
    k1 ^= data[tail];
    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);
    h1 ^= k1;
  }

  h1 ^= len;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;
  return h1;
}

export function bucket(flagName: string, userId: string): number {
  return (murmur3(`${flagName}:${userId}`) & 0x7fffffff) % 100;
}
