# Testing Chat Context Improvements

## Overview

This document provides instructions for testing the chat context improvements implemented in the Bondhu AI system. The improvements include conversation context preservation, memory integration, error handling, rate limiting, and context summarization.

## Prerequisites

Before running tests, ensure you have:
1. A properly configured development environment
2. Access to the Supabase database
3. Valid Google Gemini API credentials
4. All required Python dependencies installed

## Automated Testing

### Running the Test Script

A comprehensive test script has been created at `tests/test_chat_context.py`. To run it:

```bash
cd bondhu-ai
python tests/test_chat_context.py
```

The script tests the following components:
1. **Conversation Context Preservation** - Verifies services initialize correctly
2. **Memory Integration** - Checks memory service initialization
3. **Context Summarization** - Tests the summarization function with sample data
4. **Rate Limiting** - Verifies rate limiting attributes exist
5. **Fallback Responses** - Confirms fallback mechanism exists

### Expected Output

A successful test run will show output similar to:
```
INFO:__main__:Starting chat context improvements tests...
INFO:__main__:=== Testing Memory Integration ===
INFO:__main__:✓ Memory services initialized successfully
INFO:__main__:=== Testing Rate Limiting ===
INFO:__main__:✓ Rate limiting attributes found. Delay: 1.0 seconds
INFO:__main__:=== Testing Fallback Responses ===
INFO:__main__:✓ Fallback response mechanism exists
INFO:__main__:=== Testing Conversation Context Preservation ===
INFO:__main__:✓ Chat service and memory retriever initialized successfully
INFO:__main__:=== Testing Context Summarization ===
INFO:__main__:✓ Context summarization successful. Summary length: 250 characters
INFO:__main__:Summary preview: Previous conversation about user: Hello, how are you today? ai: I'm doing well...
INFO:__main__:
=== TEST RESULTS ===
INFO:__main__:Passed: 5/5 tests
INFO:__main__:🎉 All tests passed!
```

## Manual Testing

### 1. Conversation Context Preservation

**Test Procedure:**
1. Start a chat session with a user
2. Have a conversation with multiple exchanges
3. Reference something from earlier in the conversation
4. Verify the AI remembers and references the earlier context

**Expected Behavior:**
- The AI should maintain context throughout the conversation
- When you reference previous topics, the AI should recall them
- Session-based context filtering should work correctly

### 2. Memory Integration

**Test Procedure:**
1. Add some memories to the `user_memories` table for a test user
2. Start a new chat session with that user
3. Ask questions related to the stored memories

**Expected Behavior:**
- The AI should recall user-specific information
- Important memories should be prioritized in the context
- Memories should be organized by category (personal info, favorites, etc.)

### 3. Context Summarization

**Test Procedure:**
1. Have a long conversation (10+ message exchanges)
2. Continue the conversation and reference earlier points

**Expected Behavior:**
- For long conversations, older context should be summarized
- Recent messages should be preserved in detail
- Token usage should be managed efficiently

### 4. Error Handling and Fallbacks

**Test Procedure:**
1. Temporarily disable the Gemini API key
2. Send a message to the chat system

**Expected Behavior:**
- System should return a fallback response instead of crashing
- Error should be logged appropriately
- Fallback response should be empathetic and helpful

### 5. Rate Limiting

**Test Procedure:**
1. Send multiple rapid messages to the chat system
2. Check the timing of responses

**Expected Behavior:**
- There should be at least 1 second between responses for the same user
- Rate limit warnings should appear in logs when limits are exceeded
- System should automatically wait when rate limits are hit

## Database Verification

### User Memories Table

Verify the `user_memories` table contains expected data:

```sql
SELECT user_id, key, value, importance, category 
FROM user_memories 
WHERE user_id = 'YOUR_TEST_USER_ID' 
ORDER BY updated_at DESC;
```

### Conversation Memories Table

Verify conversation summaries are being created:

```sql
SELECT user_id, session_id, conversation_summary, topics, emotions 
FROM conversation_memories 
WHERE user_id = 'YOUR_TEST_USER_ID' 
ORDER BY start_time DESC 
LIMIT 5;
```

## Monitoring and Debugging

### Log Analysis

Check application logs for:
1. Context retrieval messages
2. Rate limiting warnings
3. Error handling events
4. Memory service operations

### Performance Metrics

Monitor:
1. Response times
2. Token usage
3. Memory retrieval performance
4. Rate limit events

## Troubleshooting

### Common Issues

1. **Context Not Preserved**
   - Check if `include_history=True` is being passed to `send_message`
   - Verify `comprehensive_context` is being passed from the chat route
   - Ensure memory services are properly initialized

2. **Rate Limiting Not Working**
   - Verify `_rate_limit_delay` is set correctly
   - Check if `time.sleep()` is being called when limits are exceeded

3. **Fallback Responses Not Triggering**
   - Test with invalid API credentials
   - Check exception handling in `send_message`

### Debug Mode

Enable debug logging to get more detailed information:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Integration Testing

### End-to-End Conversation Flow

1. **Session Start**
   - Verify user memories are loaded
   - Check personality context is applied

2. **Message Exchange**
   - Confirm conversation history is maintained
   - Verify context is properly formatted

3. **Session End**
   - Ensure conversation is summarized and stored
   - Check that memories are updated if needed

## Performance Testing

### Load Testing

For high-traffic scenarios:
1. Test concurrent users (multiple sessions)
2. Verify rate limiting works under load
3. Check database query performance
4. Monitor memory usage

### Stress Testing

1. Very long conversations (50+ messages)
2. Large memory sets (100+ user memories)
3. Rapid message exchanges
4. Network failure scenarios

## Validation Checklist

Before deployment, verify:

- [ ] All automated tests pass
- [ ] Manual conversation testing successful
- [ ] Memory integration working correctly
- [ ] Rate limiting functioning as expected
- [ ] Error handling and fallbacks operational
- [ ] Context summarization managing long conversations
- [ ] Database queries performing well
- [ ] Logs showing expected behavior
- [ ] No memory leaks or performance issues

## Rollback Plan

If issues are discovered:
1. Revert to previous version
2. Restore database backups if needed
3. Update documentation with lessons learned
4. Implement fixes and retest
