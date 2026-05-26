import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Paperclip, Image as ImageIcon, FileText, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '../store';
import { cn, timeAgo } from '../lib/utils';
import { uploadFile, getAttachmentType } from '../lib/upload';

export default function ChatPage() {
  const { t, i18n } = useTranslation();
  const {
    profile,
    chatMessages,
    canAccessChat,
    sendChatMessage,
    profiles,
  } = useStore();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const messages = chatMessages.map((m) => ({
    ...m,
    profile: m.profile ?? profiles.find((p) => p.id === m.user_id),
  }));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const ok = sendChatMessage(text);
    setSending(false);
    if (ok) {
      setText('');
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canAccessChat()) return;
    setSending(true);
    try {
      const url = await uploadFile(file, 'chat');
      const type = getAttachmentType(file);
      const ok = sendChatMessage(text.trim(), { url, type, name: file.name });
      if (ok) setText('');
    } catch (err) {
      toast.error(
        err instanceof Error && err.message === 'FILE_TOO_LARGE'
          ? t('chat.file_too_large')
          : t('common.error')
      );
    } finally {
      setSending(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <p className="text-white/40 text-sm text-center">{t('chat.auth_required')}</p>
      </div>
    );
  }

  if (!canAccessChat()) {
    return (
      <div className="px-4 py-8 flex flex-col items-center gap-4 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-royal/10 border border-royal/30 flex items-center justify-center">
          <Lock size={28} className="text-royal-light" />
        </div>
        <h2 className="text-lg font-display font-bold text-white text-center">
          {t('chat.locked_title')}
        </h2>
        <p className="text-sm text-white/50 text-center max-w-xs">
          {profile.status === 'pending'
            ? t('chat.pending_profile')
            : profile.status === 'rejected'
              ? t('chat.rejected_profile')
              : t('chat.blacklisted')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] min-h-[400px] animate-fade-in">
      <div className="px-4 py-3 border-b border-glass-border">
        <h2 className="text-lg font-display font-bold text-white">{t('chat.title')}</h2>
        <p className="text-xs text-white/40 mt-0.5">{t('chat.subtitle')}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-sm text-white/30">{t('chat.empty')}</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.user_id === profile.id;
            return (
              <div
                key={msg.id}
                className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 space-y-1.5',
                    isMine
                      ? 'bg-royal/25 border border-royal/40 rounded-br-md'
                      : 'glass-panel rounded-bl-md'
                  )}
                >
                  {!isMine && (
                    <p className="text-[10px] font-semibold text-royal-light">
                      {msg.profile?.first_name ?? '—'}
                    </p>
                  )}
                  {msg.body && (
                    <p className="text-sm text-white/90 whitespace-pre-wrap break-words">
                      {msg.body}
                    </p>
                  )}
                  {msg.attachment_url && (
                    <div className="mt-1">
                      {msg.attachment_type === 'image' ? (
                        <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={msg.attachment_url}
                            alt=""
                            className="max-w-full rounded-lg max-h-48 object-cover"
                          />
                        </a>
                      ) : (
                        <a
                          href={msg.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-royal-light hover:underline"
                        >
                          <FileText size={14} />
                          {msg.attachment_name ?? t('chat.attachment')}
                        </a>
                      )}
                    </div>
                  )}
                  <p className="text-[10px] text-white/25 text-right">
                    {timeAgo(msg.created_at, i18n.language)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-glass-border bg-obsidian/90 backdrop-blur-xl safe-bottom">
        <div className="flex gap-2 items-end">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
            onChange={handleFile}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={sending}
            aria-label={t('chat.attach')}
            className="shrink-0 ui-btn-icon w-10 h-10 text-white/50"
          >
            <Paperclip size={18} />
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('chat.placeholder')}
            rows={1}
            className="input-glass flex-1 py-2.5 text-sm resize-none min-h-[40px] max-h-24"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className={cn(
              'shrink-0 w-10 h-10 flex items-center justify-center',
              text.trim() ? 'btn-primary !py-0 !px-0 w-10 h-10' : 'ui-btn-icon text-white/30'
            )}
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-white/25 mt-2 flex items-center gap-1">
          <ImageIcon size={10} />
          {t('chat.attach_hint')}
        </p>
      </div>
    </div>
  );
}
