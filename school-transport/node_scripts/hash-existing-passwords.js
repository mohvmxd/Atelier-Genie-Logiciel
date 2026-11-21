// run from project root: node node_scripts/hash-existing-passwords.js
const db = require('../config/database');
const bcrypt = require('bcrypt');

(async () => {
  try {
    // Hash users table
    const [users] = await db.query('SELECT id, password_hash FROM users');
    for (const u of users) {
      if (!u.password_hash.startsWith('$2')) {        // plain text
        const h = await bcrypt.hash(u.password_hash, 10);
        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [h, u.id]);
        console.log(`Hashed password for user ${u.id}`);
      }
    }

    // Hash parents table
    const [parents] = await db.query('SELECT id, password_hash FROM parents');
    for (const p of parents) {
      if (!p.password_hash.startsWith('$2')) {        // plain text
        const h = await bcrypt.hash(p.password_hash, 10);
        await db.query('UPDATE parents SET password_hash = ? WHERE id = ?', [h, p.id]);
        console.log(`Hashed password for parent ${p.id}`);
      }
    }

    console.log('All plain-text passwords have been hashed.');
  } catch (error) {
    console.error('Error hashing passwords:', error);
  } finally {
    process.exit();
  }
})();