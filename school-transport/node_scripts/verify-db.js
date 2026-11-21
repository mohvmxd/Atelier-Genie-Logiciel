require('dotenv').config();

async function verifyConnection() {
    console.log('🔍 Vérification de la connection à la base de données...\n');
    
    try {
        // Import database config after dotenv is loaded
        const db = require('../config/database');
        
        // Test basic connection with timeout
        const connection = await Promise.race([
            db.getConnection(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
            )
        ]);
        console.log('✅ Connection réussie à MySQL');
        
        // Check if database exists
        const [databases] = await connection.query('SHOW DATABASES LIKE ?', [process.env.DB_NAME]);
        if (databases.length === 0) {
            console.log('❌ Base de données "school_transport" n\'existe pas');
            console.log('📋 Importez database.sql puis réessayez');
            connection.release();
            process.exit(1);
        }
        console.log('✅ Base de données "school_transport" trouvée');
        
        // Check tables
        const [tables] = await connection.query(
            'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?',
            [process.env.DB_NAME]
        );
        console.log(`✅ Nombre de tables: ${tables.length}`);
        
        if (tables.length === 0) {
            console.log('❌ Aucune table trouvée. Importez database.sql');
            connection.release();
            process.exit(1);
        }
        
        // Check if admin user exists
        const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
        if (users[0].count === 0) {
            console.log('⚠️  Aucun utilisateur admin trouvé');
            console.log('💡 Exécutez: npm run seed');
        } else {
            console.log(`✅ ${users[0].count} utilisateur(s) trouvé(s)`);
        }
        
        connection.release();
        console.log('\n✅ Base de données prête!\n');
        return true;
    } catch (error) {
        console.error('❌ Erreur de connection:\n', error.message);
        console.log('\n📋 Assurez-vous que:');
        console.log('   1. MySQL est en cours d\'exécution');
        console.log('   2. app_user a les bons identifiants (.env)');
        console.log('   3. La base school_transport existe');
        process.exit(1);
    }
}

verifyConnection();
