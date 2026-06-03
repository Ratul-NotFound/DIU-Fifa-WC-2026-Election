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

/** Return a national color-based gradient for team cards */
export function getTeamGradient(name: string): string {
  if (!name) return 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
  
  const map: Record<string, string> = {
    'mexico': 'linear-gradient(135deg, #006847 0%, #ffffff 50%, #ce1126 100%)',
    'canada': 'linear-gradient(135deg, #c8102e 0%, #ffffff 50%, #c8102e 100%)',
    'south africa': 'linear-gradient(135deg, #007a4d 0%, #ffd100 50%, #000000 100%)',
    'south korea': 'linear-gradient(135deg, #0f2042 0%, #cd2e3a 100%)',
    'paraguay': 'linear-gradient(135deg, #d52b1e 0%, #ffffff 50%, #0038a8 100%)',
    'germany': 'linear-gradient(135deg, #000000 0%, #dd0000 50%, #ffcf00 100%)',
    'netherlands': 'linear-gradient(135deg, #ff4f00 0%, #ffffff 100%)',
    'belgium': 'linear-gradient(135deg, #000000 0%, #ffd100 50%, #ff0000 100%)',
    'spain': 'linear-gradient(135deg, #c1272d 0%, #ffd100 50%, #c1272d 100%)',
    'portugal': 'linear-gradient(135deg, #006600 0%, #ff0000 100%)',
    'brazil': 'linear-gradient(135deg, #009739 0%, #fed100 100%)',
    'argentina': 'linear-gradient(135deg, #75aadb 0%, #ffffff 50%, #75aadb 100%)',
    'france': 'linear-gradient(135deg, #002395 0%, #ffffff 50%, #ed2939 100%)',
    'england': 'linear-gradient(135deg, #ffffff 0%, #cf142b 100%)',
    'morocco': 'linear-gradient(135deg, #c1272d 0%, #006233 100%)'
  };
  
  const clean = name.toLowerCase().replace(/\s*\(co-host\)/gi, '').trim();
  return map[clean] ?? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
}

/** Return custom color values for secondary accents or borders based on the team */
export function getTeamColors(name: string): { primary: string; secondary: string; text: string } {
  const primary = getTeamAccentColor(name);
  
  const map: Record<string, { secondary: string; text: string }> = {
    'mexico': { secondary: '#ce1126', text: '#ffffff' },
    'canada': { secondary: '#ffffff', text: '#ffffff' },
    'south africa': { secondary: '#ffd100', text: '#ffffff' },
    'south korea': { secondary: '#cd2e3a', text: '#ffffff' },
    'paraguay': { secondary: '#0038a8', text: '#ffffff' },
    'germany': { secondary: '#ffcf00', text: '#ffffff' },
    'netherlands': { secondary: '#ffffff', text: '#ffffff' },
    'belgium': { secondary: '#ff0000', text: '#ffffff' },
    'spain': { secondary: '#ffd100', text: '#ffffff' },
    'portugal': { secondary: '#ff0000', text: '#ffffff' },
    'brazil': { secondary: '#fed100', text: '#ffffff' },
    'argentina': { secondary: '#ffffff', text: '#0f2042' },
    'france': { secondary: '#ed2939', text: '#ffffff' },
    'england': { secondary: '#cf142b', text: '#002395' },
    'morocco': { secondary: '#006233', text: '#ffffff' }
  };
  
  const clean = name.toLowerCase().replace(/\s*\(co-host\)/gi, '').trim();
  const res = map[clean] ?? { secondary: '#1d4ed8', text: '#ffffff' };
  return { primary, ...res };
}
