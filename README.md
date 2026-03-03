# Chatbot+ Premium Widget

A modern, embeddable chat widget with dynamic theming, smooth animations, and glassmorphism design. Perfect for customer support, sales, or any conversational AI experience.

## Features

- **Premium Design** - Glassmorphism effects, smooth animations, and micro-interactions
- **Dynamic Theming** - Fully customizable colors and styling loaded from your backend
- **GDPR Consent** - In-chat consent dialog before any data is processed
- **Privacy Policy** - Full GDPR-compliant privacy policy document in Slovenian
- **Easy Integration** - Just add a single script tag to your website
- **Responsive** - Works perfectly on desktop and mobile devices
- **Accessible** - Keyboard navigation, ARIA labels, and focus management
- **State Management** - Conversation state maintained across messages
- **Session Persistence** - Session ID stored in sessionStorage
- **Notification Sounds** - Optional audio feedback for new messages

## Privacy & GDPR

The widget includes a full GDPR consent system:

- **In-chat consent dialog** — shown inside the chat window before any data is sent
- **Accept / Decline** — user can accept or decline data processing
- **Retry consent** — declined users can re-open the consent dialog
- **Privacy settings button** — shield icon in the header allows users to re-open consent and reset the chat
- **localStorage persistence** — consent decision survives page reloads
- **Lazy bootstrap** — n8n webhook is only called **after** consent is accepted; Supabase theme is fetched read-only regardless
- **Privacy policy** — `privacy-policy.html` covers all GDPR requirements (controller, data types, legal basis, retention, rights, etc.)

### Consent localStorage keys

| Key | Value | Description |
|-----|-------|-------------|
| `jedroplus_chatbot_consent` | `"accepted"` \| `"declined"` | User's consent decision |
| `jedroplus_chatbot_consent_date` | ISO timestamp | When consent was given |

## Quick Start

### Basic Integration

Add the following code to your HTML, preferably before the closing `</body>` tag:

```html
<!-- Load Chatbot+ Widget -->
<script src="https://your-cdn.com/chatbot-plus.js"></script>
<script>
  ChatbotPlus.init({
    companySlug: 'your-company-slug'
  });
</script>
```

### Auto-Initialize with Data Attributes

Alternatively, you can use data attributes for automatic initialization:

```html
<script
  src="https://your-cdn.com/chatbot-plus.js"
  data-chatbot-plus-auto-init
  data-company-slug="your-company-slug"
></script>
```

### Using URL Parameters

The widget can also read the company slug from URL parameters:

```
https://yoursite.com/?company_slug=your-company-slug
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `companySlug` | string | URL param or 'test-podjetje' | Company identifier for the backend |
| `soundEnabled` | boolean | true | Enable notification sounds for new messages |

Example with all options:

```javascript
ChatbotPlus.init({
  companySlug: 'my-company',
  soundEnabled: true
});
```

## JavaScript API

### Methods

```javascript
// Initialize the widget
ChatbotPlus.init({ companySlug: 'my-company' });

// Open the chat window
ChatbotPlus.open();

// Close the chat window
ChatbotPlus.close();

// Toggle chat window
ChatbotPlus.toggle();

// Get widget instance
const widget = ChatbotPlus.getInstance();

// Get all messages
const messages = widget.getMessages();

// Get current session ID
const sessionId = widget.getSessionId();

