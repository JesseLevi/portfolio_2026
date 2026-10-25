export const nl = {
  'site.name': 'Jesse Kamps',
  'site.role': 'Designer voor web en identiteit',
  'cta.contact': 'Neem contact op',
  'cta.expertise': 'Expertise',
  'home.title': 'Jesse Kamps | Designer voor web en identiteit',
  'home.description':
    'Portfolio van Jesse Kamps, designer voor web en identiteit. Bekijk geselecteerd werk.',
  'home.cases': 'Werk',
  'nav.home': 'Home',
  'nav.about': 'Over',
  'nav.contact': 'Contact',
  'contact.title': 'Neem contact op',
  'contact.mail.label': 'Mail',
  'contact.mail.body': 'Stel een vraag of vertel me over een project',
  'contact.mail.cta': 'Stuur een mail',
  'contact.linkedin.label': 'LinkedIn',
  'contact.linkedin.body': 'Blijf op de hoogte of stuur een berichtje',
  'contact.linkedin.cta': 'Connect op Linkedin',
  'contact.close': 'Sluiten',
  'case.agency': 'Agency:',
  'case.work': 'Werk:',
  'chapters.label': 'Hoofdstukken',
} as const;

export type TranslationKey = keyof typeof nl;
export type Dictionary = Record<TranslationKey, string>;
