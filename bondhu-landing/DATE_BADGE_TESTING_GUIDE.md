# Date Badge Testing Guide

## Quick Test Checklist

### ✅ Visual Tests

- [ ] Date badges appear centered in the chat area
- [ ] Emerald color displays correctly in light mode
- [ ] Darker emerald color displays correctly in dark mode
- [ ] Text is white and readable on emerald background
- [ ] Badges have rounded pill shape
- [ ] Proper spacing above and below badges

### ✅ Functional Tests

#### 1. Today's Messages
- [ ] Send a new message
- [ ] Verify "Today" badge appears
- [ ] Check that all messages from today are grouped under "Today"

#### 2. Yesterday's Messages
- [ ] Load chat history with messages from yesterday
- [ ] Verify "Yesterday" badge appears
- [ ] Check proper grouping

#### 3. Week-Old Messages
- [ ] Load messages from 2-6 days ago
- [ ] Verify day name appears (e.g., "Monday", "Tuesday")
- [ ] Check correct day name for each date

#### 4. Older Messages
- [ ] Load messages older than 7 days
- [ ] Verify full date format (e.g., "October 10, 2025")
- [ ] Check date accuracy

### ✅ Theme Tests

#### Light Mode
```bash
# Check these elements:
- Badge background: Bright emerald (#10b981)
- Badge text: White
- Contrast: High and readable
- Shadow: Subtle and visible
```

#### Dark Mode
```bash
# Check these elements:
- Badge background: Darker emerald (#059669)
- Badge text: Light emerald tint (#f0fdf4)
- Contrast: Sufficient for readability
- Shadow: Visible against dark background
```

### ✅ Edge Cases

- [ ] **Empty Chat**: No date badges appear (only greeting message)
- [ ] **Single Message**: One date badge with one message
- [ ] **Multiple Dates**: Multiple badges for different dates
- [ ] **Midnight Transition**: Messages sent at 11:59 PM vs 12:01 AM
- [ ] **Long Conversation**: Scroll through many date groups
- [ ] **Real-time Updates**: New messages appear under correct date

### ✅ Responsive Tests

#### Desktop (>1024px)
- [ ] Badge centered properly
- [ ] Text fully visible
- [ ] Spacing looks balanced

#### Tablet (768px - 1024px)
- [ ] Badge remains centered
- [ ] Text readable
- [ ] No overflow issues

#### Mobile (<768px)
- [ ] Badge centered on small screen
- [ ] Text doesn't wrap awkwardly
- [ ] Touch-friendly spacing

## Test Scenarios

### Scenario 1: New User (First Chat)
```
Expected:
1. Open chat
2. See greeting message with "Today" badge
3. Send first message
4. Message appears under "Today" badge
```

### Scenario 2: Returning User (Multi-Day History)
```
Expected:
1. Open chat
2. See multiple date badges:
   - "Today" (if messages exist)
   - "Yesterday" (if messages exist)
   - Day names for recent days
   - Full dates for older messages
3. Messages properly grouped under each badge
```

### Scenario 3: Cross-Day Conversation
```
Expected:
1. Chat at 11:58 PM
2. Send message → appears under "Today"
3. Wait until 12:02 AM
4. Send message → new "Today" badge appears
5. Previous messages now under "Yesterday"
```

### Scenario 4: Theme Switching
```
Expected:
1. View chat in light mode
2. Toggle to dark mode
3. Badge color changes to darker emerald
4. Text color adjusts for readability
5. All badges update consistently
```

## Manual Testing Steps

### Step 1: Start Fresh
```bash
# Clear browser cache
# Open chat interface
# Verify initial state
```

### Step 2: Send Test Messages
```bash
# Send 3-5 messages
# Verify "Today" badge appears
# Check message grouping
```

### Step 3: Load History
```bash
# Refresh page
# Verify messages reload correctly
# Check date badges persist
```

### Step 4: Toggle Theme
```bash
# Switch to dark mode
# Verify color changes
# Switch back to light mode
# Verify colors revert
```

## Automated Test Ideas

### Unit Tests
```typescript
describe('Date Badge Functions', () => {
  test('groupMessagesByDate groups messages correctly', () => {
    // Test grouping logic
  });

  test('formatDateBadge returns "Today" for today', () => {
    // Test today's date
  });

  test('formatDateBadge returns "Yesterday" for yesterday', () => {
    // Test yesterday's date
  });

  test('formatDateBadge returns day name for recent dates', () => {
    // Test dates within last week
  });

  test('formatDateBadge returns full date for old dates', () => {
    // Test dates older than 7 days
  });
});
```

### Integration Tests
```typescript
describe('Date Badge Rendering', () => {
  test('renders date badge for each unique date', () => {
    // Test badge rendering
  });

  test('groups messages under correct date badge', () => {
    // Test message grouping
  });

  test('updates badges when theme changes', () => {
    // Test theme switching
  });
});
```

## Performance Checks

- [ ] **Load Time**: Date grouping doesn't slow down chat loading
- [ ] **Scroll Performance**: Smooth scrolling with many date badges
- [ ] **Memory Usage**: No memory leaks from date calculations
- [ ] **Re-render Efficiency**: Only necessary components re-render

## Browser Compatibility

Test in these browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Known Issues to Watch For

1. **Timezone Issues**: Ensure dates are calculated in user's local timezone
2. **Date Parsing**: Verify ISO date strings parse correctly
3. **Midnight Edge Case**: Messages sent exactly at midnight
4. **Locale Differences**: Date formatting in different locales

## Success Criteria

✅ **Visual**
- Badges are emerald colored and centered
- Text is readable in both themes
- Spacing is consistent and pleasing

✅ **Functional**
- Correct date labels appear
- Messages are properly grouped
- Real-time updates work correctly

✅ **Performance**
- No noticeable lag
- Smooth scrolling
- Fast rendering

✅ **Compatibility**
- Works in all major browsers
- Responsive on all screen sizes
- Theme switching works flawlessly

## Reporting Issues

If you find any issues, please note:
1. What you were doing
2. What you expected to happen
3. What actually happened
4. Browser and device information
5. Screenshots if applicable

---

**Testing Status**: Ready for QA
**Priority**: High (User-facing feature)
**Estimated Testing Time**: 30-45 minutes
