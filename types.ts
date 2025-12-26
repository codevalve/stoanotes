
export type NoteType = 'journal' | 'reflection' | 'thought' | 'archive';

export interface Note {
  id: string;
  title: string;
  content: string; // Encrypted string
  tags: string[];
  type: NoteType;
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
}

export interface EncryptionKey {
  key: CryptoKey;
  salt: Uint8Array;
}

export interface UserSettings {
  userName: string;
  theme: 'light' | 'dark' | 'sepia';
  birthDate?: string; // For Memento Mori
}

export interface StoicQuote {
  text: string;
  author: string;
}
