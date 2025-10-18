# Date Badge Visual Guide

## How It Looks

### Light Mode
```
╔════════════════════════════════════════════════════╗
║                 Chat with Bondhu                   ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║              ┌─────────────┐                       ║
║              │   Today     │  ← Emerald badge     ║
║              └─────────────┘                       ║
║                                                    ║
║  How are you feeling today?              [User]   ║
║  10:30 AM                                          ║
║                                                    ║
║  [Bondhu]  I'm doing great! Thanks for asking.    ║
║            How can I support you today?            ║
║            10:31 AM                                ║
║                                                    ║
║              ┌─────────────┐                       ║
║              │  Yesterday  │  ← Emerald badge     ║
║              └─────────────┘                       ║
║                                                    ║
║  Tell me about stress management        [User]    ║
║  8:45 PM                                           ║
║                                                    ║
║  [Bondhu]  Of course! Let's explore some          ║
║            effective techniques...                 ║
║            8:46 PM                                 ║
║                                                    ║
║              ┌──────────────────┐                  ║
║              │ October 16, 2025 │  ← Emerald      ║
║              └──────────────────┘                  ║
║                                                    ║
║  I need help with my goals              [User]    ║
║  2:15 PM                                           ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

### Dark Mode
```
╔════════════════════════════════════════════════════╗
║                 Chat with Bondhu                   ║
║                  (Dark Theme)                      ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║              ┌─────────────┐                       ║
║              │   Today     │  ← Darker emerald    ║
║              └─────────────┘     (emerald-600)    ║
║                                                    ║
║  How are you feeling today?              [User]   ║
║  10:30 AM                                          ║
║                                                    ║
║  [Bondhu]  I'm doing great! Thanks for asking.    ║
║            How can I support you today?            ║
║            10:31 AM                                ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

## Color Specifications

### Light Mode
- **Background**: `#10b981` (emerald-500)
- **Text**: `#ffffff` (white)
- **Shadow**: Subtle shadow for depth

### Dark Mode
- **Background**: `#059669` (emerald-600)
- **Text**: `#f0fdf4` (emerald-50)
- **Shadow**: Subtle shadow for depth

## Date Label Examples

### Different Time Periods

| Time Period | Label Display | Example |
|-------------|---------------|---------|
| Same day | "Today" | Messages sent today |
| Previous day | "Yesterday" | Messages from yesterday |
| Within 7 days | Day name | "Monday", "Tuesday", etc. |
| Older than 7 days | Full date | "October 16, 2025" |

### Sample Timeline

```
┌─────────────┐
│   Today     │  ← Current date: Oct 18, 2025
└─────────────┘

┌─────────────┐
│  Yesterday  │  ← Oct 17, 2025
└─────────────┘

┌─────────────┐
│   Monday    │  ← Oct 16, 2025 (within last week)
└─────────────┘

┌─────────────┐
│   Sunday    │  ← Oct 15, 2025 (within last week)
└─────────────┘

┌──────────────────┐
│ October 10, 2025 │  ← Older than 7 days
└──────────────────┘

┌──────────────────┐
│ October 1, 2025  │  ← Much older
└──────────────────┘
```

## Responsive Behavior

### Desktop (Large Screens)
- Badge centered in chat area
- Full date text visible
- Comfortable spacing (my-4)

### Tablet (Medium Screens)
- Badge remains centered
- Text scales appropriately
- Maintains readability

### Mobile (Small Screens)
- Badge centered
- Compact but readable
- Optimized spacing

## Accessibility Features

1. **High Contrast**: Emerald on white/dark background ensures readability
2. **Clear Typography**: Small but legible font size (text-xs)
3. **Semantic Structure**: Proper grouping of messages by date
4. **Screen Reader Friendly**: Date information is clearly presented

## Animation & Transitions

- **Smooth Rendering**: Date badges appear naturally as messages load
- **No Jarring Effects**: Subtle, professional appearance
- **Consistent Spacing**: Uniform gaps between date badges and messages

## Comparison with WhatsApp

| Feature | WhatsApp | Bondhu (Our Implementation) |
|---------|----------|----------------------------|
| Badge Position | Center | ✅ Center |
| Color | Gray | ✅ Emerald (brand color) |
| Smart Labels | Yes | ✅ Yes (Today, Yesterday, etc.) |
| Dark Mode | Yes | ✅ Yes |
| Rounded Shape | Yes | ✅ Yes |

## Design Philosophy

1. **Familiar**: Users recognize the pattern from WhatsApp
2. **Branded**: Emerald color matches Bondhu's brand identity
3. **Functional**: Provides clear temporal context
4. **Elegant**: Minimal, non-intrusive design
5. **Accessible**: Works for all users, all themes

---

**Visual Status**: ✅ Designed for optimal user experience
**Brand Alignment**: ✅ Uses Bondhu's emerald color palette
**Accessibility**: ✅ WCAG compliant contrast ratios