// Destroy and cleanup widget
ChatbotPlus.destroy();
```

## Backend Integration

### API Endpoint

All communication happens via POST to your configured endpoint.

### Bootstrap Request (Initial Load)

When the widget first loads, it sends a bootstrap request:

```json
{
  "company_slug": "your-company-slug",
  "session_id": "uuid-generated-session-id",
  "message": "__init__",
  "state": null,
  "action": "start",
  "executionMode": "production"
}
```

### Bootstrap Response

The backend should respond with:

```json
{
  "reply": "Welcome! How can I help you today?",
  "state": {
    // Your conversation state object
  },
  "theme": {
    "bg": { "from": "#667eea", "to": "#764ba2" },
    "userBubble": { "from": "#667eea", "to": "#764ba2" },
    "userMessageBg": { "from": "#667eea", "to": "#764ba2" },
    "botBubble": { "from": "#f5f5f5", "to": "#e0e0e0" },
    "accent": { "from": "#667eea", "to": "#764ba2" },
    "textColor": "#1f2937",
    "fontFamily": "'Inter', sans-serif",
    "borderRadius": "16px"
  },
  "botName": "Support Bot"
}
```

### Regular Message Request

Subsequent user messages are sent as:

```json
{
  "company_slug": "your-company-slug",
  "session_id": "uuid-generated-session-id",
  "message": "User's message text",
  "state": { /* current state from previous response */ },
  "executionMode": "production"
}
```

**Note:** The `action` field is **only** sent in the bootstrap request, never in regular messages.

### Regular Message Response

```json
{
  "reply": "Bot's response message",
  "state": {
    // Updated conversation state
  }
}
```

## Theme Properties

| Property | Type | Description |
|----------|------|-------------|
| `bg` | gradient | Background of chat window and header |
| `userBubble` | gradient | Fallback for user message bubbles |
| `userMessageBg` | gradient | Primary user message bubble background |
| `botBubble` | gradient | Bot message bubble background |
| `accent` | gradient | Launcher button, send button, bot icon |
| `textColor` | string | Main text color |
| `fontFamily` | string | Font family for all text |
| `borderRadius` | string | Border radius for window, bubbles, inputs |

### Gradient Format

```json
{
  "from": "#startColor",
  "to": "#endColor"
}
```

Gradients are applied as `linear-gradient(135deg, from, to)`.

### Fallback Theme

If no theme is provided by the backend, the widget uses:

```javascript
{
  bg: { from: '#667eea', to: '#764ba2' },
  userBubble: { from: '#667eea', to: '#764ba2' },
  userMessageBg: { from: '#667eea', to: '#764ba2' },
  botBubble: { from: '#f5f5f5', to: '#e0e0e0' },
  accent: { from: '#667eea', to: '#764ba2' },
  textColor: '#1f2937',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  borderRadius: '16px'
}
```

## Customization

### CSS Variables

The widget exposes CSS custom properties that you can override:

```css
:root {
  --chatbot-plus-z-index: 999999;
  --chatbot-plus-font-family: 'Your Font', sans-serif;
  --chatbot-plus-border-radius: 20px;
}
```

### CSS Class Prefix

All CSS classes are prefixed with `.chatbot-plus-` to avoid conflicts with your existing styles.

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome for Android)

## Accessibility

The widget includes:

- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus management
- Screen reader announcements for new messages
- Reduced motion support

## File Structure

```
chatbot-plus/
├── index.html          # Demo page for testing
├── chatbot-plus.js     # Main widget code (self-contained)
├── chatbot-plus.css    # Widget styles
└── README.md           # This file
```

## Testing the Demo

1. Serve the files locally (e.g., using `npx serve .`)
2. Open `index.html` in your browser
3. The widget will appear in the bottom-right corner
4. Use the test panel to switch between different company configurations

## Troubleshooting

### Widget not appearing

1. Check browser console for errors
2. Ensure the script is loaded correctly
3. Verify the backend endpoint is accessible
4. Check for CSS conflicts with `z-index`

### Theme not applying

1. Verify the backend returns a valid theme object
2. Check console for API response errors
3. The fallback theme will be used if no theme is received

### Session not persisting

The session ID is stored in `sessionStorage`. It will persist:
- During the browser session
- Across page refreshes (same tab)

It will reset:
- When the browser/tab is closed
- When `ChatbotPlus.destroy()` is called

## License

MIT License - feel free to use in your projects.

## Support

For issues and feature requests, please contact support@chatbotplus.io
