// Extract all users with their unhashed passwords for testing
const db = require('../config/database');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    console.log('Extracting users and their passwords...');
    
    let output = '';
    output += '=====================================\n';
    output += 'SCHOOL TRANSPORT APP - LOGIN CREDENTIALS\n';
    output += '=====================================\n';
    output += 'Generated on: ' + new Date().toLocaleString() + '\n\n';
    
    // Extract users table
    console.log('Checking users table...');
    try {
      const [users] = await db.query('SELECT id, username, email, password_hash, role FROM users');
      
      if (users.length > 0) {
        output += 'USERS TABLE (' + users.length + ' records)\n';
        output += '------------------------------\n';
        
        for (const user of users) {
          output += `ID: ${user.id}\n`;
          output += `Username: ${user.username || 'N/A'}\n`;
          output += `Email: ${user.email || 'N/A'}\n`;
          output += `Password: ${user.password_hash}\n`;
          output += `Role: ${user.role || 'N/A'}\n`;
          output += `Hashed: ${user.password_hash.startsWith('$2') ? 'Yes' : 'No (Plain text)'}\n`;
          output += '---\n';
        }
        output += '\n';
      } else {
        output += 'USERS TABLE: No records found\n\n';
      }
    } catch (error) {
      output += 'USERS TABLE: Error accessing table - ' + error.message + '\n\n';
    }
    
    // Extract parents table
    console.log('Checking parents table...');
    try {
      const [parents] = await db.query('SELECT id, nom, prenom, email, password_hash, telephone FROM parents');
      
      if (parents.length > 0) {
        output += 'PARENTS TABLE (' + parents.length + ' records)\n';
        output += '------------------------------\n';
        
        for (const parent of parents) {
          output += `ID: ${parent.id}\n`;
          output += `Name: ${parent.prenom || ''} ${parent.nom || ''}\n`;
          output += `Email: ${parent.email || 'N/A'}\n`;
          output += `Phone: ${parent.telephone || 'N/A'}\n`;
          output += `Password: ${parent.password_hash}\n`;
          output += `Hashed: ${parent.password_hash.startsWith('$2') ? 'Yes' : 'No (Plain text)'}\n`;
          output += '---\n';
        }
        output += '\n';
      } else {
        output += 'PARENTS TABLE: No records found\n\n';
      }
    } catch (error) {
      output += 'PARENTS TABLE: Error accessing table - ' + error.message + '\n\n';
    }
    
    // Extract any other user-related tables
    console.log('Checking for other user tables...');
    try {
      const [tables] = await db.query(
        'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND (TABLE_NAME LIKE "%user%" OR TABLE_NAME LIKE "%admin%" OR TABLE_NAME LIKE "%auth%")',
        [process.env.DB_NAME || 'school_transport']
      );
      
      for (const table of tables) {
        const tableName = table.TABLE_NAME;
        if (tableName !== 'users' && tableName !== 'parents') {
          try {
            const [records] = await db.query(`SELECT * FROM ${tableName} LIMIT 10`);
            if (records.length > 0) {
              output += `${tableName.toUpperCase()} TABLE (${records.length} records shown)\n`;
              output += '------------------------------\n';
              
              for (const record of records) {
                output += `Record ID: ${record.id || record.id || 'N/A'}\n`;
                Object.keys(record).forEach(key => {
                  if (key.includes('password') || key.includes('pass')) {
                    output += `${key}: ${record[key]}\n`;
                  } else if (key.includes('email') || key.includes('user') || key.includes('login')) {
                    output += `${key}: ${record[key]}\n`;
                  }
                });
                output += '---\n';
              }
              output += '\n';
            }
          } catch (error) {
            output += `${tableName.toUpperCase()} TABLE: Error accessing - ${error.message}\n\n`;
          }
        }
      }
    } catch (error) {
      console.log('Could not check for additional tables:', error.message);
    }
    
    output += '=====================================\n';
    output += 'NOTES:\n';
    output += '- Hashed passwords start with $2b$ or $2a$\n';
    output += '- Plain text passwords are shown as-is\n';
    output += '- Use these credentials for testing the login functionality\n';
    output += '=====================================\n';
    
    // Write to file
    const filePath = path.join(__dirname, '..', 'users_credentials.txt');
    fs.writeFileSync(filePath, output, 'utf8');
    
    console.log('✅ User credentials extracted successfully!');
    console.log('📁 File saved to: users_credentials.txt');
    console.log(`📊 Total users processed: ${output.split('---').length - 1}`);
    
  } catch (error) {
    console.error('❌ Error extracting users:', error.message);
    console.error('Full error:', error);
  } finally {
    process.exit();
  }
})();
