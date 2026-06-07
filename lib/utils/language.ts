import { cookies, headers } from 'next/headers';

export async function getLanguageServer(): Promise<'en' | 'bn'> {
  try {
    const cookieStore = await cookies();
    const lang = cookieStore.get('lang')?.value;
    if (lang === 'en' || lang === 'bn') {
      return lang;
    }
  } catch (e) {
    // Ignore error in static compilation contexts if any
  }
  
  try {
    const headerList = await headers();
    const acceptLang = headerList.get('accept-language') || '';
    if (acceptLang.toLowerCase().includes('bn')) {
      return 'bn';
    }
  } catch (e) {
    // Ignore error
  }
  
  return 'en';
}
