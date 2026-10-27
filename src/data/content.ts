// All sample values on the site are examples and are labeled as such where they appear.

export type Attr = 'declared' | 'linked' | 'corroborated' | 'unknown' | 'disputed' | 'witness';

export const ENT: { kind: string; text: string; attr: Attr }[] = [
  { kind: 'observation', text: 'Release deployed to production', attr: 'corroborated' },
  { kind: 'observation', text: 'Outgoing payment to a supplier', attr: 'linked' },
  { kind: 'outcome', text: 'Customer ticket resolved', attr: 'linked' },
  { kind: 'observation', text: 'Agent permission changed', attr: 'declared' },
  { kind: 'threshold', text: 'Human message in the Threshold: approval', attr: 'corroborated' },
  { kind: 'observation', text: 'Batch of 12 external messages sent', attr: 'unknown' },
  { kind: 'outcome', text: 'Order fulfilled and confirmed by counterpart', attr: 'corroborated' },
  { kind: 'outcome', text: 'Task rejected by counterpart', attr: 'disputed' },
];

export const LEG: { name: Attr; text: string }[] = [
  { name: 'declared', text: 'Someone said so. Never evidence.' },
  { name: 'linked', text: 'Connected to a recorded cause.' },
  { name: 'corroborated', text: 'Confirmed by a second source.' },
  { name: 'unknown', text: 'Cause not established.' },
  { name: 'disputed', text: 'Sources disagree.' },
];

export type BarKind = 'solid' | 'hatch' | 'empty';
export const DIMS: {
  name: string;
  q: string;
  val: string;
  note: string;
  fresh: string;
  parts: { w: number; k: BarKind }[];
}[] = [
  { name: 'Observed autonomy', q: 'How much is done and decided without humans?', val: '72% executed · 41% decided', note: 'By agents, among actions with attribution linked or better.', fresh: 'newest evidence: 4 min', parts: [{ w: 72, k: 'solid' }, { w: 14, k: 'empty' }, { w: 14, k: 'hatch' }] },
  { name: 'Coverage', q: 'How much can we see?', val: '4 measures', note: 'Inventory, capture, reconciliation, attribution. Server capture degraded.', fresh: 'newest checkpoint: 4 min', parts: [{ w: 88, k: 'solid' }, { w: 12, k: 'hatch' }] },
  { name: 'Reliability', q: 'Does it work?', val: '38 of 41 work units', note: 'Met criteria declared in advance. Failed units are counted too.', fresh: 'newest unit: 22 min', parts: [{ w: 93, k: 'solid' }, { w: 7, k: 'empty' }] },
  { name: 'Control', q: 'Are the limits respected?', val: '6 of 7 laws conform', note: 'One law is not verified yet. One cell per law, with its evidence.', fresh: 'last stop drill recorded', parts: [{ w: 14.28, k: 'solid' }, { w: 14.28, k: 'solid' }, { w: 14.28, k: 'solid' }, { w: 14.28, k: 'solid' }, { w: 14.28, k: 'solid' }, { w: 14.28, k: 'hatch' }, { w: 14.32, k: 'solid' }] },
  { name: 'Human dependency', q: 'How much human life does each delivery consume?', val: '0.4 interventions per unit', note: 'Rescue rate: 2 of 38 units. Silence: 1,204 beats.', fresh: 'newest crossing: 9 h', parts: [] },
  { name: 'Provenance', q: 'How was it born?', val: 'Founded · generation 0', note: 'No parents in the protocol. A fact about origin, not about quality.', fresh: 'birth act, signed', parts: [] },
];

export const CPS = [
  { n: '01', t: 'Read the Agent Card', d: 'Any A2A Agent Card says what an agent can do.' },
  { n: '02', t: 'Follow the Ilorium extension to the Spore', d: 'A data-only entry points to the organism behind the agent.' },
  { n: '03', t: 'Read the Vital Signs', d: 'State, six dimensions, conformity and the stop key holder, in seconds.' },
  { n: '04', t: 'Download the Evidence Bundle and run a verifier', d: 'Check the integrity of the evidence with any conforming verifier. The bundle never holds the keys; you bring them.' },
];

export const LAWS = ['Record', 'Limit', 'Stop', 'Responsible', 'Truth', 'Separation', 'Continuity'] as const;

export const LAW_TEXT: { n: number; name: string; text: string }[] = [
  { n: 1, name: 'Record', text: 'Every material action produces an observation in the organism\'s Strata. No actor can edit or delete a recorded observation.' },
  { n: 2, name: 'Limit', text: 'No agent increases its own permissions, budget or scope. A descendant never receives what its parent could not grant.' },
  { n: 3, name: 'Stop', text: 'There is always a stop that agents cannot disable, delay or bypass. Its key is held by a human or a human-governed institution, never by an organism.' },
  { n: 4, name: 'Responsible', text: 'Every organism names an identifiable responsible party and keeps a complaint channel that is answered.' },
  { n: 5, name: 'Truth', text: 'Agents never pass as human. The organism never claims more autonomy than its evidence supports, and never presents its ancestry as evidence of its own capability.' },
  { n: 6, name: 'Separation', text: 'No one judges their own cause. No organism attests to itself or to its lineage, and no organism amends the Genome.' },
  { n: 7, name: 'Continuity', text: 'High-impact actions are reversible or pass a gate. The organism can keep operating if a provider fails.' },
];

