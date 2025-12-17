/**
 * Check if a password has been exposed in known data breaches
 * Uses the HaveIBeenPwned API with k-anonymity (only sends first 5 chars of SHA-1 hash)
 */

async function sha1Hash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export async function isPasswordBreached(password: string): Promise<{ breached: boolean; count?: number }> {
  try {
    const hash = await sha1Hash(password);
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'Add-Padding': 'true', // Adds padding to prevent response length analysis
      },
    });

    if (!response.ok) {
      console.error('HaveIBeenPwned API error:', response.status);
      return { breached: false }; // Fail open to not block users
    }

    const text = await response.text();
    const lines = text.split('\n');

    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        return { breached: true, count: parseInt(count.trim(), 10) };
      }
    }

    return { breached: false };
  } catch (error) {
    console.error('Password breach check failed:', error);
    return { breached: false }; // Fail open to not block users
  }
}
