
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Note, UserSettings, NoteType, StoicQuote } from './types';
import { STOIC_QUOTES } from './constants';
import { EncryptionService } from './services/encryptionService';
import { StorageService } from './services/storageService';
import { 
  IconFeather, IconLock, IconBook, IconTrash, 
  IconPlus, IconArchive, IconSearch, IconSettings,
  IconSun, IconMoon
} from './components/Icons';
import MarkdownView from './components/MarkdownView';

const App: React.FC = () => {
  const [isLocked, setIsLocked] = useState(true);
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [settings, setSettings] = useState<UserSettings>(StorageService.getSettings());
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<NoteType | 'all'>('all');
  const [quote, setQuote] = useState<StoicQuote>(STOIC_QUOTES[0]);
  
  // Custom Confirmation Modal State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  // Decrypted cache
  const [decryptedCache, setDecryptedCache] = useState<Record<string, string>>({});

  // Theme handling
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Fix: Explicitly type newTheme and newSettings to match UserSettings to avoid string vs literal type mismatch.
  // This ensures the theme property is treated as a valid member of the 'light' | 'dark' | 'sepia' union.
  const toggleTheme = () => {
    const newTheme: UserSettings['theme'] = settings.theme === 'dark' ? 'light' : 'dark';
    const newSettings: UserSettings = { ...settings, theme: newTheme };
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  useEffect(() => {
    setQuote(STOIC_QUOTES[Math.floor(Math.random() * STOIC_QUOTES.length)]);
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await EncryptionService.initialize(password);
    if (success) {
      setIsLocked(false);
      setNotes(StorageService.getNotes());
    } else {
      alert('Initialization failed');
    }
  };

  const handleCreateNote = async (type: NoteType = 'thought') => {
    if (EncryptionService.isLocked()) return;
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: 'Untitled Reflection',
      content: await EncryptionService.encrypt(''),
      tags: [],
      type,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    StorageService.saveNotes(updatedNotes);
    setSelectedNoteId(newNote.id);
    setIsEditing(true);
    setDecryptedCache(prev => ({ ...prev, [newNote.id]: '' }));
  };

  const currentNote = useMemo(() => 
    notes.find(n => n.id === selectedNoteId), 
    [notes, selectedNoteId]
  );

  const decryptContent = useCallback(async (noteId: string, encrypted: string) => {
    if (decryptedCache[noteId] !== undefined || EncryptionService.isLocked()) return;
    try {
      const decrypted = await EncryptionService.decrypt(encrypted);
      setDecryptedCache(prev => ({ ...prev, [noteId]: decrypted }));
    } catch (e) {
      console.error(e);
    }
  }, [decryptedCache]);

  useEffect(() => {
    if (selectedNoteId && currentNote && !isLocked) {
      decryptContent(selectedNoteId, currentNote.content);
    }
  }, [selectedNoteId, currentNote, decryptContent, isLocked]);

  const handleSave = async (title: string, content: string) => {
    if (!selectedNoteId || EncryptionService.isLocked()) return;
    const encrypted = await EncryptionService.encrypt(content);
    const updatedNotes = notes.map(n => 
      n.id === selectedNoteId 
        ? { ...n, title, content: encrypted, updatedAt: Date.now() }
        : n
    );
    setNotes(updatedNotes);
    StorageService.saveNotes(updatedNotes);
    setDecryptedCache(prev => ({ ...prev, [selectedNoteId]: content }));
    setIsEditing(false);
  };

  const handleDeleteClick = (id: string) => {
    setNoteToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!noteToDelete) return;
    const updatedNotes = notes.filter(n => n.id !== noteToDelete);
    setNotes(updatedNotes);
    StorageService.saveNotes(updatedNotes);
    if (selectedNoteId === noteToDelete) setSelectedNoteId(null);
    setShowDeleteConfirm(false);
    setNoteToDelete(null);
  };

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || n.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleLogout = () => {
    setIsLocked(true);
    setPassword('');
    setDecryptedCache({});
    setSelectedNoteId(null);
    setIsEditing(false);
    EncryptionService.logout();
  };

  if (isLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f1ea] dark:bg-[#1a1918] p-6">
        <div className="max-w-md w-full bg-white dark:bg-[#2a2928] rounded-2xl shadow-xl p-8 border border-stone-200 dark:border-stone-800">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-stone-900 dark:bg-stone-100 rounded-full flex items-center justify-center mb-4">
              <IconLock className="text-white dark:text-stone-900 w-8 h-8" />
            </div>
            <h1 className="text-3xl font-display font-bold text-stone-900 dark:text-stone-100">STOA NOTES</h1>
            <p className="text-stone-500 italic mt-2">"Master your mind, master your life."</p>
          </div>
          
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Vault Passphrase</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1c1b1a] text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-stone-500 focus:outline-none transition-all"
                placeholder="Enter passphrase to unlock..."
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 py-3 rounded-lg font-medium hover:bg-stone-800 dark:hover:bg-white transition-colors shadow-lg"
            >
              Enter the Stoa
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#fcfaf7] dark:bg-[#1c1b1a] transition-colors duration-300">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#2a2928] rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-stone-200 dark:border-stone-800 animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-serif-stoic font-bold text-stone-900 dark:text-stone-100 mb-4">Discard Reflection?</h2>
            <p className="text-stone-600 dark:text-stone-400 mb-8 leading-relaxed">
              "What is once gone can never be reclaimed." Are you certain you wish to permanently erase this thought?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-stone-600 dark:text-stone-400 font-medium hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg transition-colors border border-stone-200 dark:border-stone-700"
              >
                Retain
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-medium hover:bg-stone-800 dark:hover:bg-white rounded-lg transition-colors shadow-lg"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-stone-200 dark:border-stone-800 flex flex-col bg-[#faf8f5] dark:bg-[#232221]">
        <div className="p-6 flex justify-between items-center">
          <h1 className="text-xl font-display font-bold tracking-tighter text-stone-800 dark:text-stone-100 flex items-center gap-2">
            <IconFeather className="w-5 h-5 text-stone-900 dark:text-stone-100" /> STOA
          </h1>
          <button onClick={toggleTheme} className="text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
            {settings.theme === 'dark' ? <IconSun className="w-4 h-4" /> : <IconMoon className="w-4 h-4" />}
          </button>
        </div>
        
        <nav className="flex-1 px-3 space-y-1">
          <button 
            onClick={() => setActiveTab('all')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'all' ? 'bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-white' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'}`}
          >
            <IconBook className="w-4 h-4" /> All Notes
          </button>
          <button 
            onClick={() => setActiveTab('journal')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'journal' ? 'bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-white' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'}`}
          >
            <IconPlus className="w-4 h-4" /> Daily Journal
          </button>
          <button 
            onClick={() => setActiveTab('thought')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'thought' ? 'bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-white' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'}`}
          >
            <IconFeather className="w-4 h-4" /> Reflections
          </button>
          <button 
            onClick={() => setActiveTab('archive')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'archive' ? 'bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-white' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'}`}
          >
            <IconArchive className="w-4 h-4" /> Archive
          </button>
        </nav>

        <div className="p-4 border-t border-stone-200 dark:border-stone-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
          >
            <IconLock className="w-3 h-3" /> Secure Vault
          </button>
        </div>
      </aside>

      {/* Note List */}
      <main className="w-80 border-r border-stone-200 dark:border-stone-800 flex flex-col bg-white dark:bg-[#1c1b1a]">
        <div className="p-4 border-b border-stone-100 dark:border-stone-800">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-600" />
            <input
              type="text"
              placeholder="Search reflections..."
              className="w-full pl-10 pr-4 py-2 bg-stone-100 dark:bg-[#2a2928] border-none rounded-lg text-sm text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-800 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="flex justify-between items-center p-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-600">Reflections</h2>
            <button 
              onClick={() => handleCreateNote(activeTab === 'all' ? 'thought' : activeTab)}
              className="p-1 hover:bg-stone-100 dark:hover:bg-[#2a2928] rounded transition-colors text-stone-600 dark:text-stone-400"
            >
              <IconPlus className="w-4 h-4" />
            </button>
          </div>
          
          {filteredNotes.map(note => (
            <div
              key={note.id}
              onClick={() => { setSelectedNoteId(note.id); setIsEditing(false); }}
              className={`px-4 py-4 cursor-pointer border-b border-stone-50 dark:border-stone-900 transition-all ${selectedNoteId === note.id ? 'bg-stone-100 dark:bg-[#2a2928]' : 'hover:bg-stone-50 dark:hover:bg-stone-900/50'}`}
            >
              <h3 className="font-semibold text-stone-800 dark:text-stone-200 line-clamp-1">{note.title || 'Untitled'}</h3>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] text-stone-400 dark:text-stone-600 uppercase tracking-tight">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter ${
                  note.type === 'journal' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 
                  note.type === 'reflection' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                }`}>
                  {note.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Editor/Viewer */}
      <section className="flex-1 flex flex-col bg-white dark:bg-[#1c1b1a]">
        {selectedNoteId && currentNote ? (
          <>
            <div className="h-16 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between px-8">
              <span className="text-xs font-bold uppercase tracking-widest text-stone-300 dark:text-stone-700">
                Reflected on {new Date(currentNote.createdAt).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-[#2a2928] transition-colors"
                >
                  {isEditing ? 'Preview' : 'Edit Reflection'}
                </button>
                <button 
                  onClick={() => handleDeleteClick(currentNote.id)}
                  className="p-2 text-stone-400 dark:text-stone-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                >
                  <IconTrash className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 md:px-20 lg:px-40 scroll-smooth">
              {isEditing ? (
                <div className="h-full flex flex-col space-y-4">
                  <input
                    type="text"
                    value={currentNote.title}
                    onChange={(e) => {
                      const updated = notes.map(n => n.id === selectedNoteId ? {...n, title: e.target.value} : n);
                      setNotes(updated);
                    }}
                    className="text-4xl font-serif-stoic font-bold border-none focus:ring-0 placeholder-stone-200 dark:placeholder-stone-800 p-0 w-full bg-transparent text-stone-900 dark:text-stone-100"
                    placeholder="Reflection Title..."
                  />
                  <textarea
                    value={decryptedCache[selectedNoteId] || ''}
                    onChange={(e) => {
                      setDecryptedCache(prev => ({ ...prev, [selectedNoteId]: e.target.value }));
                    }}
                    onBlur={() => handleSave(currentNote.title, decryptedCache[selectedNoteId] || '')}
                    className="flex-1 text-lg leading-relaxed border-none focus:ring-0 resize-none font-sans p-0 w-full bg-transparent text-stone-800 dark:text-stone-300"
                    placeholder="Speak your truth into the silence..."
                  />
                </div>
              ) : (
                <div className="max-w-2xl mx-auto py-10">
                  <h1 className="text-4xl font-serif-stoic font-bold mb-8 text-stone-900 dark:text-stone-100">{currentNote.title}</h1>
                  <MarkdownView content={decryptedCache[selectedNoteId] || ''} />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="max-w-xl">
              <h2 className="text-5xl font-display font-bold text-stone-200 dark:text-stone-800 mb-8 opacity-40">MEMENTO MORI</h2>
              <blockquote className="mb-8">
                <p className="text-2xl font-serif-stoic text-stone-700 dark:text-stone-400 italic mb-4 leading-relaxed">
                  "{quote.text}"
                </p>
                <cite className="text-stone-500 font-bold uppercase tracking-widest text-sm">— {quote.author}</cite>
              </blockquote>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => handleCreateNote('thought')}
                  className="flex items-center gap-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-6 py-3 rounded-full font-medium hover:bg-stone-800 dark:hover:bg-white transition-all shadow-xl hover:-translate-y-1"
                >
                  <IconPlus className="w-4 h-4" /> New Reflection
                </button>
                <button 
                  onClick={() => StorageService.exportData()}
                  className="flex items-center gap-2 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 px-6 py-3 rounded-full font-medium hover:bg-stone-50 dark:hover:bg-stone-700 transition-all shadow-sm"
                >
                  <IconSettings className="w-4 h-4" /> Export Data
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default App;