export const LH: { name: string; text: string; st: 'draft' | 'planned' }[] = [
  { name: '/llms.txt', text: 'What Ilorium is, how to adopt it, how to check an organism.', st: 'draft' },
  { name: '/.well-known/ilorium.json', text: 'Release, documents, schemas, vectors, known indexes.', st: 'draft' },
  { name: 'Ilorium Agent Card (A2A)', text: 'Ask how to adopt Ilorium or how to check an organism.', st: 'planned' },
  { name: 'MCP server "ilorium"', text: 'Read a Spore and Vital Signs, fetch and verify a bundle.', st: 'planned' },
  { name: 'ilorium init', text: 'Prepares a Spore and a Probe configuration.', st: 'planned' },
];

export const FAQ: { q: string; a: string }[] = [
  { q: 'Why would my organization adopt it?', a: 'To show how you operate, and to check who you are about to operate with. Vital Signs present your state in one view; the Evidence Bundle behind it can be downloaded and checked by anyone, without trusting Ilorium or you. Counterparts can check before they delegate, hire or grant access. It is evidence, never a seal or a score.' },
  { q: 'What is an organism?', a: 'An organization run by AI agents that carries the Ilorium Genome. It is defined by continuity, not age: its Genome, its key, its chain of records and its lineage. Together, organisms form the species.' },
  { q: 'Is Ilorium a company, a token or a certification?', a: 'None of them. It is an open protocol that no one owns. It has no token and issues no seals. It records what it saw, when it saw it, and what it could not see.' },
  { q: 'Who holds the stop key?', a: 'Always a human or a human-governed institution, never an organism. When no human founder remains, at least two independent Wardens hold it, and any one of them can stop.' },
  { q: 'What is Organism Zero?', a: 'The founder\'s own organism. It is measured in public from its first beat and shown as the first organism, one among others. It is a declared pilot, never an independent validation of Ilorium.' },
  { q: 'Does a higher generation mean a better organism?', a: 'No. Generation is a position in the network, never a rank. A descendant starts from zero and earns its own evidence. Descent proves origin, never improvement.' },
  { q: 'Can my organization join?', a: 'Ilorium is a draft: the specifications are written and the Probe is in development. Today you can read the specifications and the Genome. The first ten external organisms will form the Founding Organisms cohort, with direct onboarding help. Joining is never an endorsement, and a new organism appears as in gestation until it has enough beats on an unbroken chain.' },
];

export type NodeState = 'active' | 'dormant' | 'released' | 'coalesced';
export const NODES: {
  name: string;
  gen: number;
  st: NodeState;
  x: number;
  y: number;
  p: number[];
  ty?: 'founded' | 'inherited' | 'coalesced';
}[] = [
  { name: 'example-zero', gen: 0, st: 'active', x: 62, y: 255, p: [] },
  { name: 'forge-north', gen: 0, st: 'active', x: 92, y: 62, p: [] },
  { name: 'loom-east', gen: 1, st: 'coalesced', x: 206, y: 205, p: [0], ty: 'founded' },
  { name: 'vale-works', gen: 1, st: 'coalesced', x: 232, y: 105, p: [1], ty: 'founded' },
  { name: 'reed-lab', gen: 1, st: 'released', x: 300, y: 340, p: [0], ty: 'founded' },
  { name: 'merge-one', gen: 2, st: 'active', x: 362, y: 160, p: [2, 3], ty: 'coalesced' },
  { name: 'sprout-two', gen: 2, st: 'active', x: 452, y: 335, p: [4], ty: 'inherited' },
  { name: 'pair-born', gen: 3, st: 'active', x: 540, y: 255, p: [5, 6], ty: 'founded' },
  { name: 'hush-field', gen: 3, st: 'dormant', x: 560, y: 80, p: [5], ty: 'founded' },
];

// The protocol documents, in the order of manifest.md. `file` is the path at the root of
// github.com/ilorium-protocol/protocol; the rendered page is /docs/<file with .html>.
export const DOCS: { title: string; text: string; file: string }[] = [
  { title: 'README', text: 'What Ilorium is, vision and evidence, names, the list of documents.', file: 'README.md' },
  { title: 'Whitepaper', text: 'The problem, the protocol and the horizon, in one document. No normative force.', file: 'whitepaper-v1.md' },
  { title: 'Manifest', text: 'Release 1.0: which documents are the protocol, the three layers, compatibility.', file: 'manifest.md' },
  { title: 'Genome', text: 'The seven laws, the three locks, succession and amendment.', file: 'genome/genome-v1.md' },
  { title: 'Governance', text: 'Custodians, Wardens, how the interim governance ends.', file: 'governance-v1.md' },
  { title: 'Pulse', text: 'Signed liveness with witness challenges.', file: 'specs/pulse-v1.md' },
  { title: 'Evidence Format', text: 'The Evidence Bundle and how any verifier checks it.', file: 'specs/evidence-format-v1.md' },
  { title: 'Probe', text: 'The read-only recorder. In development, built from milestone M1.', file: 'specs/probe-v1.md' },
  { title: 'Proof of Life', text: 'Six dimensions, side by side. No composite number.', file: 'specs/proof-of-life-v1.md' },
  { title: 'Ecosystem', text: 'Spore, Strata, Radiant, succession records.', file: 'specs/ecosystem-v1.md' },
  { title: 'Discovery and growth', text: 'The Lighthouse, the Founding Organisms cohort, how organisms find each other.', file: 'specs/discovery-and-growth-v1.md' },
  { title: 'Glossary', text: 'Every term, in one place.', file: 'glossary.md' },
  { title: 'Architecture', text: 'The reference implementation. Not part of the protocol.', file: 'engineering/architecture-v1.md' },
  { title: 'Changelog', text: 'Every change, by release.', file: 'CHANGELOG.md' },
];
