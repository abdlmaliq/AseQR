import { useState, useRef, FormEvent } from 'react';
import { UserProfile, CustomLink } from '../types';
import { 
  X, 
  Check, 
  User, 
  Building2, 
  MapPin, 
  Sparkles, 
  Phone, 
  Mail, 
  Globe, 
  FileText, 
  Linkedin, 
  Github, 
  Twitter, 
  Calendar, 
  Plus, 
  Trash2, 
  ExternalLink,
  MessageSquare,
  BadgeAlert,
  Camera,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface EditProfileModalProps {
  profile: UserProfile;
  onSave: (updated: UserProfile) => void;
  onClose: () => void;
}

type TabType = 'identity' | 'contact' | 'links' | 'pitch';

export function EditProfileModal({ profile, onSave, onClose }: EditProfileModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('identity');
  const [formData, setFormData] = useState<UserProfile>({
    ...profile,
    customLinks: profile.customLinks ? [...profile.customLinks] : [],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPhotoUrlInputOpen, setIsPhotoUrlInputOpen] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkSubtitle, setNewLinkSubtitle] = useState('');

  const statusPresets = [
    '🟢 Open to Roles & Collabs',
    '💼 Actively Hiring Engineers',
    '🚀 Building an AI Startup',
    '🤝 Looking for Co-founders',
    '☕ Open for Coffee Chats & Mentorship',
    '🎤 Conference Speaker / Attendee',
  ];

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 240;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setFormData((prev) => ({ ...prev, avatarUrl: dataUrl }));
        }
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onSave(formData);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
    onClose();
  };

  const handleAddCustomLink = () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;

    const newLink: CustomLink = {
      id: `custom_${Date.now()}`,
      title: newLinkTitle.trim(),
      url: newLinkUrl.trim(),
      subtitle: newLinkSubtitle.trim() || undefined,
      badgeText: 'Custom',
    };

    setFormData({
      ...formData,
      customLinks: [...formData.customLinks, newLink],
    });

    setNewLinkTitle('');
    setNewLinkUrl('');
    setNewLinkSubtitle('');
  };

  const handleRemoveCustomLink = (id: string) => {
    setFormData({
      ...formData,
      customLinks: formData.customLinks.filter((l) => l.id !== id),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Edit Master Profile & Landing Page</h2>
              <p className="text-xs text-neutral-400">All changes sync instantly to your Master QR Code</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-neutral-800 px-6 bg-neutral-950/50 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('identity')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'identity'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>1. Identity & Bio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'contact'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>2. Contact & vCard (.vcf)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('links')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'links'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>3. Portfolios & Links</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pitch')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'pitch'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>4. Elevator Pitch</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="edit-profile-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: IDENTITY & BIO */}
          {activeTab === 'identity' && (
            <div className="space-y-5">
              {/* Profile Photo / Avatar Picker */}
              <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800/90">
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2.5">
                  Profile Photo / Avatar
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Photo Preview Avatar */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-pink-500 p-0.5 shadow-md overflow-hidden flex items-center justify-center">
                      {formData.avatarUrl ? (
                        <img
                          src={formData.avatarUrl}
                          alt="Profile Avatar"
                          className="w-full h-full object-cover rounded-[14px]"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-900 rounded-[14px] flex items-center justify-center text-xl font-extrabold text-indigo-300">
                          {formData.name ? formData.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'SN'}
                        </div>
                      )}
                    </div>
                    {formData.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, avatarUrl: undefined })}
                        className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow transition-transform hover:scale-110"
                        title="Remove Photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Upload & Link Controls */}
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageFileUpload}
                        accept="image/png, image/jpeg, image/webp, image/gif"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPhotoUrlInputOpen(!isPhotoUrlInputOpen)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold border border-neutral-700 transition-all"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>{isPhotoUrlInputOpen ? 'Hide URL Input' : 'Use Image URL'}</span>
                      </button>
                    </div>

                    {isPhotoUrlInputOpen && (
                      <div className="pt-1.5 animate-in fade-in duration-150">
                        <input
                          type="url"
                          placeholder="Paste direct image link (e.g. https://.../photo.jpg)"
                          value={formData.avatarUrl || ''}
                          onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value.trim() || undefined })}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}
                    <p className="text-[11px] text-neutral-400">
                      Display your headshot or branding photo on your master profile & shared digital card.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Professional Headline & Role <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Software Engineer · Product & Systems Developer"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Company / Organization
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="e.g. Tech Innovations Inc."
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="e.g. San Francisco, CA"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Status Pill / Current Focus
                </label>
                <input
                  type="text"
                  placeholder="e.g. 🟢 Open to Roles & Collabs"
                  value={formData.statusBadge}
                  onChange={(e) => setFormData({ ...formData, statusBadge: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {statusPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormData({ ...formData, statusBadge: preset })}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Bio / About Me Summary
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief 2-3 sentence overview highlighting your focus, key technologies, and what you are looking for..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: CONTACT INFO (vCard .vcf) */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-neutral-300 space-y-1">
                <div className="flex items-center gap-2 font-bold text-indigo-300">
                  <Phone className="w-4 h-4" />
                  <span>1-Tap "Save to Address Book" Configuration</span>
                </div>
                <p>
                  When scanners tap "Save Contact" on your landing page, an official Apple/Google Contacts (.vcf) file is generated with these exact details.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Direct Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                  <input
                    type="tel"
                    placeholder="e.g. +1 (555) 234-5678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Primary Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                  <input
                    type="email"
                    placeholder="e.g. alex.morgan@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PORTFOLIOS & LINKS */}
          {activeTab === 'links' && (
            <div className="space-y-5">
              <div className="space-y-3.5">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Primary Touchpoints & Socials
                </h3>

                {/* Portfolio URL */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-violet-400" />
                    Portfolio Website URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/portfolio"
                    value={formData.portfolioUrl}
                    onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Resume URL */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    Resume & CV (PDF Link or Google Drive)
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/resume.pdf"
                    value={formData.resumeUrl}
                    onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* LinkedIn URL */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
                    <Linkedin className="w-3.5 h-3.5 text-sky-400" />
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/alex-morgan-dev"
                    value={formData.linkedinUrl}
                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* GitHub URL */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5 text-neutral-300" />
                    GitHub Profile URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/alexmorgan-dev"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Twitter / X URL */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
                    <Twitter className="w-3.5 h-3.5 text-sky-300" />
                    Twitter / X Profile URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://x.com/alexmorgan_tech"
                    value={formData.twitterUrl}
                    onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Calendly URL */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    Calendly / Meeting Schedule Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://calendly.com/alexmorgan/30min"
                    value={formData.calendlyUrl}
                    onChange={(e) => setFormData({ ...formData, calendlyUrl: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Custom Links Section */}
              <div className="pt-4 border-t border-neutral-800 space-y-3">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Custom Links & Projects ({formData.customLinks.length})
                </h3>

                {formData.customLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{link.title}</p>
                      <p className="text-neutral-400 truncate text-[11px]">{link.url}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomLink(link.id)}
                      className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Add Custom Link Box */}
                <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-2.5">
                  <p className="text-xs font-semibold text-indigo-300 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add Another Custom Link
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Title (e.g. Substack Newsletter)"
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="url"
                      placeholder="URL (https://...)"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Subtitle / Note (Optional)"
                      value={newLinkSubtitle}
                      onChange={(e) => setNewLinkSubtitle(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomLink}
                      disabled={!newLinkTitle.trim() || !newLinkUrl.trim()}
                      className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white text-xs font-bold transition-all shrink-0"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ELEVATOR PITCH */}
          {activeTab === 'pitch' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-neutral-300 space-y-1">
                <div className="flex items-center gap-2 font-bold text-indigo-300">
                  <FileText className="w-4 h-4" />
                  <span>Highlight Story / Elevator Pitch</span>
                </div>
                <p>
                  This appears as an exclusive narrative card on your digital landing page for hiring managers, founders, and conference leads to quickly read your value proposition.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Elevator Pitch Narrative
                </label>
                <textarea
                  rows={6}
                  placeholder="Hi! I am a software engineer focused on building clean, high-performance web applications and scalable cloud systems. Excited to connect and discuss potential collaborations..."
                  value={formData.pitch}
                  onChange={(e) => setFormData({ ...formData, pitch: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer Action Bar */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/90 backdrop-blur-md flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {activeTab !== 'pitch' && (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'identity') setActiveTab('contact');
                  else if (activeTab === 'contact') setActiveTab('links');
                  else if (activeTab === 'links') setActiveTab('pitch');
                }}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors"
              >
                Next Step →
              </button>
            )}

            <button
              type="submit"
              form="edit-profile-form"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/50 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Save & Update Master QR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
