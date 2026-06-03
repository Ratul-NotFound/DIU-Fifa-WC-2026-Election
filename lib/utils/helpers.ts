/** Validate @diu.edu.bd email */
export function isDIUEmail(email: string): boolean {
  return email.toLowerCase().endsWith('@diu.edu.bd');
}

/** Format a timestamp (ms) to a readable date string */
export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Format a timestamp (ms) to a readable date+time string */
export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Convert vote counts to percentages */
export function calcPercentage(votes: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((votes / total) * 100);
}

/** Truncate long text */
export function truncate(text: string, max = 80): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

/** Generate a key from teamId + positionId */
export function voteKey(teamId: string, positionId: string): string {
  return `${teamId}_${positionId}`;
}

/** Election status display label */
export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: 'Draft',
    live: 'Live — Voting Open',
    counting: 'Counting Votes',
    finished: 'Results Published',
  };
  return map[status] ?? status;
}

/** Return the country flag image URL from flagcdn */
export function getTeamFlagUrl(flag: string): string {
  if (!flag) return 'https://flagcdn.com/w160/un.png';
  
  // If it's already a URL, return it directly
  if (flag.startsWith('http://') || flag.startsWith('https://')) {
    return flag;
  }
  
  // Clean emoji or shortcode
  const clean = flag.trim();
  
  // Map emoji flags or names to codes
  const map: Record<string, string> = {
    // Emojis
    '🇲🇽': 'mx', '🇨🇦': 'ca', '🇿🇦': 'za', '🇰🇷': 'kr', '🇵🇾': 'py',
    '🇩🇪': 'de', '🇳🇱': 'nl', '🇧🇪': 'be', '🇪🇸': 'es', '🇵🇹': 'pt',
    '🇧🇷': 'br', '🇦🇷': 'ar', '🇫🇷': 'fr', '🏴󠁧󠁢󠁥󠁮󠁧󠁿': 'gb-eng', '🇲🇦': 'ma',
    // Lowercase names
    'mexico': 'mx', 'canada': 'ca', 'south africa': 'za', 'south korea': 'kr',
    'paraguay': 'py', 'germany': 'de', 'netherlands': 'nl', 'belgium': 'be',
    'spain': 'es', 'portugal': 'pt', 'brazil': 'br', 'argentina': 'ar',
    'france': 'fr', 'england': 'gb-eng', 'morocco': 'ma'
  };
  
  if (map[clean]) return `https://flagcdn.com/w160/${map[clean]}.png`;
  
  const code = clean.toLowerCase();
  if (map[code]) return `https://flagcdn.com/w160/${map[code]}.png`;
  
  // Fallback direct flagcdn matching for codes
  return `https://flagcdn.com/w160/${code}.png`;
}

/** Return a solid country-accent theme color by team name */
export function getTeamAccentColor(name: string): string {
  if (!name) return '#2563eb';
  
  const map: Record<string, string> = {
    'mexico': '#1b4332',
    'canada': '#c8102e',
    'south africa': '#007a4d',
    'south korea': '#0f2042',
    'paraguay': '#0038a8',
    'germany': '#111111',
    'netherlands': '#ff4f00',
    'belgium': '#2d2d2d',
    'spain': '#ad1519',
    'portugal': '#7f0e1c',
    'brazil': '#009739',
    'argentina': '#75aadb',
    'france': '#002395',
    'england': '#ffffff',
    'morocco': '#c1272d'
  };
  
  const clean = name.toLowerCase().replace(/\s*\(co-host\)/gi, '').trim();
  return map[clean] ?? '#2563eb';
}
