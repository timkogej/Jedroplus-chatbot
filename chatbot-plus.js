/**
 * Chatbot+ Premium Widget
 * A stunning, modern chat widget with dynamic theming and smooth animations
 * Version: 2.0.0
 *
 * Usage:
 *   <script src="chatbot-plus.js"></script>
 *   <script>
 *     ChatbotPlus.init({
 *       companySlug: 'my-company',
 *       webhookUrl: 'https://your-proxy/api/chat'  // REQUIRED
 *     });
 *   </script>
 */

(function(window, document) {
  'use strict';

  // ========================================
  // CONFIGURATION & CONSTANTS
  // ========================================

  // Supabase configuration
  const SUPABASE_URL = 'https://xdudtawctybnphdpvlwu.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkdWR0YXdjdHlibnBoZHB2bHd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0Mzg2NzMsImV4cCI6MjA3NDAxNDY3M30.zpvaAhMfY2uQBt0GGyCIPceIWuOfA5rqJ9MvvxKvycs';

  // n8n webhook — must be set via options.webhookUrl in ChatbotPlus.init().
  // Never expose the n8n webhook URL directly; always use a secure proxy server.
  let API_ENDPOINT = null;
  let API_KEY = null; // Set via options.apiKey — added as X-API-Key header on every n8n call.

  const FALLBACK_THEME = {
    bg: { from: '#667eea', to: '#764ba2' },
    userBubble: { from: '#667eea', to: '#764ba2' },
    userMessageBg: { from: '#667eea', to: '#764ba2' },
    botBubble: { from: '#f8fafc', to: '#f1f5f9' },
    accent: { from: '#667eea', to: '#764ba2' },
    textColor: '#1f2937',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    borderRadius: '24px'
  };

  // Translations by language
  const TRANSLATIONS = {
    sl: {
      suggestions: [
        'Rezerviraj termin',
        'Kontaktni podatki',
        'Delovni čas',
        'Cenik storitev'
      ],
      welcomeTitle: 'Pozdravljeni!',
      welcomeText: 'Kako vam lahko danes pomagam? Izberite eno od spodnjih možnosti ali napišite svoje vprašanje.',
      statusOnline: 'Na voljo za klepet',
      inputPlaceholder: 'Napišite sporočilo...',
      sendError: 'Sporočila ni bilo mogoče poslati. Prosim poskusite znova.',
      connectionError: 'Povezava ni uspela. Prosimo, poskusite znova.',
      openChat: 'Odpri klepet',
      closeChat: 'Zapri klepet',
      confirmBooking: 'Potrdi',
      changeBooking: 'Spremeni'
    },
    en: {
      suggestions: [
        'Book an appointment',
        'Contact information',
        'Working hours',
        'Pricing'
      ],
      welcomeTitle: 'Hello!',
      welcomeText: 'How can I help you today? Choose one of the options below or type your question.',
      statusOnline: 'Available for chat',
      inputPlaceholder: 'Type a message...',
      sendError: 'Could not send message. Please try again.',
      connectionError: 'Connection failed. Please try again.',
      openChat: 'Open chat',
      closeChat: 'Close chat',
      confirmBooking: 'Confirm',
      changeBooking: 'Change'
    },
    de: {
      suggestions: [
        'Termin buchen',
        'Kontaktinformationen',
        'Öffnungszeiten',
        'Preisliste'
      ],
      welcomeTitle: 'Hallo!',
      welcomeText: 'Wie kann ich Ihnen heute helfen? Wählen Sie eine der folgenden Optionen oder stellen Sie Ihre Frage.',
      statusOnline: 'Für Chat verfügbar',
      inputPlaceholder: 'Nachricht schreiben...',
      sendError: 'Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es erneut.',
      connectionError: 'Verbindung fehlgeschlagen. Bitte versuchen Sie es erneut.',
      openChat: 'Chat öffnen',
      closeChat: 'Chat schließen',
      confirmBooking: 'Bestätigen',
      changeBooking: 'Ändern'
    },
    hr: {
      suggestions: [
        'Rezerviraj termin',
        'Kontakt podaci',
        'Radno vrijeme',
        'Cjenik usluga'
      ],
      welcomeTitle: 'Pozdrav!',
      welcomeText: 'Kako vam mogu pomoći danas? Odaberite jednu od opcija ispod ili napišite svoje pitanje.',
      statusOnline: 'Dostupan za razgovor',
      inputPlaceholder: 'Napišite poruku...',
      sendError: 'Poruka nije mogla biti poslana. Molimo pokušajte ponovo.',
      connectionError: 'Povezivanje nije uspjelo. Molimo pokušajte ponovo.',
      openChat: 'Otvori chat',
      closeChat: 'Zatvori chat',
      confirmBooking: 'Potvrdi',
      changeBooking: 'Promijeni'
    },
    it: {
      suggestions: [
        'Prenota un appuntamento',
        'Informazioni di contatto',
        'Orari di lavoro',
        'Listino prezzi'
      ],
      welcomeTitle: 'Ciao!',
      welcomeText: 'Come posso aiutarti oggi? Scegli una delle opzioni qui sotto o scrivi la tua domanda.',
      statusOnline: 'Disponibile per chat',
      inputPlaceholder: 'Scrivi un messaggio...',
      sendError: 'Impossibile inviare il messaggio. Per favore riprova.',
      connectionError: 'Connessione fallita. Per favore riprova.',
      openChat: 'Apri chat',
      closeChat: 'Chiudi chat',
      confirmBooking: 'Conferma',
      changeBooking: 'Modifica'
    }
  };

  // Get translations for language (fallback to Slovenian)
  function getTranslations(lang) {
    return TRANSLATIONS[lang] || TRANSLATIONS['sl'];
  }

  // Get suggestions for language (fallback to Slovenian)
  function getSuggestionsForLanguage(lang) {
    const t = getTranslations(lang);
    return t.suggestions;
  }

  // ========================================
  // SVG ICONS
  // ========================================

  const ICONS = {
    chat: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.08L2 22l4.92-1.36C8.42 21.5 10.15 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.58 0-3.08-.42-4.38-1.14l-.32-.18-3.27.86.86-3.27-.2-.32A7.96 7.96 0 0 1 4 12c0-4.42 3.58-8 8-8s8 3.58 8 8-3.58 8-8 8z"/>
      <circle cx="8" cy="12" r="1.5"/>
      <circle cx="12" cy="12" r="1.5"/>
      <circle cx="16" cy="12" r="1.5"/>
    </svg>`,
    close: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/>
    </svg>`,
    send: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.4 20.4l17.45-7.48a1 1 0 0 0 0-1.84L3.4 3.6a.993.993 0 0 0-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z"/>
    </svg>`,
    bot: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5 2.5 2.5 0 0 0 7.5 18a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 7.5 13m9 0a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5 2.5 2.5 0 0 0-2.5-2.5z"/>
    </svg>`,
    error: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
    </svg>`,
    sparkle: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/>
    </svg>`
  };

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================

  /**
   * Generate a unique session ID (UUID v4)
   */
  function generateSessionId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Get company slug from URL path /chatbot/{slug} or URL parameter
   */
  function getCompanySlugFromUrl() {
    // First try to get slug from URL path: /chatbot/{slug}
    const pathMatch = window.location.pathname.match(/\/chatbot\/([^\/]+)/);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1];
    }
    // Fallback to URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('company_slug') || 'test-podjetje';
  }

  /**
   * Fetch company theme data from Supabase
   */
  async function fetchCompanyTheme(slug) {
    // Use chatbot_theme view (exposes only chat-related columns)
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/chatbot_theme?slug=eq.${encodeURIComponent(slug)}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch company data: ${response.status}`);
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      throw new Error(`Company not found: ${slug}`);
    }

    const company = data[0];

    // Get language and suggestions
    const language = company.chatbot_jezik || 'sl';
    const suggestions = getSuggestionsForLanguage(language);

    // Map Supabase columns to theme object
    return {
      theme: {
        bg: {
          from: company.chat_bg_gradient_from || FALLBACK_THEME.bg.from,
          to: company.chat_bg_gradient_to || FALLBACK_THEME.bg.to
        },
        userBubble: {
          from: company.chat_user_bubble_gradient_from || FALLBACK_THEME.userBubble.from,
          to: company.chat_user_bubble_gradient_to || FALLBACK_THEME.userBubble.to
        },
        userMessageBg: {
          from: company.chat_user_msg_gradient_from || company.chat_user_bubble_gradient_from || FALLBACK_THEME.userMessageBg.from,
          to: company.chat_user_msg_gradient_to || company.chat_user_bubble_gradient_to || FALLBACK_THEME.userMessageBg.to
        },
        botBubble: {
          from: company.chat_bot_bubble_gradient_from || FALLBACK_THEME.botBubble.from,
          to: company.chat_bot_bubble_gradient_to || FALLBACK_THEME.botBubble.to
        },
        accent: {
          from: company.chat_accent_gradient_from || FALLBACK_THEME.accent.from,
          to: company.chat_accent_gradient_to || FALLBACK_THEME.accent.to
        },
        textColor: company.chat_text_color || FALLBACK_THEME.textColor,
        fontFamily: company.chat_font_family || FALLBACK_THEME.fontFamily,
        borderRadius: company.chat_border_radius || FALLBACK_THEME.borderRadius
      },
      botName: company.chatbot_name || 'Asistent',
      greeting: company.chatbot_pozdrav || null,
      language: language,
      suggestions: suggestions
    };
  }

  /**
   * Convert gradient object to CSS linear-gradient
   */
  function toGradient(gradientObj, angle = 135) {
    if (!gradientObj || typeof gradientObj !== 'object') {
      return gradientObj || 'transparent';
    }
    return `linear-gradient(${angle}deg, ${gradientObj.from}, ${gradientObj.to})`;
  }

  /**
   * Format timestamp to readable time
   */
  function formatTime(date) {
    return new Intl.DateTimeFormat('sl-SI', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Simple markdown-like parsing (bold, italic, links)
   */
  function parseMarkdown(text) {
    let html = escapeHtml(text);
    // Bold: **text** or __text__
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    // Italic: *text* or _text_
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');
    // Links: [text](url)
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    // Line breaks
    html = html.replace(/\n/g, '<br>');
    return html;
  }

  // ========================================
  // STATE PERSISTENCE HELPERS
  // ========================================

  function getPersistedState(sessionId) {
    try {
      const raw = localStorage.getItem('jedro_chat_state:' + sessionId);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('[Chatbot+] Failed to read persisted state:', e);
      return null;
    }
  }

  function setPersistedState(sessionId, state) {
    try {
      if (state != null) {
        localStorage.setItem('jedro_chat_state:' + sessionId, JSON.stringify(state));
      }
    } catch (e) {
      console.warn('[Chatbot+] Failed to persist state:', e);
    }
  }

  function getPersistedLastBotQuestion(sessionId) {
    try {
      return localStorage.getItem('jedro_last_bot_q:' + sessionId) || null;
    } catch (e) {
      return null;
    }
  }

  function setPersistedLastBotQuestion(sessionId, question) {
    try {
      if (question != null) {
        localStorage.setItem('jedro_last_bot_q:' + sessionId, question);
      }
    } catch (e) {
      console.warn('[Chatbot+] Failed to persist lastBotQuestion:', e);
    }
  }

  function n8nHeaders(extra = {}) {
    const h = { 'Content-Type': 'application/json', ...extra };
    if (API_KEY) h['X-API-Key'] = API_KEY;
    return h;
  }

  // ========================================
  // CHATBOT PLUS CLASS
  // ========================================

  class ChatbotPlusWidget {
    constructor(options = {}) {
      // SECURITY: webhookUrl is required — never expose n8n URL directly
      if (!options.webhookUrl) {
        console.error('[Chatbot+] ❌ SECURITY ERROR: webhookUrl is required!');
        console.error('[Chatbot+] Usage: ChatbotPlus.init({ companySlug: "x", webhookUrl: "https://your-proxy/api/chat" })');
        throw new Error('ChatbotPlus: webhookUrl is required for security reasons');
      }

      // Configuration
      this.companySlug = options.companySlug || getCompanySlugFromUrl();
      API_ENDPOINT = options.webhookUrl;
      if (options.apiKey) API_KEY = options.apiKey;
      this.sessionId = sessionStorage.getItem('chatbot-plus-session-id') || generateSessionId();
      this.suggestions = options.suggestions || getSuggestionsForLanguage('sl');

      // Persist session ID
      sessionStorage.setItem('chatbot-plus-session-id', this.sessionId);

      // State — restore from localStorage if available
      this.lastBotMessage = getPersistedLastBotQuestion(this.sessionId);
      this.chatState = getPersistedState(this.sessionId);
      this.chatTheme = null;
      this.chatBotName = 'Asistent';
      this.language = 'sl';
      this.translations = getTranslations('sl');
      this.messages = [];
      this.isOpen = false;
      this.sending = false;
      this.initializing = true;
      this.widgetReady = false;
      this.hasBootstrapped = false;
      this.unreadCount = 0;
      this.soundEnabled = options.soundEnabled !== false;
      this.showSuggestions = true;

      // Consent state
      this.consentGiven = null;
      try { this.consentGiven = localStorage.getItem('jedroplus_chatbot_consent'); } catch(e) {}
      this.consentArea = null;
      this.pendingGreeting = null;

      // DOM References
      this.container = null;
      this.launcher = null;
      this.window = null;
      this.messagesContainer = null;
      this.suggestionsContainer = null;
      this.input = null;

      // Bind methods
      this.handleToggle = this.handleToggle.bind(this);
      this.handleSend = this.handleSend.bind(this);
      this.handleKeydown = this.handleKeydown.bind(this);
      this.handleSuggestionClick = this.handleSuggestionClick.bind(this);
    }

    // ========================================
    // INITIALIZATION
    // ========================================

    async init() {
      if (this.hasBootstrapped) return;
      this.hasBootstrapped = true;

      try {
        // Load CSS if not already loaded
        this.loadStyles();

        if (this.consentGiven === 'accepted') {
          // Full bootstrap: fetch theme from Supabase + call n8n
          await this.bootstrap();
        } else {
          // Load theme only for consent screen (no data sent to n8n)
          await this.loadThemeOnly();
        }

        // Mark widget as ready
        this.widgetReady = true;
        this.initializing = false;

        // Render the widget
        this.render();

        // Apply theme
        this.applyTheme();

        console.log('[Chatbot+] Widget initialized successfully');
      } catch (error) {
        console.error('[Chatbot+] Initialization failed:', error);
        // Still render with fallback theme
        this.chatTheme = FALLBACK_THEME;
        this.widgetReady = true;
        this.initializing = false;
        this.render();
        this.applyTheme();
        if (this.consentGiven === 'accepted') {
          this.addErrorMessage(this.translations.connectionError);
        }
      }
    }

    /**
     * Load widget styles dynamically
     */
    loadStyles() {
      // Check if styles already loaded
      if (document.getElementById('chatbot-plus-styles')) return;

      // Try to find chatbot-plus.css relative to this script
      const scripts = document.getElementsByTagName('script');
      let scriptPath = '';

      for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].src && scripts[i].src.includes('chatbot-plus.js')) {
          scriptPath = scripts[i].src.replace('chatbot-plus.js', 'chatbot-plus.css');
          break;
        }
      }

      if (scriptPath) {
        const link = document.createElement('link');
        link.id = 'chatbot-plus-styles';
        link.rel = 'stylesheet';
        link.href = scriptPath;
        document.head.appendChild(link);
      }
    }

    /**
     * Bootstrap: Load theme from Supabase and get initial message from backend
     */
    async bootstrap() {
      // First, fetch theme data from Supabase
      try {
        const companyData = await fetchCompanyTheme(this.companySlug);
        // Store theme from Supabase
        this.chatTheme = { ...FALLBACK_THEME, ...companyData.theme };
        // Store bot name from Supabase
        this.chatBotName = companyData.botName;
        // Store language and translations
        this.language = companyData.language;
        this.translations = getTranslations(companyData.language);
        // Store suggestions based on language
        this.suggestions = companyData.suggestions;
        // Store greeting message
        if (companyData.greeting) {
          this.messages.push({
            id: this.generateMessageId(),
            role: 'assistant',
            text: companyData.greeting,
            createdAt: new Date()
          });
          this.lastBotMessage = companyData.greeting;
          setPersistedLastBotQuestion(this.sessionId, companyData.greeting);
        }
        console.log('[Chatbot+] Theme loaded from Supabase');
      } catch (themeError) {
        console.warn('[Chatbot+] Failed to load theme from Supabase, using fallback:', themeError);
        this.chatTheme = FALLBACK_THEME;
        this.language = 'sl';
        this.translations = getTranslations('sl');
        this.suggestions = getSuggestionsForLanguage('sl');
      }

      // Then, try to get initial message from backend API (non-blocking)
      try {
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: n8nHeaders({ 'Accept': 'application/json' }),
          mode: 'cors',
          body: JSON.stringify({
            company_slug: this.companySlug,
            session_id: this.sessionId,
            message: '__init__',
            last_bot_question: null,
            state: null,
            action: 'start',
            executionMode: 'production'
          })
        });

        if (response.ok) {
          const data = await response.json();

          // Store & persist state
          if (data.state != null) {
            this.chatState = data.state;
            setPersistedState(this.sessionId, data.state);
          }

          // Store suggestions from backend if provided
          if (data.suggestions && Array.isArray(data.suggestions)) {
            this.suggestions = data.suggestions;
          }

          // Add initial bot message ONLY if no greeting from Supabase
          if (data.reply && this.messages.length === 0) {
            this.messages.push({
              id: this.generateMessageId(),
              role: 'assistant',
              text: data.reply,
              createdAt: new Date()
            });
            this.lastBotMessage = data.reply;
            setPersistedLastBotQuestion(this.sessionId, data.reply);
          }
        } else {
          console.warn('[Chatbot+] Backend API returned:', response.status);
        }
      } catch (apiError) {
        console.warn('[Chatbot+] Backend API not available:', apiError.message);
        // Widget will still work, just without initial message
      }
    }

    /**
     * Load theme from Supabase only — no n8n call (used before consent)
     */
    async loadThemeOnly() {
      try {
        const companyData = await fetchCompanyTheme(this.companySlug);
        this.chatTheme = { ...FALLBACK_THEME, ...companyData.theme };
        this.chatBotName = companyData.botName;
        this.language = companyData.language;
        this.translations = getTranslations(companyData.language);
        this.suggestions = companyData.suggestions;
        this.pendingGreeting = companyData.greeting || null;
        console.log('[Chatbot+] Theme loaded for consent screen');
      } catch (e) {
        console.warn('[Chatbot+] Failed to load theme:', e);
        this.chatTheme = FALLBACK_THEME;
      }
    }

    /**
     * Bootstrap n8n only — called after consent is given.
     * Theme is already loaded via loadThemeOnly().
     */
    async bootstrapN8n() {
      // Add greeting already fetched from Supabase if present
      if (this.pendingGreeting && this.messages.length === 0) {
        this.messages.push({
          id: this.generateMessageId(),
          role: 'assistant',
          text: this.pendingGreeting,
          createdAt: new Date()
        });
        this.lastBotMessage = this.pendingGreeting;
        setPersistedLastBotQuestion(this.sessionId, this.pendingGreeting);
        this.pendingGreeting = null;
      }

      try {
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: n8nHeaders({ 'Accept': 'application/json' }),
          mode: 'cors',
          body: JSON.stringify({
            company_slug: this.companySlug,
            session_id: this.sessionId,
            message: '__init__',
            last_bot_question: null,
            state: null,
            action: 'start',
            executionMode: 'production'
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.state != null) {
            this.chatState = data.state;
            setPersistedState(this.sessionId, data.state);
          }
          if (data.suggestions && Array.isArray(data.suggestions)) {
            this.suggestions = data.suggestions;
          }
          if (data.reply && this.messages.length === 0) {
            this.messages.push({
              id: this.generateMessageId(),
              role: 'assistant',
              text: data.reply,
              createdAt: new Date()
            });
            this.lastBotMessage = data.reply;
            setPersistedLastBotQuestion(this.sessionId, data.reply);
          }
        }
      } catch (e) {
        console.warn('[Chatbot+] n8n bootstrap failed after consent:', e);
      }
    }

    // ========================================
    // RENDERING
    // ========================================

    render() {
      // Create container
      this.container = document.createElement('div');
      this.container.className = 'chatbot-plus-container';
      this.container.setAttribute('role', 'complementary');
      this.container.setAttribute('aria-label', 'Chat widget');

      // Render launcher
      this.renderLauncher();

      // Render chat window (hidden initially)
      this.renderWindow();

      // Append to body
      document.body.appendChild(this.container);
    }

    renderLauncher() {
      this.launcher = document.createElement('button');
      this.launcher.className = 'chatbot-plus-launcher';
      this.launcher.setAttribute('aria-label', this.translations.openChat);
      this.launcher.setAttribute('aria-expanded', 'false');
      this.launcher.innerHTML = ICONS.chat;
      this.launcher.addEventListener('click', this.handleToggle);

      // Add badge container
      this.badge = document.createElement('span');
      this.badge.className = 'chatbot-plus-badge';
      this.badge.style.display = 'none';
      this.launcher.appendChild(this.badge);

      this.container.appendChild(this.launcher);
    }

    renderWindow() {
      this.window = document.createElement('div');
      this.window.className = 'chatbot-plus-window is-hidden';
      this.window.setAttribute('role', 'dialog');
      this.window.setAttribute('aria-label', 'Pogovor');

      // Header always visible
      const header = this.createHeader();
      this.window.appendChild(header);

      // Messages container always visible
      this.messagesContainer = document.createElement('div');
      this.messagesContainer.className = 'chatbot-plus-messages';
      this.messagesContainer.setAttribute('role', 'log');
      this.messagesContainer.setAttribute('aria-live', 'polite');
      this.window.appendChild(this.messagesContainer);

      // Suggestions container always present
      this.suggestionsContainer = document.createElement('div');
      this.suggestionsContainer.className = 'chatbot-plus-suggestions';
      this.window.appendChild(this.suggestionsContainer);

      if (this.consentGiven !== 'accepted') {
        // Consent notice replaces input area
        this.consentArea = this.createConsentInputNotice();
        this.window.appendChild(this.consentArea);
      } else {
        // Normal chat input
        const inputContainer = this.createInputContainer();
        this.window.appendChild(inputContainer);
        this.renderMessages();
        this.renderSuggestions();
      }

      // Powered by footer
      const footer = document.createElement('div');
      footer.className = 'chatbot-plus-powered';
      footer.innerHTML = 'Powered by <a href="https://jedroplus.com" target="_blank" rel="noopener">Jedro+</a>';
      this.window.appendChild(footer);

      this.container.appendChild(this.window);
    }

    createHeader() {
      const header = document.createElement('div');
      header.className = 'chatbot-plus-header';

      // Avatar
      const avatar = document.createElement('div');
      avatar.className = 'chatbot-plus-avatar';
      avatar.innerHTML = ICONS.bot;

      // Info
      const info = document.createElement('div');
      info.className = 'chatbot-plus-header-info';

      const name = document.createElement('div');
      name.className = 'chatbot-plus-bot-name';
      name.textContent = this.chatBotName;

      const status = document.createElement('div');
      status.className = 'chatbot-plus-status';
      status.innerHTML = `<span class="chatbot-plus-status-dot"></span>${this.translations.statusOnline}`;

      info.appendChild(name);
      info.appendChild(status);

      // Header actions
      const actions = document.createElement('div');
      actions.className = 'chatbot-plus-header-actions';

      // Privacy settings button
      const privacyBtn = document.createElement('button');
      privacyBtn.className = 'chatbot-plus-close-btn chatbot-plus-privacy-btn';
      privacyBtn.setAttribute('aria-label', 'Nastavitve zasebnosti');
      privacyBtn.setAttribute('title', 'Nastavitve zasebnosti');
      privacyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      privacyBtn.addEventListener('click', () => this.reopenConsentDialog());
      actions.appendChild(privacyBtn);

      // Close button
      const closeBtn = document.createElement('button');
      closeBtn.className = 'chatbot-plus-close-btn';
      closeBtn.setAttribute('aria-label', this.translations.closeChat);
      closeBtn.innerHTML = ICONS.close;
      closeBtn.addEventListener('click', this.handleToggle);
      actions.appendChild(closeBtn);

      header.appendChild(avatar);
      header.appendChild(info);
      header.appendChild(actions);

      return header;
    }

    // ========================================
    // CONSENT INPUT NOTICE
    // ========================================

    createConsentInputNotice() {
      const container = document.createElement('div');
      container.className = 'chatbot-plus-consent-input-notice';
      container.innerHTML = `
        <div class="chatbot-plus-consent-notice-text">
          Za uporabo klepetalnika moramo shraniti in obdelati vaša sporočila ter podatke o seji klepeta. Za več informacij o tem, kako se odjavite, o naših praksah varovanja in spoštovanja vaše zasebnosti, preberite našo <a href="privacy-policy.html" target="_blank" class="chatbot-plus-consent-link">izjavo o zasebnosti</a>.
        </div>
        <button class="chatbot-plus-consent-accept-simple">Sprejmem</button>
      `;
      const acceptBtn = container.querySelector('.chatbot-plus-consent-accept-simple');
      acceptBtn.addEventListener('click', () => this.handleAcceptConsent());
      return container;
    }

    async handleAcceptConsent() {
      // Guard against double-clicks / repeated invocations
      if (this.consentGiven === 'accepted') return;
      const now = new Date().toISOString();
      try {
        localStorage.setItem('jedroplus_chatbot_consent', 'accepted');
        localStorage.setItem('jedroplus_chatbot_consent_date', now);
      } catch(e) {}
      this.consentGiven = 'accepted';

      // Animate out consent notice
      if (this.consentArea) {
        this.consentArea.style.opacity = '0';
        this.consentArea.style.transition = 'opacity 0.2s ease';
        await new Promise(resolve => setTimeout(resolve, 200));
        this.consentArea.remove();
        this.consentArea = null;
      }

      // Insert real input container before the footer (remove any existing first)
      const existingInput = this.window.querySelector('.chatbot-plus-input-container');
      if (existingInput) existingInput.remove();
      const footer = this.window.querySelector('.chatbot-plus-powered');
      const inputContainer = this.createInputContainer();
      this.window.insertBefore(inputContainer, footer);

      this.applyTheme();

      // Show typing indicator while loading initial message
      this.showTypingIndicator();

      // Bootstrap n8n (greeting + initial message)
      await this.bootstrapN8n();

      // Refresh UI
      this.hideTypingIndicator();
      this.renderMessages();
      this.renderSuggestions();

      setTimeout(() => this.input?.focus(), 100);
    }

    reopenConsentDialog() {
      // Clear consent from storage
      try {
        localStorage.removeItem('jedroplus_chatbot_consent');
        localStorage.removeItem('jedroplus_chatbot_consent_date');
      } catch(e) {}
      this.consentGiven = null;

      // Reset chat state with fresh session
      this.messages = [];
      this.chatState = null;
      this.lastBotMessage = null;
      this.showSuggestions = true;
      this.sessionId = generateSessionId();
      try { sessionStorage.setItem('chatbot-plus-session-id', this.sessionId); } catch(e) {}

      // Remove real input from window
      const inputEl = this.window?.querySelector('.chatbot-plus-input-container');
      if (inputEl) inputEl.remove();
      this.input = null;
      this.sendBtn = null;

      // Clear messages and suggestions display
      if (this.messagesContainer) this.messagesContainer.innerHTML = '';
      if (this.suggestionsContainer) {
        this.suggestionsContainer.innerHTML = '';
        this.suggestionsContainer.style.display = 'none';
      }

      // Remove any existing consent area (prevents duplicates on repeated clicks)
      if (this.consentArea) {
        this.consentArea.remove();
        this.consentArea = null;
      }

      // Show consent notice before footer
      this.consentArea = this.createConsentInputNotice();
      const acceptBtn = this.consentArea.querySelector('.chatbot-plus-consent-accept-simple');
      if (acceptBtn && this.chatTheme) {
        acceptBtn.style.background = toGradient(this.chatTheme.accent);
      }
      const footer = this.window?.querySelector('.chatbot-plus-powered');
      if (footer) {
        this.window.insertBefore(this.consentArea, footer);
      } else {
        this.window.appendChild(this.consentArea);
      }
    }

    createInputContainer() {
      const container = document.createElement('div');
      container.className = 'chatbot-plus-input-container';

      const wrapper = document.createElement('div');
      wrapper.className = 'chatbot-plus-input-wrapper';

      // Input field
      this.input = document.createElement('input');
      this.input.type = 'text';
      this.input.className = 'chatbot-plus-input';
      this.input.placeholder = this.translations.inputPlaceholder;
      this.input.setAttribute('aria-label', this.translations.inputPlaceholder);
      this.input.addEventListener('keydown', this.handleKeydown);

      // Send button
      this.sendBtn = document.createElement('button');
      this.sendBtn.className = 'chatbot-plus-send-btn';
      this.sendBtn.setAttribute('aria-label', 'Pošlji sporočilo');
      this.sendBtn.innerHTML = ICONS.send;
      this.sendBtn.addEventListener('click', this.handleSend);

      wrapper.appendChild(this.input);
      wrapper.appendChild(this.sendBtn);
      container.appendChild(wrapper);

      return container;
    }

    renderSuggestions() {
      if (!this.suggestionsContainer) return;

      // Clear existing suggestions
      this.suggestionsContainer.innerHTML = '';

      // Hide if no suggestions or disabled
      if (!this.showSuggestions || !this.suggestions || this.suggestions.length === 0) {
        this.suggestionsContainer.style.display = 'none';
        return;
      }

      this.suggestionsContainer.style.display = 'flex';

      this.suggestions.forEach(suggestion => {
        const btn = document.createElement('button');
        btn.className = 'chatbot-plus-suggestion';
        btn.textContent = suggestion;
        btn.addEventListener('click', () => this.handleSuggestionClick(suggestion));
        this.suggestionsContainer.appendChild(btn);
      });
    }

    renderMessages() {
      if (!this.messagesContainer) return;

      // Clear existing messages
      this.messagesContainer.innerHTML = '';

      // Render all messages
      this.messages.forEach(msg => {
        this.appendMessageToDOM(msg);
      });

      // Scroll to bottom
      this.scrollToBottom();
    }

    appendMessageToDOM(message) {

      const msgEl = document.createElement('div');
      msgEl.className = `chatbot-plus-message is-${message.role === 'user' ? 'user' : 'bot'}`;
      msgEl.setAttribute('data-message-id', message.id);

      const bubble = document.createElement('div');
      bubble.className = 'chatbot-plus-bubble';
      bubble.innerHTML = parseMarkdown(message.text);

      // Apply bubble gradient based on role
      if (message.role === 'user') {
        const userBg = this.chatTheme.userMessageBg || this.chatTheme.userBubble;
        bubble.style.background = toGradient(userBg);
      } else {
        bubble.style.background = toGradient(this.chatTheme.botBubble);
        bubble.style.color = this.chatTheme.textColor;
      }

      const timestamp = document.createElement('div');
      timestamp.className = 'chatbot-plus-timestamp';
      timestamp.textContent = formatTime(message.createdAt);

      msgEl.appendChild(bubble);

      // Render action buttons if present
      if (message.actions && Array.isArray(message.actions) && message.actions.length > 0) {
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'chatbot-plus-actions';

        message.actions.forEach(action => {
          const btn = document.createElement('button');
          btn.className = `chatbot-plus-action-btn${action.variant === 'primary' ? ' is-primary' : ''}`;
          btn.textContent = action.label;
          btn.setAttribute('data-action-id', action.id);
          btn.setAttribute('data-action-value', action.value);

          if (this.chatTheme && action.variant === 'primary') {
            btn.style.background = toGradient(this.chatTheme.accent);
            btn.style.color = 'white';
          }

          btn.addEventListener('click', () => this.handleActionClick(btn, action));
          actionsContainer.appendChild(btn);
        });

        msgEl.appendChild(actionsContainer);
      }

      msgEl.appendChild(timestamp);
      this.messagesContainer.appendChild(msgEl);
    }

    showTypingIndicator() {
      // Remove existing typing indicator
      this.hideTypingIndicator();

      const typing = document.createElement('div');
      typing.className = 'chatbot-plus-typing';
      typing.setAttribute('data-typing', 'true');
      typing.style.color = this.chatTheme.textColor;

      for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        dot.className = 'chatbot-plus-typing-dot';
        typing.appendChild(dot);
      }

      this.messagesContainer.appendChild(typing);
      this.scrollToBottom();
    }

    hideTypingIndicator() {
      const typing = this.messagesContainer?.querySelector('[data-typing="true"]');
      if (typing) {
        typing.remove();
      }
    }

    addErrorMessage(text) {
      if (!this.messagesContainer) return;
      const error = document.createElement('div');
      error.className = 'chatbot-plus-error';
      error.innerHTML = `${ICONS.error}<span>${escapeHtml(text)}</span>`;
      this.messagesContainer.appendChild(error);
      this.scrollToBottom();
    }

    scrollToBottom() {
      if (this.messagesContainer) {
        requestAnimationFrame(() => {
          this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        });
      }
    }

    // ========================================
    // THEME APPLICATION
    // ========================================

    applyTheme() {
      if (!this.chatTheme) return;

      const theme = this.chatTheme;

      // Set CSS custom properties
      document.documentElement.style.setProperty('--chatbot-plus-font-family', theme.fontFamily);
      document.documentElement.style.setProperty('--chatbot-plus-border-radius', theme.borderRadius);
      document.documentElement.style.setProperty('--chatbot-plus-accent-from', theme.accent.from);
      document.documentElement.style.setProperty('--chatbot-plus-accent-to', theme.accent.to);

      // Apply launcher gradient
      if (this.launcher) {
        this.launcher.style.background = toGradient(theme.accent);
      }

      // Apply window gradient
      if (this.window) {
        this.window.style.background = toGradient(theme.bg);
        this.window.style.borderRadius = theme.borderRadius;
      }

      // Apply header styles
      const header = this.window?.querySelector('.chatbot-plus-header');
      if (header) {
        const avatar = header.querySelector('.chatbot-plus-avatar');
        if (avatar) {
          avatar.style.background = toGradient(theme.accent);
        }

        const botName = header.querySelector('.chatbot-plus-bot-name');
        if (botName) {
          botName.style.color = theme.textColor;
        }

        const status = header.querySelector('.chatbot-plus-status');
        if (status) {
          status.style.color = theme.textColor;
        }

        const closeBtn = header.querySelector('.chatbot-plus-close-btn');
        if (closeBtn) {
          closeBtn.style.color = theme.textColor;
        }
      }

      // Apply suggestion colors
      if (this.suggestionsContainer) {
        this.suggestionsContainer.style.color = theme.textColor;
      }

      // Apply send button gradient
      if (this.sendBtn) {
        this.sendBtn.style.background = toGradient(theme.accent);
      }

      // Apply powered by text color
      const powered = this.window?.querySelector('.chatbot-plus-powered');
      if (powered) {
        powered.style.color = theme.textColor;
      }

      // Apply theme to consent accept button
      const consentAcceptBtn = this.consentArea?.querySelector('.chatbot-plus-consent-accept-simple');
      if (consentAcceptBtn) {
        consentAcceptBtn.style.background = toGradient(theme.accent);
      }

      // Re-render messages with new theme
      this.renderMessages();
    }

    // ========================================
    // EVENT HANDLERS
    // ========================================

    handleToggle() {
      if (this.isOpen) {
        this.closeChat();
      } else {
        this.openChat();
      }
    }

    openChat() {
      this.isOpen = true;
      this.unreadCount = 0;
      this.updateBadge();

      // Update launcher
      this.launcher.classList.add('is-open');
      this.launcher.innerHTML = ICONS.close;
      this.launcher.appendChild(this.badge);
      this.launcher.setAttribute('aria-expanded', 'true');
      this.launcher.setAttribute('aria-label', this.translations.closeChat);

      // Show window with animation
      this.window.classList.remove('is-hidden', 'is-closing');

      // Focus input
      setTimeout(() => {
        this.input?.focus();
        this.scrollToBottom();
      }, 100);
    }

    closeChat() {
      // Add closing animation class
      this.window.classList.add('is-closing');

      // Update launcher
      this.launcher.classList.remove('is-open');
      this.launcher.innerHTML = ICONS.chat;
      this.launcher.appendChild(this.badge);
      this.launcher.setAttribute('aria-expanded', 'false');
      this.launcher.setAttribute('aria-label', this.translations.openChat);

      // Hide after animation
      setTimeout(() => {
        this.window.classList.add('is-hidden');
        this.window.classList.remove('is-closing');
        this.isOpen = false;
      }, 300);
    }

    handleKeydown(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    }

    handleSuggestionClick(suggestion) {
      this.input.value = '';
      this.sendMessage(suggestion);
    }

    // ========================================
    // CENTRALIZED N8N COMMUNICATION
    // ========================================

    buildWebhookPayload(message, extraFields) {
      // Resolve state: prefer in-memory, fallback to localStorage
      let stateToSend = this.chatState;
      if (stateToSend == null) {
        stateToSend = getPersistedState(this.sessionId);
        if (stateToSend != null) {
          // Restore in-memory from persisted
          this.chatState = stateToSend;
        }
      }
      if (stateToSend == null) {
        console.warn('[Chatbot+] No state available — sending state as null for session', this.sessionId);
      }

      // Resolve lastBotQuestion: prefer in-memory, fallback to localStorage
      let lastBotQ = this.lastBotMessage;
      if (lastBotQ == null) {
        lastBotQ = getPersistedLastBotQuestion(this.sessionId);
        if (lastBotQ != null) {
          this.lastBotMessage = lastBotQ;
        }
      }

      return {
        company_slug: this.companySlug,
        session_id: this.sessionId,
        message: message,
        last_bot_question: lastBotQ || null,
        // CRITICAL: deep-clone full state to prevent partial sends
        state: stateToSend ? JSON.parse(JSON.stringify(stateToSend)) : null,
        executionMode: 'production',
        ...(this.honeypotValue && { website: this.honeypotValue }),
        ...(extraFields || {})
      };
    }

    /**
     * Sanitize user input to prevent XSS and injection.
     * @param {string} text - Raw user input
     * @returns {string} - Sanitized text
     */
    sanitizeInput(text) {
      if (typeof text !== 'string') return '';
      return text
        .replace(/<[^>]*>/g, '')
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/\bon\w+\s*=/gi, '')
        .trim()
        .slice(0, 2000);
    }

    /**
     * Validate and sanitize response from backend.
     * @param {Object} response - Backend response
     * @returns {boolean} - Is valid
     */
    validateResponse(response) {
      if (!response || typeof response !== 'object') return false;
      if (response.message && typeof response.message === 'string') {
        response.message = response.message
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
      return true;
    }

    /**
     * Unified send function — used by text input, suggestion clicks,
     * action buttons, AND quick-reply confirmation buttons.
     * Always sends the FULL deep-cloned state.
     */
    async sendMessage(userText) {
      const sanitizedText = this.sanitizeInput(userText);
      if (!sanitizedText || this.sending || !this.messagesContainer) return;

      // Add user message to UI
      const userMessage = {
        id: this.generateMessageId(),
        role: 'user',
        text: sanitizedText,
        createdAt: new Date()
      };
      this.messages.push(userMessage);
      this.appendMessageToDOM(userMessage);
      this.scrollToBottom();

      // Hide suggestions after first user message
      this.showSuggestions = false;
      this.renderSuggestions();

      // Remove any existing quick-reply buttons
      this.removeQuickReplies();

      // Build payload with FULL state (deep-cloned inside buildWebhookPayload)
      const payload = this.buildWebhookPayload(sanitizedText);

      // Set sending state — disable all interactive elements
      this.sending = true;
      this.input.disabled = true;
      this.sendBtn.disabled = true;
      this.disableQuickReplies();

      // Show typing indicator
      this.showTypingIndicator();

      try {
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: n8nHeaders(),
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const data = await response.json();
        this.processN8nResponse(data);
      } catch (error) {
        console.error('[Chatbot+] Send failed:', error);
        this.hideTypingIndicator();
        this.addErrorMessage(this.translations.sendError);
      } finally {
        // Reset sending state
        this.sending = false;
        this.input.disabled = false;
        this.sendBtn.disabled = false;
        this.input?.focus();
      }
    }

    processN8nResponse(data) {
      if (!this.validateResponse(data)) {
        console.error('[Chatbot+] Invalid response from backend');
        this.hideTypingIndicator();
        this.addErrorMessage(this.translations.sendError);
        return;
      }

      // Always persist FULL state from response
      if (data.state != null) {
        this.chatState = data.state;
        setPersistedState(this.sessionId, data.state);
      }

      // Hide typing indicator
      this.hideTypingIndicator();

      // Add bot message
      if (data.reply) {
        const botMessage = {
          id: this.generateMessageId(),
          role: 'assistant',
          text: data.reply,
          actions: data.actions || null,
          createdAt: new Date()
        };
        this.messages.push(botMessage);

        // Update & persist lastBotMessage
        this.lastBotMessage = data.reply;
        setPersistedLastBotQuestion(this.sessionId, data.reply);

        this.appendMessageToDOM(botMessage);
        this.scrollToBottom();

        // Update unread count if chat is closed
        if (!this.isOpen) {
          this.unreadCount++;
          this.updateBadge();
          this.playNotificationSound();
        }
      }

      // Show new suggestions if provided
      if (data.suggestions && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        this.suggestions = data.suggestions;
        this.showSuggestions = true;
        this.renderSuggestions();
      }

      // Render quick-reply confirmation buttons if in confirming_booking stage
      this.renderQuickReplies();
    }

    // ========================================
    // QUICK-REPLY CONFIRMATION BUTTONS
    // ========================================

    renderQuickReplies() {
      // Remove any existing quick-reply buttons first
      this.removeQuickReplies();

      // Only show when booking stage is confirming_booking
      if (this.chatState?.booking?.stage !== 'confirming_booking') return;

      const container = document.createElement('div');
      container.className = 'chatbot-plus-quick-replies';

      const buttons = [
        { label: this.translations.confirmBooking, value: 'POTRDI', variant: 'primary' },
        { label: this.translations.changeBooking, value: 'SPREMENI', variant: 'secondary' }
      ];

      buttons.forEach(btn => {
        const el = document.createElement('button');
        el.className = `chatbot-plus-quick-reply-btn${btn.variant === 'primary' ? ' is-primary' : ''}`;
        el.textContent = btn.label;

        if (this.chatTheme && btn.variant === 'primary') {
          el.style.background = toGradient(this.chatTheme.accent);
          el.style.color = 'white';
        }

        el.addEventListener('click', () => {
          if (this.sending) return;
          this.sendMessage(btn.value);
        });

        container.appendChild(el);
      });

      this.messagesContainer.appendChild(container);
      this.scrollToBottom();
    }

    removeQuickReplies() {
      const existing = this.messagesContainer?.querySelectorAll('.chatbot-plus-quick-replies');
      if (existing) {
        existing.forEach(el => el.remove());
      }
    }

    disableQuickReplies() {
      const btns = this.messagesContainer?.querySelectorAll('.chatbot-plus-quick-reply-btn');
      if (btns) {
        btns.forEach(btn => {
          btn.disabled = true;
          btn.classList.add('is-disabled');
        });
      }
    }

    async handleSend() {
      const text = this.input?.value?.trim();
      if (!text || this.sending) return;
      this.input.value = '';
      this.sendMessage(text);
    }

    async handleActionClick(btn, action) {
      if (this.sending) return;

      // Build payload with FULL state BEFORE disabling UI
      const payload = this.buildWebhookPayload(action.value);

      // Disable all action buttons in this group visually
      const actionsContainer = btn.closest('.chatbot-plus-actions');
      if (actionsContainer) {
        const allBtns = actionsContainer.querySelectorAll('.chatbot-plus-action-btn');
        allBtns.forEach(b => {
          b.disabled = true;
          b.classList.add('is-disabled');
        });
      }

      // Show loading on clicked button
      btn.classList.add('is-loading');
      const originalLabel = btn.textContent;
      btn.textContent = '';

      // Set sending state
      this.sending = true;
      this.input.disabled = true;
      this.sendBtn.disabled = true;
      this.disableQuickReplies();

      // Show typing indicator
      this.showTypingIndicator();

      try {
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: n8nHeaders(),
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const data = await response.json();
        this.processN8nResponse(data);
      } catch (error) {
        console.error('[Chatbot+] Action click failed:', error);
        this.hideTypingIndicator();
        this.addErrorMessage(this.translations.sendError);

        // Re-enable buttons on error
        if (actionsContainer) {
          const allBtns = actionsContainer.querySelectorAll('.chatbot-plus-action-btn');
          allBtns.forEach(b => {
            b.disabled = false;
            b.classList.remove('is-disabled');
          });
        }
        btn.classList.remove('is-loading');
        btn.textContent = originalLabel;
      } finally {
        this.sending = false;
        this.input.disabled = false;
        this.sendBtn.disabled = false;
        this.input?.focus();
      }
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    generateMessageId() {
      return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    updateBadge() {
      if (this.badge) {
        if (this.unreadCount > 0) {
          this.badge.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
          this.badge.style.display = 'flex';
        } else {
          this.badge.style.display = 'none';
        }
      }
    }

    playNotificationSound() {
      if (!this.soundEnabled) return;

      try {
        // Create a simple notification sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      } catch (e) {
        // Audio not supported or blocked
      }
    }

    // ========================================
    // PUBLIC API
    // ========================================

    /**
     * Open the chat window programmatically
     */
    open() {
      if (!this.isOpen) {
        this.openChat();
      }
    }

    /**
     * Close the chat window programmatically
     */
    close() {
      if (this.isOpen) {
        this.closeChat();
      }
    }

    /**
     * Toggle the chat window
     */
    toggle() {
      this.handleToggle();
    }

    /**
     * Set suggestions programmatically
     */
    setSuggestions(suggestions) {
      this.suggestions = suggestions;
      this.showSuggestions = true;
      this.renderSuggestions();
    }

    /**
     * Destroy the widget and clean up
     */
    destroy() {
      if (this.container) {
        this.container.remove();
      }
      this.messages = [];
      this.chatState = null;
      this.widgetReady = false;
      this.hasBootstrapped = false;
    }

    /**
     * Get current messages
     */
    getMessages() {
      return [...this.messages];
    }

    /**
     * Get current session ID
     */
    getSessionId() {
      return this.sessionId;
    }
  }

  // ========================================
  // GLOBAL API
  // ========================================

  let instance = null;

  window.ChatbotPlus = {
    /**
     * Initialize the Chatbot+ widget
     * @param {Object} options - Configuration options
     * @param {string} options.companySlug - Company identifier
     * @param {boolean} options.soundEnabled - Enable notification sounds (default: true)
     * @param {Array} options.suggestions - Initial suggestions to show
     */
    init: function(options = {}) {
      if (instance) {
        console.warn('[Chatbot+] Widget already initialized');
        return instance;
      }

      instance = new ChatbotPlusWidget(options);
      instance.init();
      return instance;
    },

    /**
     * Get the widget instance
     */
    getInstance: function() {
      return instance;
    },

    /**
     * Open the chat window
     */
    open: function() {
      instance?.open();
    },

    /**
     * Close the chat window
     */
    close: function() {
      instance?.close();
    },

    /**
     * Toggle the chat window
     */
    toggle: function() {
      instance?.toggle();
    },

    /**
     * Set suggestions
     */
    setSuggestions: function(suggestions) {
      instance?.setSuggestions(suggestions);
    },

    /**
     * Destroy the widget
     */
    destroy: function() {
      instance?.destroy();
      instance = null;
    }
  };

  // Auto-initialize if data attributes are present
  document.addEventListener('DOMContentLoaded', function() {
    const script = document.querySelector('script[data-chatbot-plus-auto-init]');
    if (script) {
      const companySlug = script.getAttribute('data-company-slug');
      const webhookUrl = script.getAttribute('data-webhook-url');
      window.ChatbotPlus.init({ companySlug, webhookUrl });
    }
  });

})(window, document);
