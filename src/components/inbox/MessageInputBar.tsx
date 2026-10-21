'use client';

import React, { useState, useRef, useEffect, useTransition } from 'react';
import { Lead, Agent, Property } from '../../lib/types';
import { sendAgentWhatsAppMessage, generateAiDraft } from '../../lib/actions/messages';
import { formatAED, resolveMediaUrl, buildPublicMediaUrl, getPropertyPreview } from '../../lib/utils';
import { createClient } from '../../lib/supabase/client';
import {
  Send,
  Sparkles,
  Bookmark,
  Building2,
  ExternalLink,
  Loader2,
  Check,
  ChevronDown,
  X,
  AlertCircle,
  Paperclip,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  Link2,
  Share2,
} from 'lucide-react';

interface MessageInputBarProps {
  lead: Lead;
  currentAgent?: Agent | null;
  onMessageSent?: (text: string) => void;
}

interface AttachmentItem {
  url: string;
  name: string;
  size?: number;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  propertyId?: string;
}

export function MessageInputBar({
  lead,
  currentAgent,
  onMessageSent,
}: MessageInputBarProps) {
  const [text, setText] = useState('');
  const [isSending, startSendTransition] = useTransition();
  const [isDrafting, setIsDrafting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showSnippets, setShowSnippets] = useState(false);
  const [showPropertyPicker, setShowPropertyPicker] = useState(false);
  const [showExternalUrlModal, setShowExternalUrlModal] = useState(false);
  const [externalUrlInput, setExternalUrlInput] = useState('');
  const [externalUrlType, setExternalUrlType] = useState<'IMAGE' | 'VIDEO' | 'DOCUMENT'>('IMAGE');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [propertySearch, setPropertySearch] = useState('');
  const [attachment, setAttachment] = useState<AttachmentItem | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const snippetsMenuRef = useRef<HTMLDivElement>(null);
  const propertyPickerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        snippetsMenuRef.current &&
        !snippetsMenuRef.current.contains(event.target as Node)
      ) {
        setShowSnippets(false);
      }
      if (
        propertyPickerRef.current &&
        !propertyPickerRef.current.contains(event.target as Node)
      ) {
        setShowPropertyPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch properties on demand when picker opens
  useEffect(() => {
    if (showPropertyPicker && properties.length === 0) {
      setLoadingProperties(true);
      supabase
        .from('properties')
        .select('*')
        .eq('status', 'AVAILABLE')
        .order('created_at', { ascending: false })
        .limit(30)
        .then(({ data }) => {
          if (data) setProperties(data as Property[]);
          setLoadingProperties(false);
        });
    }
  }, [showPropertyPicker, properties.length, supabase]);

  const leadName = lead.full_name && lead.full_name !== '.' ? lead.full_name : 'there';
  const agentDisplayName = currentAgent?.name || 'Balos Advisor';

  const SNIPPETS = [
    {
      title: 'Viewing Confirmation',
      desc: 'Confirm date, time, and agent contact',
      text: `Hi ${leadName}, looking forward to our property viewing! Our licensed advisor ${agentDisplayName} will meet you at the site. Please let us know if you need any directions or gate clearance in advance.`,
    },
    {
      title: 'Sales Gallery Directions',
      desc: 'Location, valet & arrival details',
      text: `Here are the arrival directions to the developer sales pavilion: Valet parking is available at the main entrance. When you arrive, ask for ${agentDisplayName} at the reception desk. Looking forward to showing you the masterplan!`,
    },
    {
      title: 'Off-Plan Payment Structure',
      desc: 'Explain construction milestones & handover',
      text: `This project features a competitive 60/40 developer payment plan: 20% down payment on reservation, 40% tied to construction milestones, and 40% on handover with 0% interest. Would you like the official unit price breakdown?`,
    },
    {
      title: 'UAE Golden Visa (AED 2.0M+)',
      desc: 'Explain 10-year residency eligibility',
      text: `Because this property value exceeds AED 2,000,000, your purchase directly qualifies you and your immediate family for the renewable 10-Year UAE Golden Residency Visa upon title deed registration.`,
    },
    {
      title: 'Direct Broker Check-in',
      desc: 'Introduce human broker on site',
      text: `Hi ${leadName}, this is ${agentDisplayName} stepping in directly from Balos Real Estate. I am on site today and available to answer any specific questions or hop on a brief call. How can I best assist you?`,
    },
  ];

  const handleInsertSnippet = (snippetText: string) => {
    setText((prev) => (prev ? `${prev}\n\n${snippetText}` : snippetText));
    setShowSnippets(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  /**
   * Builds the formatted WhatsApp details string for a property
   */
  const buildPropertyDetailsText = (p: Property) => {
    const formattedPrice = formatAED(p.price_aed);
    const goldenVisaTag = p.golden_visa_eligible
      ? '✨ *UAE Golden Visa:* Eligible for 10-Year Residency (AED 2.0M+)\n'
      : '';
    const permitTag = p.trakheesi_permit_no
      ? `📜 *DLD Trakheesi Permit:* #${p.trakheesi_permit_no}\n`
      : '';
    const handoverTag = p.handover_date
      ? `🏗️ *Handover:* ${p.handover_date}\n`
      : '';
    const roiTag = p.projected_roi
      ? `📈 *Projected ROI:* ${p.projected_roi}%\n`
      : '';
    const brochureTag = p.brochure_url
      ? `📄 *Brochure:* ${resolveMediaUrl(p.brochure_url)}\n`
      : '';
    const videoTag = p.video_url
      ? `🎥 *Video Tour:* ${resolveMediaUrl(p.video_url)}\n`
      : '';

    let paymentPlanText = '';
    if (typeof p.payment_plan === 'object' && p.payment_plan !== null) {
      paymentPlanText = `💳 *Payment Plan:* ${Object.entries(p.payment_plan)
        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}%`)
        .join(' | ')}\n`;
    } else if (p.market_type === 'OFF_PLAN') {
      paymentPlanText = `💳 *Payment Plan:* 20% Down Payment | 40% Construction | 40% Handover\n`;
    }

    return `🏡 *${p.title}*
📍 *Location:* ${p.community}${p.developer ? ` • by ${p.developer}` : ''}
💰 *Price:* ${formattedPrice}
📐 *Layout:* ${p.bedrooms === 0 ? 'Studio' : `${p.bedrooms} Beds`} | ${p.bathrooms ? `${p.bathrooms} Baths` : 'Luxury layout'} | ${p.size_sqft ? `${Number(p.size_sqft).toLocaleString()} sq ft` : 'Spacious'}
🏷️ *Market:* ${p.market_type === 'OFF_PLAN' ? 'Off-Plan' : 'Ready Secondary'}
${handoverTag}${paymentPlanText}${roiTag}${goldenVisaTag}${permitTag}${brochureTag}${videoTag}
Would you like me to reserve a private walkthrough or send the detailed floor plans?`.trim();
  };

  /**
   * One-click direct send of a Property Suggestion to WhatsApp:
   * Dispatches the image/video plus all attached details immediately.
   */
  const handleDirectSendProperty = (p: Property) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const preview = getPropertyPreview(p);
    const mediaSource = p.video_url || preview.url || null;
    const mediaType: 'IMAGE' | 'VIDEO' = p.video_url || preview.isVideo ? 'VIDEO' : 'IMAGE';
    const messageContent = buildPropertyDetailsText(p);

    startSendTransition(async () => {
      const res = await sendAgentWhatsAppMessage({
        leadId: lead.id,
        text: messageContent,
        agentId: currentAgent?.id || null,
        agentName: currentAgent?.name || 'Agent',
        mediaUrl: mediaSource ? resolveMediaUrl(mediaSource) : null,
        mediaType,
        fileName: `${p.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_showcase`,
        propertyId: p.id,
      });

      if (res.success) {
        setShowPropertyPicker(false);
        setSuccessMsg(`Property suggestion for "${p.title}" sent with media & details!`);
        if (onMessageSent) {
          onMessageSent(messageContent);
        }
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(res.error || 'Failed to dispatch property suggestion.');
      }
    });
  };

  /**
   * Injects property details into message composer and attaches cover media
   */
  const handleInsertPropertyToComposer = (p: Property) => {
    const details = buildPropertyDetailsText(p);
    const preview = getPropertyPreview(p);
    const mediaSource = p.video_url || preview.url || null;
    const mediaType: 'IMAGE' | 'VIDEO' = p.video_url || preview.isVideo ? 'VIDEO' : 'IMAGE';

    setText((prev) => (prev ? `${prev}\n\n${details}` : details));
    if (mediaSource) {
      setAttachment({
        url: resolveMediaUrl(mediaSource),
        name: `${p.title} Preview`,
        type: mediaType,
        propertyId: p.id,
      });
    }

    setShowPropertyPicker(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  /**
   * Uploads an external file (image, video, document/PDF) to Supabase Storage
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);

    try {
      let detectedType: 'IMAGE' | 'VIDEO' | 'DOCUMENT' = 'DOCUMENT';
      if (file.type.startsWith('image/')) {
        detectedType = 'IMAGE';
      } else if (file.type.startsWith('video/')) {
        detectedType = 'VIDEO';
      }

      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `chat-attachments/${Date.now()}_${cleanFileName}`;

      const { data, error } = await supabase.storage
        .from('property-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(error.message);
      }

      if (data) {
        const fullUrl = buildPublicMediaUrl(data.path);
        setAttachment({
          url: fullUrl,
          name: file.name,
          size: file.size,
          type: detectedType,
        });
        setSuccessMsg(`Attached ${file.name}`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      setErrorMsg(`Failed to upload attachment: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /**
   * Attach by external URL
   */
  const handleAttachExternalUrl = () => {
    if (!externalUrlInput.trim()) return;
    setAttachment({
      url: externalUrlInput.trim(),
      name: externalUrlInput.split('/').pop() || 'External Attachment',
      type: externalUrlType,
    });
    setExternalUrlInput('');
    setShowExternalUrlModal(false);
  };

  const handleGenerateDraft = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsDrafting(true);

    try {
      const res = await generateAiDraft({
        leadId: lead.id,
      });

      if (res.success && res.draft) {
        setText(res.draft);
        setSuccessMsg('AI draft generated! Review or edit before sending.');
      } else {
        setErrorMsg(res.error || 'Could not generate AI draft.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error communicating with AI engine in n8n.');
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSend = () => {
    if ((!text.trim() && !attachment) || isSending) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const messageToSend = text.trim();

    startSendTransition(async () => {
      const res = await sendAgentWhatsAppMessage({
        leadId: lead.id,
        text: messageToSend,
        agentId: currentAgent?.id || null,
        agentName: currentAgent?.name || 'Agent',
        mediaUrl: attachment?.url || null,
        mediaType: attachment?.type || null,
        fileName: attachment?.name || null,
        propertyId: attachment?.propertyId || null,
      });

      if (res.success) {
        setText('');
        setAttachment(null);
        setSuccessMsg('WhatsApp message dispatched!');
        if (onMessageSent) {
          onMessageSent(messageToSend);
        }
        setTimeout(() => setSuccessMsg(null), 3500);
      } else {
        setErrorMsg(res.error || 'Failed to dispatch message.');
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const rawPhone = lead.e164_phone || lead.whatsapp_id || '';
  const cleanPhone = rawPhone.replace(/\D/g, '');

  const filteredProperties = properties.filter((p) => {
    if (!propertySearch.trim()) return true;
    const q = propertySearch.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.community.toLowerCase().includes(q) ||
      (p.developer && p.developer.toLowerCase().includes(q))
    );
  });

  return (
    <div className="border-t border-border bg-surface shadow-xs">
      {/* Hidden file input for attachment upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm,application/pdf,.doc,.docx,.xls,.xlsx"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Alert banner for error or success */}
      {errorMsg && (
        <div className="px-3.5 py-1.5 bg-coral/10 border-b border-coral/20 text-coral text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="px-3.5 py-1.5 bg-creek-light border-b border-creek/20 text-creek text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Attachment Preview Chip */}
      {attachment && (
        <div className="px-3.5 py-2 bg-creek-light/40 border-b border-creek/20 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            {attachment.type === 'IMAGE' && (
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-creek/30 shrink-0 bg-black">
                <img src={attachment.url} alt="Attachment" className="w-full h-full object-cover" />
              </div>
            )}
            {attachment.type === 'VIDEO' && (
              <div className="w-8 h-8 rounded-lg bg-ink text-white flex items-center justify-center shrink-0">
                <VideoIcon className="w-4 h-4 text-white" />
              </div>
            )}
            {attachment.type === 'DOCUMENT' && (
              <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0 text-creek">
                <FileText className="w-4 h-4" />
              </div>
            )}

            <div className="min-w-0">
              <span className="font-semibold text-ink text-xs truncate block">
                {attachment.name}
              </span>
              <span className="text-[10px] text-ink-muted flex items-center gap-1">
                <span className="uppercase font-bold text-creek">{attachment.type}</span>
                {attachment.size && <span>• {(attachment.size / (1024 * 1024)).toFixed(1)} MB</span>}
                <span>• Will be sent to WhatsApp with message</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="p-1 rounded-lg hover:bg-coral-light text-ink-muted hover:text-coral transition"
            title="Remove attachment"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Uploading progress indicator */}
      {isUploading && (
        <div className="px-3.5 py-1.5 bg-surface-subtle border-b border-border text-xs text-creek flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-creek" />
          <span>Uploading media asset to Supabase cloud storage...</span>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="px-3 py-2 border-b border-border/60 bg-surface-subtle flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* AI Co-Pilot Button */}
          <button
            type="button"
            onClick={handleGenerateDraft}
            disabled={isDrafting || isSending}
            title="Generate a context-aware luxury broker reply via n8n & NVIDIA DeepSeek"
            className="px-2.5 py-1 rounded-lg bg-creek-light hover:bg-creek-light/80 text-creek border border-creek/30 font-semibold inline-flex items-center gap-1.5 transition disabled:opacity-60 text-xs"
          >
            {isDrafting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-creek" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-creek" />
            )}
            <span>AI Draft</span>
          </button>

          {/* Attach Media / File Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isSending}
            title="Attach images, videos, brochures, or PDF floorplans"
            className="px-2.5 py-1 rounded-lg bg-surface hover:bg-seaglass border border-border text-ink-muted hover:text-ink font-medium inline-flex items-center gap-1.5 transition text-xs"
          >
            <Paperclip className="w-3.5 h-3.5 text-ink-muted" />
            <span>Attach Media / File</span>
          </button>

          {/* Attach by External URL */}
          <button
            type="button"
            onClick={() => setShowExternalUrlModal(!showExternalUrlModal)}
            title="Link external media URL or video link"
            className="px-2 py-1 rounded-lg bg-surface hover:bg-seaglass border border-border text-ink-muted hover:text-ink font-medium inline-flex items-center gap-1 transition text-xs"
          >
            <Link2 className="w-3.5 h-3.5 text-ink-muted" />
            <span className="hidden sm:inline">URL link</span>
          </button>

          {/* Quick Snippets Menu */}
          <div className="relative" ref={snippetsMenuRef}>
            <button
              type="button"
              onClick={() => {
                setShowSnippets(!showSnippets);
                setShowPropertyPicker(false);
              }}
              className="px-2.5 py-1 rounded-lg bg-surface hover:bg-seaglass border border-border text-ink-muted hover:text-ink font-medium inline-flex items-center gap-1.5 transition text-xs"
            >
              <Bookmark className="w-3.5 h-3.5 text-ink-muted" />
              <span>Snippets</span>
              <ChevronDown className="w-3 h-3 text-ink-faint" />
            </button>

            {showSnippets && (
              <div className="absolute left-0 bottom-full mb-1 w-80 bg-surface rounded-xl border border-border shadow-lg z-50 p-1.5 divide-y divide-border/50 animate-in fade-in zoom-in-95">
                <div className="p-2 text-[11px] font-semibold text-ink-muted uppercase tracking-wider flex items-center justify-between">
                  <span>Real Estate Canned Snippets</span>
                  <X
                    className="w-3.5 h-3.5 cursor-pointer text-ink-faint hover:text-ink"
                    onClick={() => setShowSnippets(false)}
                  />
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-border/40 py-1">
                  {SNIPPETS.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleInsertSnippet(s.text)}
                      className="w-full text-left p-2 hover:bg-creek-subtle rounded-lg transition group"
                    >
                      <div className="font-semibold text-xs text-ink group-hover:text-creek">
                        {s.title}
                      </div>
                      <div className="text-[11px] text-ink-muted line-clamp-1">
                        {s.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Property Suggestion Menu */}
          <div className="relative" ref={propertyPickerRef}>
            <button
              type="button"
              onClick={() => {
                setShowPropertyPicker(!showPropertyPicker);
                setShowSnippets(false);
              }}
              className="px-2.5 py-1 rounded-lg bg-creek-light/70 hover:bg-creek-light text-creek border border-creek/30 font-semibold inline-flex items-center gap-1.5 transition text-xs"
            >
              <Building2 className="w-3.5 h-3.5 text-creek" />
              <span>Suggest Property</span>
              <ChevronDown className="w-3 h-3 text-creek" />
            </button>

            {showPropertyPicker && (
              <div className="absolute left-0 bottom-full mb-1 w-88 sm:w-96 bg-surface rounded-2xl border border-border shadow-2xl z-50 p-3 divide-y divide-border/50 animate-in fade-in zoom-in-95">
                <div className="p-1 pb-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-bold text-ink uppercase tracking-wider block">
                        Property Suggestions
                      </span>
                      <span className="text-[10px] text-ink-muted">
                        Sends photo, video tour, specs & payment plan directly to WhatsApp
                      </span>
                    </div>
                    <X
                      className="w-4 h-4 cursor-pointer text-ink-faint hover:text-ink"
                      onClick={() => setShowPropertyPicker(false)}
                    />
                  </div>
                  <input
                    type="text"
                    value={propertySearch}
                    onChange={(e) => setPropertySearch(e.target.value)}
                    placeholder="Search by community, developer, or title..."
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-border bg-surface-subtle focus:outline-none focus:border-creek"
                  />
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-border/40 py-1.5 space-y-1">
                  {loadingProperties ? (
                    <div className="p-5 text-center text-xs text-ink-muted flex items-center justify-center gap-1.5">
                      <Loader2 className="w-4 h-4 animate-spin text-creek" />
                      <span>Loading active property listings...</span>
                    </div>
                  ) : filteredProperties.length === 0 ? (
                    <div className="p-5 text-center text-xs text-ink-muted">
                      No matching properties found in inventory.
                    </div>
                  ) : (
                    filteredProperties.map((p) => {
                      const prev = getPropertyPreview(p);
                      return (
                        <div
                          key={p.id}
                          className="p-2.5 hover:bg-surface-subtle rounded-xl border border-transparent hover:border-border transition space-y-2"
                        >
                          <div className="flex items-start gap-2.5">
                            <img
                              src={prev.url}
                              alt={p.title}
                              className="w-12 h-12 rounded-lg object-cover bg-seaglass shrink-0 border border-border"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-xs text-ink truncate">
                                  {p.title}
                                </span>
                                <span className="text-xs font-bold text-creek shrink-0">
                                  {formatAED(p.price_aed)}
                                </span>
                              </div>
                              <div className="text-[11px] text-ink-muted flex items-center gap-1.5 truncate mt-0.5">
                                <span>{p.community}</span>
                                <span>•</span>
                                <span>{p.bedrooms === 0 ? 'Studio' : `${p.bedrooms} Beds`}</span>
                                {p.golden_visa_eligible && (
                                  <span className="text-creek font-semibold">
                                    • Golden Visa
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons for this property suggestion */}
                          <div className="flex items-center gap-1.5 pt-1 border-t border-border/40">
                            <button
                              type="button"
                              onClick={() => handleDirectSendProperty(p)}
                              disabled={isSending}
                              className="flex-1 py-1.5 px-2.5 rounded-lg bg-creek hover:bg-creek-hover text-white text-[11px] font-semibold flex items-center justify-center gap-1 shadow-2xs transition disabled:opacity-50"
                              title="Instantly dispatch to WhatsApp with media & full details"
                            >
                              <Send className="w-3 h-3" />
                              <span>Send to WhatsApp</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleInsertPropertyToComposer(p)}
                              className="py-1.5 px-2.5 rounded-lg border border-border hover:bg-seaglass text-ink text-[11px] font-medium transition"
                              title="Insert text & attach photo into composer to edit before sending"
                            >
                              <span>Insert & Edit</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status notice */}
        <div className="flex items-center gap-1.5 text-[11px] text-ink-faint">
          <span className="w-2 h-2 rounded-full bg-coral inline-block" />
          <span>Strict Handoff: AI remains paused while you chat</span>
        </div>
      </div>

      {/* External URL Attachment Modal */}
      {showExternalUrlModal && (
        <div className="p-3 bg-surface-subtle border-b border-border flex flex-col sm:flex-row items-center gap-2 animate-in fade-in">
          <input
            type="url"
            value={externalUrlInput}
            onChange={(e) => setExternalUrlInput(e.target.value)}
            placeholder="Paste public image, video MP4, or PDF URL..."
            className="flex-1 w-full px-3 py-1.5 text-xs rounded-xl border border-border bg-surface text-ink focus:outline-none focus:border-creek"
          />
          <select
            value={externalUrlType}
            onChange={(e) => setExternalUrlType(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-border bg-surface text-ink"
          >
            <option value="IMAGE">Image</option>
            <option value="VIDEO">Video</option>
            <option value="DOCUMENT">Document / PDF</option>
          </select>
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleAttachExternalUrl}
              className="px-3 py-1.5 rounded-xl bg-creek text-white text-xs font-semibold"
            >
              Attach
            </button>
            <button
              type="button"
              onClick={() => setShowExternalUrlModal(false)}
              className="px-2 py-1.5 text-xs text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Textarea Input Container */}
      <div className="p-2.5 flex items-end gap-2">
        <div className="flex-1 min-w-0 relative">
          <textarea
            ref={textareaRef}
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            placeholder={`Type a WhatsApp message to ${leadName}... (Press Enter to send, Shift+Enter for new line)`}
            className="w-full p-2.5 text-xs text-ink bg-surface rounded-xl border border-border focus:border-creek focus:ring-1 focus:ring-creek focus:outline-none resize-none transition shadow-2xs placeholder:text-ink-faint"
          />
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={(!text.trim() && !attachment) || isSending}
          title="Send WhatsApp message with any attachments via n8n & WAHA"
          className="h-10 px-4 rounded-xl bg-creek hover:bg-creek-hover text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shrink-0"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>

      {/* Footer Utility Row */}
      <div className="px-3 py-1.5 bg-surface-subtle border-t border-border/40 flex items-center justify-between text-[11px] text-ink-faint">
        <div className="flex items-center gap-2">
          <span>Target phone: <b>+{cleanPhone || 'N/A'}</b></span>
          <span>•</span>
          <span>Delivered via Balos n8n Engine</span>
        </div>
        <div>
          <span>Press <b>Enter</b> to send</span>
        </div>
      </div>
    </div>
  );
}
