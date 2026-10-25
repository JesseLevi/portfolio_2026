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
  // case
  'case.agency': 'Agency:',
  'case.work': 'Werk:',
  'case.back': 'Terug naar Home',
  'chapters.label': 'Hoofdstukken',
  // 404
  'notFound.title': 'Pagina niet gevonden',
  'notFound.description': 'Deze pagina bestaat niet (meer).',
  'notFound.body': 'De pagina die je zoekt bestaat niet of is verplaatst.',
  'notFound.cta': 'Terug naar Home',
  // nav
  'nav.label': 'Hoofdnavigatie',
} as const;

export type TranslationKey = keyof typeof nl;
export type Dictionary = Record<TranslationKey, string>;
