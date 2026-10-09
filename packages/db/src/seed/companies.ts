/**
 * Synthetic companies, contacts and pain-point signals.
 *
 * SYNTHETIC ONLY. Every company, person, phone number and URL here is invented.
 * Domains use `.example`, which RFC 2606 reserves, and emails use example.com,
 * so nothing here can reach a real inbox or resolve to a real site. Real lead
 * data never enters this repository.
 *
 * The companies are shaped like Devora's ICP: businesses with something worth
 * covering and a thin public profile. Every signal carries a source URL and a
 * retrieval date, because no unsourced claim may reach a rep.
 */

export interface SeedSignal {
  readonly kind: string;
  readonly headline: string;
  readonly detail: string;
  readonly sourceUrl: string;
  readonly daysAgo: number;
  readonly confidence: number;
}

export interface SeedCompany {
  readonly domain: string;
  readonly name: string;
  readonly industry: string;
  readonly sizeBand: string;
  readonly country: string;
  readonly contact: {
    readonly firstName: string;
    readonly lastName: string;
    readonly jobTitle: string;
    readonly email: string;
    readonly phone: string;
    readonly timezone: string;
    readonly decisionMaker: boolean;
    readonly emailVerified: boolean;
    readonly phoneVerified: boolean;
  };
  readonly icpScore: number;
  readonly icpFactors: readonly { readonly factor: string; readonly points: number }[];
  readonly signals: readonly SeedSignal[];
  readonly dossier: {
    readonly hook: string;
    readonly summary: string;
    readonly risks: string;
    readonly claims: readonly { readonly claim: string; readonly sourceUrl: string }[];
  };
}

