import asyncio
import aiosqlite
import bcrypt

async def test():
    try:
        async with aiosqlite.connect('creditsight.db') as db:
            async with db.execute('SELECT password_hash, username FROM users WHERE username = ? OR email = ?', ('harshittiwari4u@gmail.com', 'harshittiwari4u@gmail.com')) as cursor:
                row = await cursor.fetchone()
                print("Row:", row)
                if row:
                    pwd_bytes = 'admin@03'.encode('utf-8')[:72]
                    hash_bytes = row[0].encode('utf-8')
                    print("Hash valid:", bcrypt.checkpw(pwd_bytes, hash_bytes))
    except Exception as e:
        print("Error:", e)
        import traceback
        traceback.print_exc()

asyncio.run(test())
