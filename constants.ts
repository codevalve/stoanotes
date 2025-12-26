
import { StoicQuote } from './types';

export const STOIC_QUOTES: StoicQuote[] = [
  { text: "Very little is needed to make a happy life; it is all within yourself, in your way of thinking.", author: "Marcus Aurelius" },
  { text: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius" },
  { text: "We suffer more often in imagination than in reality.", author: "Seneca" },
  { text: "Difficulties strengthen the mind, as labor does the body.", author: "Seneca" },
  { text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus" },
  { text: "Happiness and freedom begin with a clear understanding of one principle: Some things are within our control, and some things are not.", author: "Epictetus" },
  { text: "If it is not right do not do it; if it is not true do not say it.", author: "Marcus Aurelius" },
  { text: "The soul becomes dyed with the color of its thoughts.", author: "Marcus Aurelius" },
  { text: "He who is brave is free.", author: "Seneca" },
  { text: "Make the best use of what is in your power, and take the rest as it happens.", author: "Epictetus" }
];

export const STORAGE_KEYS = {
  NOTES: 'stoa_notes_v1',
  SETTINGS: 'stoa_settings_v1',
  SALT: 'stoa_crypto_salt'
};
