
import { Note, UserSettings } from '../types';
import { STORAGE_KEYS } from '../constants';

export class StorageService {
  static getNotes(): Note[] {
    const data = localStorage.getItem(STORAGE_KEYS.NOTES);
    return data ? JSON.parse(data) : [];
  }

  static saveNotes(notes: Note[]) {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  }

  static getSettings(): UserSettings {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : {
      userName: 'Philosopher',
      theme: 'light'
    };
  }

  static saveSettings(settings: UserSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  static exportData() {
    const data = {
      notes: this.getNotes(),
      settings: this.getSettings(),
      salt: localStorage.getItem(STORAGE_KEYS.SALT)
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stoa-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  }
}
