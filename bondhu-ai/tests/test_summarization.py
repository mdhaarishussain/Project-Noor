"""
Quick script to test conversation summarization
"""
import asyncio
from core.database.supabase_client import get_supabase_client

async def test_session_messages():
    """Check if messages exist for our test session"""
    client = get_supabase_client()
    
    user_id = "8eebd292-186f-4afd-a33f-ef57ae0e1d17"
    session_id = "test-session-anime"
    
    print(f"\n=== Checking messages for session: {session_id} ===\n")
    
    response = client.supabase.table("chat_messages") \
        .select("id, sender_type, message_text, session_id, timestamp") \
        .eq("user_id", user_id) \
        .eq("session_id", session_id) \
        .order("timestamp", desc=False) \
        .execute()
    
    messages = response.data
    print(f"Found {len(messages)} messages:\n")
    
    for i, msg in enumerate(messages, 1):
        print(f"{i}. [{msg['sender_type']}] {msg['message_text'][:60]}...")
        print(f"   ID: {msg['id']}, Session: {msg['session_id']}")
        print()
    
    if not messages:
        print("❌ No messages found! The session_id might not be saved correctly.")
        print("\nLet's check all recent messages for this user:")
        
        all_response = client.supabase.table("chat_messages") \
            .select("id, sender_type, message_text, session_id, timestamp") \
            .eq("user_id", user_id) \
            .order("timestamp", desc=True) \
            .limit(10) \
            .execute()
        
        print(f"\nLast 10 messages:")
        for msg in all_response.data:
            print(f"- [{msg['sender_type']}] Session: {msg.get('session_id', 'NO SESSION ID')}")
            print(f"  {msg['message_text'][:80]}...")
            print()

if __name__ == "__main__":
    asyncio.run(test_session_messages())