export const SEED_COMPANIES: readonly SeedCompany[] = [
  {
    domain: 'northwind-mobility.example',
    name: 'Northwind Mobility',
    industry: 'Urban mobility',
    sizeBand: '50 to 200',
    country: 'FR',
    contact: {
      firstName: 'Camille',
      lastName: 'Rousseau',
      jobTitle: 'Chief Marketing Officer',
      email: 'camille.rousseau@example.com',
      phone: '+33142938475',
      timezone: 'Europe/Paris',
      decisionMaker: true,
      emailVerified: true,
      phoneVerified: true,
    },
    icpScore: 88,
    icpFactors: [
      { factor: 'Raised a Series B in the last quarter', points: 30 },
      { factor: 'No tier one coverage in 12 months', points: 25 },
      { factor: 'Marketing leader in post under 2 years', points: 18 },
      { factor: 'Headcount band fits the offer', points: 15 },
    ],
    signals: [
      {
        kind: 'funding',
        headline: 'Raised 40 million euros in September and said expansion is next',
        detail:
          'The round was covered by two trade titles. Nothing in Forbes, the Financial Times or Bloomberg.',
        sourceUrl: 'https://news.example/northwind-series-b',
        daysAgo: 24,
        confidence: 0.93,
      },
      {
        kind: 'coverage_gap',
        headline: 'Two competitors appeared in national press this month, Northwind did not',
        detail: 'Both competitors ran founder interviews. Northwind has no bylined pieces.',
        sourceUrl: 'https://news.example/mobility-press-roundup',
        daysAgo: 9,
        confidence: 0.81,
      },
    ],
    dossier: {
      hook: 'They raised 40 million euros and the story went nowhere outside trade press.',
      summary:
        'Northwind Mobility closed a 40 million euro Series B in September and told the trade press that European expansion is next. Coverage stayed inside two trade titles. Two competitors ran founder interviews in national press in the same period. Camille Rousseau joined as Chief Marketing Officer 14 months ago.',
      risks:
        'They may have signed a retainer already. The round is three months old, so the news angle is cooling.',
      claims: [
        {
          claim: 'Raised 40 million euros in a Series B announced in September',
          sourceUrl: 'https://news.example/northwind-series-b',
        },
        {
          claim: 'Named European expansion as the use of funds',
          sourceUrl: 'https://news.example/northwind-series-b',
        },
        {
          claim: 'Two competitors secured national coverage in the last month',
          sourceUrl: 'https://news.example/mobility-press-roundup',
        },
        {
          claim: 'Camille Rousseau has been Chief Marketing Officer for 14 months',
          sourceUrl: 'https://profiles.example/camille-rousseau',
        },
      ],
    },
  },
  {
    domain: 'verdalis-health.example',
    name: 'Verdalis Health',
    industry: 'Digital health',
    sizeBand: '200 to 500',
    country: 'FR',
    contact: {
      firstName: 'Étienne',
      lastName: 'Marchand',
      jobTitle: 'Founder and Chief Executive',
      email: 'etienne.marchand@example.com',
      phone: '+33156473829',
      timezone: 'Europe/Paris',
      decisionMaker: true,
      emailVerified: true,
      phoneVerified: true,
    },
    icpScore: 82,
    icpFactors: [
      { factor: 'Regulatory approval won, no press push', points: 28 },
      { factor: 'Founder is the public voice already', points: 22 },
      { factor: 'Search visibility weak on category terms', points: 20 },
      { factor: 'Headcount band fits the offer', points: 12 },
    ],
    signals: [
      {
        kind: 'milestone',
        headline: 'Cleared a regulatory approval in October and announced it on their blog only',
        detail: 'The approval is the kind of proof point national press covers. It ran nowhere.',
        sourceUrl: 'https://news.example/verdalis-approval',
        daysAgo: 12,
        confidence: 0.9,
      },
      {
        kind: 'search_gap',
        headline: 'Not on page one for their own category terms',
        detail: 'Competitors hold the first three results for the main buying term.',
        sourceUrl: 'https://research.example/verdalis-serp',
        daysAgo: 4,
        confidence: 0.76,
      },
    ],
    dossier: {
      hook: 'They won a regulatory approval in October and only their own blog carried it.',
      summary:
        'Verdalis Health cleared a regulatory approval in October and published it on their blog. No trade or national press picked it up. On their main category search term, competitors hold the first three results. Étienne Marchand founded the business and is already the public voice, so there is a spokesperson ready.',
      risks: 'A founder who does his own press may not want help. Approval news ages quickly.',
      claims: [
        {
          claim: 'Cleared a regulatory approval in October',
          sourceUrl: 'https://news.example/verdalis-approval',
        },
        {
          claim: 'The approval appeared only on the company blog',
          sourceUrl: 'https://news.example/verdalis-approval',
        },
        {
          claim: 'Competitors hold the top three results for the main category term',
          sourceUrl: 'https://research.example/verdalis-serp',
        },
      ],
    },
  },
  {
    domain: 'harborline-logistics.example',
    name: 'Harborline Logistics',
    industry: 'Freight software',
    sizeBand: '200 to 500',
    country: 'GB',
    contact: {
      firstName: 'Priya',
      lastName: 'Raman',
      jobTitle: 'VP Marketing',
      email: 'priya.raman@example.com',
      phone: '+442079460123',
      timezone: 'Europe/London',
      decisionMaker: true,
      emailVerified: true,
      phoneVerified: true,
    },
    icpScore: 74,
    icpFactors: [
      { factor: 'Hiring a communications lead', points: 26 },
      { factor: 'Awards shortlist with no press follow through', points: 20 },
      { factor: 'Headcount band fits the offer', points: 16 },
      { factor: 'Market is covered by target outlets', points: 12 },
    ],
    signals: [
      {
        kind: 'hiring',
        headline: 'Advertising for a communications lead, which says the need is already felt',
        detail: 'The role sits under marketing and mentions media relations first.',
        sourceUrl: 'https://jobs.example/harborline-comms-lead',
        daysAgo: 6,
        confidence: 0.88,
      },
    ],
    dossier: {
      hook: 'They are hiring a communications lead, so the need is already budgeted.',
      summary:
        'Harborline Logistics is advertising for a communications lead, with media relations named first in the brief. They were shortlisted for an industry award in July and ran no press around it. Priya Raman owns marketing and would own this decision.',
      risks:
        'Hiring in house can mean they would rather build than buy. The award is five months old.',
      claims: [
        {
          claim: 'Advertising for a communications lead with media relations in the brief',
          sourceUrl: 'https://jobs.example/harborline-comms-lead',
        },
        {
          claim: 'Shortlisted for an industry award in July',
          sourceUrl: 'https://news.example/freight-awards-shortlist',
        },
      ],
    },
  },
  {
    domain: 'solvent-labs.example',
    name: 'Solvent Labs',
    industry: 'Developer tooling',
    sizeBand: '10 to 50',
    country: 'DE',
    contact: {
      firstName: 'Lena',
      lastName: 'Brandt',
      jobTitle: 'Head of Growth',
      email: 'lena.brandt@example.com',
      phone: '+493028471930',
      timezone: 'Europe/Berlin',
      decisionMaker: false,
      emailVerified: true,
      phoneVerified: true,
    },
    icpScore: 63,
    icpFactors: [
      { factor: 'Product launch next quarter', points: 24 },
      { factor: 'Strong developer following, no business press', points: 21 },
      { factor: 'Headcount band at the lower edge', points: 10 },
      { factor: 'Contact is not the budget holder', points: 8 },
    ],
    signals: [
      {
        kind: 'launch',
        headline: 'Pre announcing a launch for next quarter on their changelog',
        detail: 'A launch with no press plan attached is the moment to reach them.',
        sourceUrl: 'https://changelog.example/solvent-labs-next',
        daysAgo: 17,
        confidence: 0.72,
      },
    ],
    dossier: {
      hook: 'A launch is coming next quarter and there is no sign of a press plan.',
      summary:
        'Solvent Labs has pre announced a launch for next quarter on their public changelog. They have a strong developer following and no business press coverage. Lena Brandt runs growth but is not the budget holder, so a founder will need to join the qualifier meeting.',
      risks: 'Small team, so budget may be thin. The contact cannot sign.',
      claims: [
        {
          claim: 'Pre announced a launch for next quarter',
          sourceUrl: 'https://changelog.example/solvent-labs-next',
        },
        {
          claim: 'Lena Brandt is Head of Growth and not listed as a founder',
          sourceUrl: 'https://profiles.example/lena-brandt',
        },
      ],
    },
  },
  {
    domain: 'atlas-provisions.example',
    name: 'Atlas Provisions',
    industry: 'Food supply chain',
    sizeBand: '500 to 1000',
    country: 'FR',
    contact: {
      firstName: 'Olivier',
      lastName: 'Fontaine',
      jobTitle: 'Communications Director',
      email: 'olivier.fontaine@example.com',
      phone: '+33187654321',
      timezone: 'Europe/Paris',
      decisionMaker: true,
      emailVerified: true,
      phoneVerified: true,
    },
    icpScore: 91,
    icpFactors: [
      { factor: 'Named a sustainability commitment with no coverage', points: 32 },
      { factor: 'Communications director in post, so there is an owner', points: 24 },
      { factor: 'Headcount band fits the offer', points: 20 },
      { factor: 'Category is actively covered by target outlets', points: 15 },
    ],
    signals: [
      {
        kind: 'announcement',
        headline: 'Published a sustainability commitment that got no pickup at all',
        detail:
          'The commitment is specific and measurable, which is what Forbes and the Financial Times look for.',
        sourceUrl: 'https://news.example/atlas-provisions-commitment',
        daysAgo: 3,
        confidence: 0.95,
      },
      {
        kind: 'coverage_gap',
        headline: 'No tier one coverage in 18 months despite scale',
        detail: 'A business of this size with no national coverage is unusual.',
        sourceUrl: 'https://research.example/atlas-coverage-audit',
        daysAgo: 2,
        confidence: 0.86,
      },
    ],
    dossier: {
      hook: 'They published a specific sustainability commitment three days ago and nobody covered it.',
      summary:
        'Atlas Provisions published a measurable sustainability commitment three days ago and it received no pickup. Despite 500 to 1000 staff they have had no tier one coverage in 18 months. Olivier Fontaine is Communications Director, so there is an owner for this and a budget line it could sit in.',
      risks: 'A communications director may already have a firm. The news is fresh, so move now.',
      claims: [
        {
          claim: 'Published a measurable sustainability commitment three days ago',
          sourceUrl: 'https://news.example/atlas-provisions-commitment',
        },
        {
          claim: 'No tier one coverage recorded in 18 months',
          sourceUrl: 'https://research.example/atlas-coverage-audit',
        },
        {
          claim: 'Olivier Fontaine holds the Communications Director role',
          sourceUrl: 'https://profiles.example/olivier-fontaine',
        },
      ],
    },
  },
  {
    domain: 'quarry-fintech.example',
    name: 'Quarry Fintech',
    industry: 'Payments',
    sizeBand: '50 to 200',
    country: 'FR',
    contact: {
      firstName: 'Sofia',
      lastName: 'Lambert',
      jobTitle: 'Chief Operating Officer',
      email: 'sofia.lambert@example.com',
      phone: '+33170809010',
      timezone: 'Europe/Paris',
      decisionMaker: true,
      emailVerified: true,
      phoneVerified: true,
    },
    icpScore: 69,
    icpFactors: [
      { factor: 'Licence application reported in trade press', points: 25 },
      { factor: 'No founder visibility at all', points: 20 },
      { factor: 'Headcount band fits the offer', points: 16 },
      { factor: 'Operations contact rather than marketing', points: 8 },
    ],
    signals: [
      {
        kind: 'regulatory',
        headline: 'A licence application was reported in trade press last month',
        detail: 'A licence is a credibility story that national business press will take.',
        sourceUrl: 'https://news.example/quarry-licence-filing',
        daysAgo: 31,
        confidence: 0.79,
      },
    ],
    dossier: {
      hook: 'Their licence filing was reported in trade press and never went further.',
      summary:
        'Quarry Fintech had a licence application reported in trade press last month. There is no founder visibility in national business press. Sofia Lambert is Chief Operating Officer, which means she can sign but marketing is not her first language.',
      risks:
        'An operations contact may route this to a marketing lead who is not in the conversation. The filing is a month old.',
      claims: [
        {
          claim: 'A licence application was reported in trade press last month',
          sourceUrl: 'https://news.example/quarry-licence-filing',
        },
        {
          claim: 'No national business press coverage found for the founders',
          sourceUrl: 'https://research.example/quarry-coverage-audit',
        },
      ],
    },
  },
] as const;

/**
 * This contact has objected to processing, so the platform must refuse to queue
 * or dial the lead. It exists to make that refusal demonstrable rather than
 * theoretical.
 */
export const SUPPRESSED_COMPANY: SeedCompany = {
  domain: 'ridgeway-partners.example',
  name: 'Ridgeway Partners',
  industry: 'Professional services',
  sizeBand: '200 to 500',
  country: 'FR',
  contact: {
    firstName: 'Mathieu',
    lastName: 'Perrin',
    jobTitle: 'Managing Partner',
    email: 'mathieu.perrin@example.com',
    phone: '+33199887766',
    timezone: 'Europe/Paris',
    decisionMaker: true,
    emailVerified: true,
    phoneVerified: true,
  },
  icpScore: 77,
  icpFactors: [{ factor: 'Scored well before the objection was recorded', points: 77 }],
  signals: [],
  dossier: {
    hook: 'Do not contact. This person objected to processing.',
    summary:
      'Ridgeway Partners scored inside the target range, then Mathieu Perrin objected to the processing of his data. The platform refuses to queue or dial this lead, and only the compliance role can lift that.',
    risks: 'Contacting this person would be a compliance breach.',
    claims: [],
  },
};
