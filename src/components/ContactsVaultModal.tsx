import { useState } from 'react';
import { ScannedContact } from '../types';
import { 
  X, 
  Users, 
  Search, 
  Download, 
  Trash2, 
  Star, 
  ExternalLink, 
  Tag, 
  Calendar, 
  Phone, 
  Mail, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  Building2,
  Plus,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { downloadDataUrl } from '../utils/qrHelper';

interface ContactsVaultModalProps {
  contacts: ScannedContact[];
  onClose: () => void;
  onDeleteContact: (id: string) => void;
  onToggleStar: (id: string) => void;
  onOpenScanner?: () => void;
}

export function ContactsVaultModal({
  contacts,
  onClose,
  onDeleteContact,
  onToggleStar,
  onOpenScanner,
}: ContactsVaultModalProps) {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [copiedBatch, setCopiedBatch] = useState(false);

  // Extract unique event tags
  const tags = Array.from(new Set(contacts.map((c) => c.eventTag).filter(Boolean)));

  const filtered = contacts.filter((c) => {
    const matchesSearch =
      c.parsedTitle.toLowerCase().includes(search.toLowerCase()) ||
      (c.parsedSubtitle && c.parsedSubtitle.toLowerCase().includes(search.toLowerCase())) ||
      c.notes.toLowerCase().includes(search.toLowerCase()) ||
      c.eventTag.toLowerCase().includes(search.toLowerCase());

    const matchesTag = selectedTag === 'all' || c.eventTag === selectedTag;

    return matchesSearch && matchesTag;
  });

  const handleExportCSV = () => {
    if (contacts.length === 0) return;

    const headers = ['Name', 'Title/Role', 'Company', 'Phone', 'Email', 'Event Tag', 'Notes', 'Scanned Date'];
    const rows = contacts.map((c) => [
      `"${c.vCardData?.firstName || c.parsedTitle || ''}"`,
      `"${c.vCardData?.jobTitle || c.parsedSubtitle || ''}"`,
      `"${c.vCardData?.organization || ''}"`,
      `"${c.vCardData?.phone || ''}"`,
      `"${c.vCardData?.email || ''}"`,
      `"${c.eventTag || ''}"`,
      `"${c.notes.replace(/"/g, '""') || ''}"`,
      `"${new Date(c.scannedAt).toLocaleDateString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    downloadDataUrl(csvContent, `smart_networking_contacts_${Date.now()}.csv`);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
  };

  const handleExportAllVCF = () => {
    if (contacts.length === 0) return;

    const allVcards = contacts
      .map((c) => {
        if (c.rawText.includes('BEGIN:VCARD')) {
          return c.rawText;
        }
        return `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${c.parsedTitle}\r\nNOTE:${c.notes}\r\nEND:VCARD`;
      })
      .join('\r\n\r\n');

    const blob = new Blob([allVcards], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    downloadDataUrl(url, `all_scanned_contacts_${Date.now()}.vcf`);
    URL.revokeObjectURL(url);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">Event Contacts Vault</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {contacts.length} saved
                </span>
              </div>
              <p className="text-xs text-neutral-400">Recruiters, hiring managers & peers you have scanned</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenScanner && (
              <button
                onClick={onOpenScanner}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Scan New</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Event Filters */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/40 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search by recruiter name, role, company, or note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {tags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              <button
                onClick={() => setSelectedTag('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedTag === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                All Events ({contacts.length})
              </button>
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    selectedTag === tag
                      ? 'bg-indigo-600 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center text-neutral-500 mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">No contacts found</h3>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto mt-1">
                {contacts.length === 0
                  ? 'Use the built-in scanner to capture badges, vCards, and QR codes at your next conference.'
                  : 'No contacts match your current filter search.'}
              </p>
            </div>
          ) : (
            filtered.map((contact) => (
              <div
                key={contact.id}
                className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 hover:border-neutral-700 transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">
                        {contact.parsedTitle}
                      </h4>
                      <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
                        {contact.eventTag || 'Event'}
                      </span>
                    </div>
                    {contact.parsedSubtitle && (
                      <p className="text-xs text-indigo-300 font-medium truncate mt-0.5">
                        {contact.parsedSubtitle}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onToggleStar(contact.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        contact.starred
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                      }`}
                      title={contact.starred ? 'Starred Lead' : 'Star Contact'}
                    >
                      <Star className={`w-4 h-4 ${contact.starred ? 'fill-amber-400' : ''}`} />
                    </button>

                    <button
                      onClick={() => onDeleteContact(contact.id)}
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                      title="Delete contact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Notes & Scanned date */}
                {contact.notes && (
                  <p className="text-xs text-neutral-300 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800/60 leading-relaxed">
                    💬 {contact.notes}
                  </p>
                )}

                {/* Direct Action Chips */}
                <div className="flex items-center justify-between pt-1 border-t border-neutral-850 text-[11px] text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-neutral-500" />
                    {new Date(contact.scannedAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    {contact.vCardData?.phone && (
                      <a
                        href={`tel:${contact.vCardData.phone}`}
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" /> Call
                      </a>
                    )}
                    {contact.vCardData?.email && (
                      <a
                        href={`mailto:${contact.vCardData.email}`}
                        className="text-rose-400 hover:text-rose-300 flex items-center gap-1"
                      >
                        <Mail className="w-3 h-3" /> Email
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions: Export to CSV & VCF */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-900/90 backdrop-blur-md flex items-center justify-between gap-2">
          <span className="text-xs text-neutral-400 hidden sm:inline">
            Export contacts to Google Sheets or Phone:
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleExportCSV}
              disabled={contacts.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 disabled:opacity-50 transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV (Excel)</span>
            </button>

            <button
              onClick={handleExportAllVCF}
              disabled={contacts.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md disabled:opacity-50 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export All (.vcf)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
