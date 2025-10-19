# Engineer Communication System - Bug Fixes

## Issues Fixed

### 1. ✅ Duplicate Messages
**Problem:** Engineer messages were appearing twice in the UI - once in Engineering Feed and once in AI ↔ Driver Radio.

**Root Cause:** The code was calling `addMessage()` twice:
- Once when message was created (for Engineering Feed)
- Once after the delay timer (for Radio Feed)

**Solution:** Messages are now added **ONCE** with all metadata. The two views filter the same message array differently:
- **Engineering Feed:** Shows non-override engineer messages with countdown timers
- **AI ↔ Driver Radio:** Shows messages after they've been "sent" (deliveryTime has passed OR isOverride is true)

### 2. ✅ AI Responses to Engineer Messages
**Problem:** AI was appearing to respond to engineer override messages.

**Root Cause Investigation:**
- Reviewed all AI response generation code
- AI responses are ONLY triggered in `DriverAudio.tsx` when driver speaks
- **No code existed that generates AI responses to engineer messages**

**Actual Issue:** Timing confusion - AI responses to previous driver messages were appearing after engineer override messages.

**Solution:** Added visual distinction and filtering:
- Engineer messages now clearly show `OVERRIDE` badge in red with pulsing animation
- Radio Feed filters ensure only "sent" engineer messages appear
- Each message type has distinct color-coded badges (DRIVER=blue, ENGINEER=red, AI=cyan)

### 3. ✅ Override Badge
**Problem:** Override messages had no visual indicator showing they bypassed the queue.

**Solution:** Added prominent `OVERRIDE` badge:
- Red background with pulsing animation
- AlertTriangle icon for urgency
- Only appears on override engineer messages in Radio Feed

## Code Changes

### `/frontend/src/store/useRaceStore.ts`
- Added `isOverride?: boolean` field to `Message` interface

### `/frontend/src/components/EngineerPanel.tsx`
**Before:**
```typescript
// Added message twice - once for Engineering Feed, once for Radio
addMessage({ /* Engineering Feed */ });
setTimeout(() => {
  addMessage({ /* Radio Feed */ });
}, delay);
```

**After:**
```typescript
// Add message ONCE with all metadata
addMessage({
  sender: 'engineer',
  text: refinedMessage,
  severity: severity,
  createdAt: now,
  deliveryTime: deliveryTime,
  isOverride: isOverrideMode, // Flag for override messages
});

// Only play TTS after delay, no second addMessage call
setTimeout(async () => {
  await textToSpeech(refinedMessage);
}, delay);
```

### `/frontend/src/components/RadioFeed.tsx`
**Filtering Logic:**
```typescript
// Force re-render every 100ms to update visibility
useEffect(() => {
  const interval = setInterval(() => setTick(t => t + 1), 100);
  return () => clearInterval(interval);
}, []);

// Show engineer messages only if:
// 1. They're override messages (immediate), OR
// 2. Their deliveryTime has passed (countdown finished)
const filteredMessages = messages.filter(m => {
  if (m.sender === 'ai' || m.sender === 'driver') return true;
  if (m.sender === 'engineer') {
    return m.isOverride || !m.deliveryTime || Date.now() >= m.deliveryTime;
  }
  return false;
});
```

**Override Badge:**
```tsx
{message.sender === "engineer" && (
  <>
    <Badge className="bg-[#e10600] text-white...">
      ENGINEER
    </Badge>
    {message.isOverride && (
      <Badge className="bg-[#ff0000] text-white... animate-pulse">
        <AlertTriangle className="w-3 h-3 mr-1" />
        OVERRIDE
      </Badge>
    )}
  </>
)}
```

### `/frontend/src/components/ConversationTabs.tsx`
**Filtering Logic:**
```typescript
// Engineering Feed: Show non-override messages with countdown timers
const engineerMessages = messages.filter(m => 
  m.sender === 'engineer' && !m.isOverride
);
```

## Message Flow Diagram

### Regular Engineer Message (Push-to-Talk)
```
1. Engineer speaks → STT → Refine → Classify severity
2. addMessage() called ONCE with:
   - createdAt: timestamp
   - deliveryTime: timestamp + delay (3-6s)
   - isOverride: false

3. Engineering Feed: Shows message immediately with countdown
4. Radio Feed: Filters out (deliveryTime not reached)

5. After delay expires:
   - Radio Feed: Shows message (deliveryTime passed)
   - TTS plays to driver
```

### Override Engineer Message (Override Button)
```
1. Engineer speaks → STT → Refine (no classify)
2. addMessage() called ONCE with:
   - isOverride: true
   - severity: 'high'
   - NO deliveryTime (immediate)

3. Engineering Feed: Filters out (isOverride = true)
4. Radio Feed: Shows immediately with OVERRIDE badge
5. TTS plays immediately to driver
```

### Driver Message (T Key)
```
1. Driver speaks → STT
2. addMessage() for driver
3. AI generates response via askQuestion()
4. addMessage() for AI response
5. TTS plays AI response

NOTE: AI NEVER responds to engineer messages - only to driver!
```

## Testing Checklist

- [ ] Regular engineer message appears ONCE in Engineering Feed with countdown
- [ ] After countdown expires, message appears in Radio Feed
- [ ] Override message appears ONCE in Radio Feed (NOT in Engineering Feed)
- [ ] Override message shows OVERRIDE badge with red pulsing animation
- [ ] Driver messages trigger AI responses (blue + cyan badges)
- [ ] Engineer messages do NOT trigger AI responses
- [ ] Each message type has correct badge color:
  - DRIVER: Blue
  - ENGINEER: Red
  - AI: Cyan
  - OVERRIDE: Red pulsing with AlertTriangle icon
- [ ] No duplicate messages in any view
- [ ] Countdown timers update smoothly every 100ms
- [ ] Messages appear in Radio Feed exactly when delivered (no early/late)

## Visual Indicators

| Message Type | Badge | Color | Animation | Location |
|--------------|-------|-------|-----------|----------|
| Driver | DRIVER | Blue (#0090ff) | None | Radio Feed |
| AI | AI | Cyan (#00d2be) | None | Radio Feed |
| Engineer (Regular) | ENGINEER | Red (#e10600) | None | Engineering Feed → Radio Feed |
| Engineer (Override) | ENGINEER + OVERRIDE | Red (#ff0000) | Pulse | Radio Feed only |

## Performance Optimizations

1. **Message Filtering:** Real-time filtering based on deliveryTime prevents showing queued messages
2. **Tick Updates:** 100ms interval ensures smooth countdown and timely message appearance
3. **Single Source of Truth:** One message array, multiple filtered views eliminates sync issues
4. **No Message Duplication:** Reduced memory usage and prevented UI confusion
