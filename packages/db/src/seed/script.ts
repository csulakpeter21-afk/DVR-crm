/**
 * A synthetic call script tree (P1-06-T5).
 *
 * NOT FOR LIVE USE. This is a placeholder so the script engine and the player
 * can be built and demonstrated. The real tree is the M6 spec, which Peter has
 * not written yet, and importing it is P2-11-T3.
 *
 * It is written to the copy rules even so, because a placeholder that breaks
 * them teaches the wrong habit: no "agency", no dashes as punctuation, short and
 * human, and when outlets are listed, Forbes comes first and the Financial Times
 * is written in full.
 *
 * Variables: {first_name}, {company}, {signal_hook}. A node whose variable has
 * no sourced value falls back to `fallbackLine`, so a rep never reads a gap out
 * loud.
 */

export interface SeedAnswer {
  readonly label: string;
  readonly next: string | null;
  readonly outcomeTag?: string;
}

export interface SeedNode {
  readonly key: string;
  readonly line: string;
  readonly fallbackLine?: string;
  readonly intent?: string;
  readonly outcome?: string;
  readonly isBooking?: boolean;
  readonly answers?: readonly SeedAnswer[];
}

export const SCRIPT_TREE_NAME = 'ICP cold call, placeholder v0';

export const SCRIPT_NODES: readonly SeedNode[] = [
  {
    key: 'opener',
    line: 'Hi {first_name}, this is Péter from Devora. We are a PR firm. Can I borrow thirty seconds to say why I called?',
    fallbackLine:
      'Hi, this is Péter from Devora. We are a PR firm. Can I borrow thirty seconds to say why I called?',
    intent: 'Earn permission for thirty seconds',
    answers: [
      { label: 'Go on then', next: 'hook' },
      { label: 'Who is this?', next: 'who_is_this' },
      { label: 'I am in the middle of something', next: 'busy' },
      { label: 'Not interested', next: 'not_interested', outcomeTag: 'objection_brushoff' },
    ],
  },
  {
    key: 'who_is_this',
    line: 'Péter, from Devora. We get companies covered in the press that their buyers actually read. I called about something specific to {company}.',
    fallbackLine:
      'Péter, from Devora. We get companies covered in the press that their buyers actually read. I called about something specific to your business.',
    intent: 'Answer plainly, return to the reason for the call',
    answers: [
      { label: 'Alright, what is it?', next: 'hook' },
      { label: 'Not interested', next: 'not_interested', outcomeTag: 'objection_brushoff' },
    ],
  },
  {
    key: 'busy',
    line: 'Understood. Two sentences and then I will let you go, or I can call back. Which is easier?',
    intent: 'Give a real choice rather than pushing',
    answers: [
      { label: 'Two sentences', next: 'hook' },
      { label: 'Call me back', next: 'callback', outcomeTag: 'callback_requested' },
      { label: 'Neither', next: 'not_interested', outcomeTag: 'objection_brushoff' },
    ],
  },
  {
    key: 'hook',
    line: '{signal_hook} That is usually the moment coverage is easiest to win, and the moment it is most often missed.',
    fallbackLine:
      'Most companies your size have a story worth covering and no one whose job it is to place it. That is usually where we come in.',
    intent: 'Lead with the research, not the offer',
    answers: [
      { label: 'That is true, actually', next: 'qualify_owner' },
      { label: 'How did you know that?', next: 'source' },
      {
        label: 'We already have someone on this',
        next: 'objection_incumbent',
        outcomeTag: 'objection_incumbent',
      },
      {
        label: 'We have no budget for that',
        next: 'objection_budget',
        outcomeTag: 'objection_budget',
      },
      { label: 'Not a priority', next: 'not_interested', outcomeTag: 'objection_priority' },
    ],
  },
  {
    key: 'source',
    line: 'It is public. I read it this week and I can send you the link after this call. We do the reading before we pick up the phone.',
    intent: 'Prove the research is real and sourced',
    answers: [
      { label: 'Fair enough', next: 'qualify_owner' },
      { label: 'Send it and we will see', next: 'callback', outcomeTag: 'send_information' },
    ],
  },
  {
    key: 'qualify_owner',
    line: 'Before I take more of your time, is press and visibility something you own, or does it sit with someone else?',
    intent: 'Find the decision maker early',
    answers: [
      { label: 'I own it', next: 'value' },
      { label: 'I share it with the founder', next: 'value' },
      { label: 'Someone else owns it', next: 'wrong_contact', outcomeTag: 'wrong_contact' },
    ],
  },
  {
    key: 'value',
    line: 'Then here is the offer in one line. We place companies in Forbes, the Financial Times and Bloomberg, and we make sure the same story shows up when buyers search. Worth thirty minutes to see whether it applies to you?',
    intent: 'State the offer once, then ask for the meeting',
    answers: [
      { label: 'Yes, worth a look', next: 'booking' },
      { label: 'What does it cost?', next: 'objection_price', outcomeTag: 'objection_price' },
      {
        label: 'We tried a firm before and it did nothing',
        next: 'objection_burned',
        outcomeTag: 'objection_burned',
      },
      { label: 'Send me something first', next: 'callback', outcomeTag: 'send_information' },
    ],
  },
  {
    key: 'objection_incumbent',
    line: 'Good, then you already believe in it. Most people we work with had someone. The question is whether you are getting the outlets you actually want. Which ones have you landed this year?',
    intent: 'Do not attack the incumbent, test the results',
    answers: [
      { label: 'Honestly, not many', next: 'value' },
      {
        label: 'We are happy with the results',
        next: 'not_interested',
        outcomeTag: 'objection_satisfied',
      },
      { label: 'Trade press mostly', next: 'value' },
    ],
  },
  {
    key: 'objection_budget',
    line: 'That is fair, and I am not asking for budget today. I am asking for thirty minutes to find out whether this is worth a line in the next budget. If it is not, I will tell you.',
    intent: 'Separate the meeting from the spend',
    answers: [
      { label: 'Thirty minutes I can do', next: 'booking' },
      { label: 'Still no', next: 'not_interested', outcomeTag: 'objection_budget' },
    ],
  },
  {
    key: 'objection_price',
    line: 'It depends on how many outlets and how fast. I will not quote you a number on a cold call and pretend it is accurate. Thirty minutes and you will have a real one.',
    intent: 'Refuse to guess, trade the number for the meeting',
    answers: [
      { label: 'Alright, book it', next: 'booking' },
      { label: 'Give me a range at least', next: 'price_range' },
      { label: 'Too rich for us', next: 'not_interested', outcomeTag: 'objection_price' },
    ],
  },
  {
    key: 'price_range',
    line: 'Our engagements start in the low thousands a month and go up with the outlet list. If that is already out of range, say so now and I will stop.',
    intent: 'Be honest about the range, qualify out fast',
    answers: [
      { label: 'That is workable', next: 'booking' },
      { label: 'Out of range', next: 'disqualify_budget', outcomeTag: 'no_budget' },
    ],
  },
  {
    key: 'objection_burned',
    line: 'Then you know what a bad one looks like. What did they promise that did not land?',
    intent: 'Let them say it, then answer the specific failure',
    answers: [
      { label: 'Lots of activity, no coverage', next: 'value' },
      { label: 'Only trade titles', next: 'value' },
      {
        label: 'I would rather not go through that again',
        next: 'not_interested',
        outcomeTag: 'objection_burned',
      },
    ],
  },
  {
    key: 'booking',
    line: 'Good. I will put thirty minutes with one of our senior people in the diary. They will have read the same research I did. What does your week look like?',
    intent: 'Book the qualifier meeting',
    isBooking: true,
    answers: [
      { label: 'Slot booked', next: 'confirm', outcomeTag: 'meeting_booked' },
      { label: 'They went cold on the diary', next: 'callback', outcomeTag: 'callback_requested' },
    ],
  },
  {
    key: 'confirm',
    line: 'Booked. You will get a confirmation with the research we talked about, so the meeting starts where this call ended. Thanks for the thirty seconds, {first_name}.',
    fallbackLine:
      'Booked. You will get a confirmation with the research we talked about, so the meeting starts where this call ended. Thanks for the thirty seconds.',
    intent: 'Close cleanly and set the expectation',
    outcome: 'meeting_booked',
  },
  {
    key: 'callback',
    line: 'No problem. I will send what I found and call you back when you have had a look. Same number?',
    intent: 'Keep the door open with a reason to return',
    outcome: 'callback',
  },
  {
    key: 'wrong_contact',
    line: 'Then I am talking to the wrong person and I will not waste your time. Who should I be speaking to?',
    intent: 'Exit politely with a referral',
    outcome: 'wrong_contact',
  },
  {
    key: 'not_interested',
    line: 'Understood, I will leave it there. Thanks for being straight with me.',
    intent: 'Accept the no without a last push',
    outcome: 'not_interested',
  },
  {
    key: 'disqualify_budget',
    line: 'Then we are not a fit today and I will not push it. If that changes, you know where we are.',
    intent: 'Qualify out cleanly',
    outcome: 'no_budget',
  },
] as const;

export const ROOT_NODE_KEY = 'opener';
