const db = require('../config/database');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function seedDatabase() {
    let connection;
    try {
        console.log('🌱 Insertion des données de test...\n');
        
        connection = await db.getConnection();
        
        // Check if data already exists
        const [existingUsers] = await connection.query('SELECT COUNT(*) as count FROM users');
        const [existingParents] = await connection.query('SELECT COUNT(*) as count FROM parents');
        
        if (existingUsers[0].count > 0 || existingParents[0].count > 0) {
            console.log('⚠️  Des données existent déjà. Vous pouvez continuer ou arrêter.\n');
        }
        
        // Hash passwords
        const adminHash = await bcrypt.hash('admin123', 10);
        const parentHash = await bcrypt.hash('parent123', 10);
        const busDriverHash = await bcrypt.hash('driver123', 10);
        
        // 1. Insert users (admin accounts)
        console.log('👤 Insertion des utilisateurs admin...');
        await connection.query(
            'INSERT IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            ['Admin Test', 'admin@test.com', adminHash, 'ADMIN']
        );
        await connection.query(
            'INSERT IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            ['ONG Manager', 'ong@test.com', adminHash, 'ONG']
        );
        await connection.query(
            'INSERT IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            ['City Manager', 'city@test.com', adminHash, 'MAIRIE']
        );
        console.log('   ✅ 3 utilisateurs admin créés');
        
        // 2. Insert schools
        console.log('🏫 Insertion des écoles...');
        await connection.query(
            'INSERT IGNORE INTO schools (name, address, city) VALUES (?, ?, ?)',
            ['Groupe Scolaire Saint Paul', '123 Rue de la Paix', 'Porto-Novo']
        );
        await connection.query(
            'INSERT IGNORE INTO schools (name, address, city) VALUES (?, ?, ?)',
            ['Collège Jean Pliya', '456 Avenue du Progrès', 'Porto-Novo']
        );
        await connection.query(
            'INSERT IGNORE INTO schools (name, address, city) VALUES (?, ?, ?)',
            ['Lycée Technique de Porto-Novo', '789 Boulevard du Commerce', 'Porto-Novo']
        );
        console.log('   ✅ 3 écoles créées');
        
        // 3. Insert stops (ramassage points)
        console.log('🛑 Insertion des points de ramassage...');
        await connection.query(
            'INSERT IGNORE INTO stops (name, area, description) VALUES (?, ?, ?)',
            ['Marché Dantokpa', 'Dantokpa', 'Grand marché central']
        );
        await connection.query(
            'INSERT IGNORE INTO stops (name, area, description) VALUES (?, ?, ?)',
            ['Gare Routière', 'Jonquet', 'Station principale']
        );
        await connection.query(
            'INSERT IGNORE INTO stops (name, area, description) VALUES (?, ?, ?)',
            ['Place de l\'Indépendance', 'Centre-ville', 'Centre administratif']
        );
        await connection.query(
            'INSERT IGNORE INTO stops (name, area, description) VALUES (?, ?, ?)',
            ['Quartier Akron', 'Akron', 'Zone résidentielle']
        );
        console.log('   ✅ 4 points de ramassage créés');
        
        // 4. Insert buses
        console.log('🚍 Insertion des bus...');
        await connection.query(
            'INSERT IGNORE INTO buses (plate_number, capacity, driver_name, active) VALUES (?, ?, ?, ?)',
            ['BJ-1234-AA', 40, 'Kofi Mensah', 1]
        );
        await connection.query(
            'INSERT IGNORE INTO buses (plate_number, capacity, driver_name, active) VALUES (?, ?, ?, ?)',
            ['BJ-5678-BB', 50, 'Yacine Diallo', 1]
        );
        await connection.query(
            'INSERT IGNORE INTO buses (plate_number, capacity, driver_name, active) VALUES (?, ?, ?, ?)',
            ['BJ-9012-CC', 45, 'Marie Sow', 1]
        );
        console.log('   ✅ 3 bus créés');
        
        // 5. Insert parents
        console.log('👨‍👩‍👧 Insertion des parents...');
        await connection.query(
            'INSERT IGNORE INTO parents (fullname, phone, email, password_hash) VALUES (?, ?, ?, ?)',
            ['Jean Dupont', '+229 97123456', 'jean@test.com', parentHash]
        );
        await connection.query(
            'INSERT IGNORE INTO parents (fullname, phone, email, password_hash) VALUES (?, ?, ?, ?)',
            ['Marie Kouevi', '+229 98234567', 'marie@test.com', parentHash]
        );
        await connection.query(
            'INSERT IGNORE INTO parents (fullname, phone, email, password_hash) VALUES (?, ?, ?, ?)',
            ['Ali Soumahoro', '+229 99345678', 'ali@test.com', parentHash]
        );
        console.log('   ✅ 3 parents créés');
        
        // 6. Insert students
        console.log('👦 Insertion des élèves...');
        const [schools] = await connection.query('SELECT id FROM schools LIMIT 3');
        const [parents] = await connection.query('SELECT id FROM parents LIMIT 3');
        
        const studentData = [
            ['Koffi Mensah', '2010-05-15', schools[0].id],
            ['Ama Osei', '2011-08-22', schools[1].id],
            ['Kwesi Owusu', '2012-03-10', schools[2].id],
            ['Abena Owusu', '2013-07-18', schools[0].id],
        ];
        
        for (const [name, birthDate, schoolId] of studentData) {
            await connection.query(
                'INSERT IGNORE INTO students (name, birth_date, school_id, active) VALUES (?, ?, ?, ?)',
                [name, birthDate, schoolId, 1]
            );
        }
        console.log('   ✅ 4 élèves créés');
        
        // 7. Link parents to students
        console.log('🔗 Liaison parents-élèves...');
        const [students] = await connection.query('SELECT id FROM students LIMIT 4');
        
        if (students.length > 0 && parents.length > 0) {
            for (let i = 0; i < Math.min(students.length, 2); i++) {
                await connection.query(
                    'INSERT IGNORE INTO parent_students (parent_id, student_id) VALUES (?, ?)',
                    [parents[0].id, students[i].id]
                );
            }
            for (let i = 2; i < students.length; i++) {
                await connection.query(
                    'INSERT IGNORE INTO parent_students (parent_id, student_id) VALUES (?, ?)',
                    [parents[1].id, students[i].id]
                );
            }
        }
        console.log('   ✅ Liaisons créées');
        
        // 8. Insert routes
        console.log('🛣️ Insertion des circuits...');
        const [theBuses] = await connection.query('SELECT id FROM buses LIMIT 3');
        const [theStops] = await connection.query('SELECT id FROM stops LIMIT 4');
        
        if (theBuses.length > 0 && theStops.length >= 2) {
            await connection.query(
                'INSERT IGNORE INTO routes (name, bus_id, departure_point_id, destination_point_id, departure_time, arrival_time, distance_km) VALUES (?, ?, ?, ?, ?, ?, ?)',
                ['Route Dantokpa → École Saint Paul', theBuses[0].id, theStops[0].id, theStops[1].id, '06:30', '07:15', 8.5]
            );
            await connection.query(
                'INSERT IGNORE INTO routes (name, bus_id, departure_point_id, destination_point_id, departure_time, arrival_time, distance_km) VALUES (?, ?, ?, ?, ?, ?, ?)',
                ['Route Gare → Collège Pliya', theBuses[1].id, theStops[1].id, theStops[2].id, '06:45', '07:30', 12.3]
            );
            await connection.query(
                'INSERT IGNORE INTO routes (name, bus_id, departure_point_id, destination_point_id, departure_time, arrival_time, distance_km) VALUES (?, ?, ?, ?, ?, ?, ?)',
                ['Route Akron → Lycée Technique', theBuses[2].id, theStops[3].id, theStops[2].id, '07:00', '07:50', 15.0]
            );
        }
        console.log('   ✅ 3 circuits créés');
        
        // 9. Insert trip days
        console.log('📅 Insertion des trajets...');
        const [theRoutes] = await connection.query('SELECT id FROM routes LIMIT 3');
        const today = new Date().toISOString().split('T')[0];
        
        for (const route of theRoutes) {
            await connection.query(
                'INSERT IGNORE INTO trip_days (route_id, trip_date, status) VALUES (?, ?, ?)',
                [route.id, today, 'COMPLETED']
            );
        }
        console.log('   ✅ Trajets créés');
        
        // 10. Insert attendance records
        console.log('📝 Insertion des présences...');
        const [theStudents] = await connection.query('SELECT id FROM students LIMIT 4');
        const [theTripDays] = await connection.query('SELECT id FROM trip_days LIMIT 2');
        
        for (let i = 0; i < Math.min(theStudents.length, 2); i++) {
            for (const trip of theTripDays) {
                await connection.query(
                    'INSERT IGNORE INTO attendances (student_id, trip_day_id, present, notes) VALUES (?, ?, ?, ?)',
                    [theStudents[i].id, trip.id, 1, 'Présence confirmée']
                );
            }
        }
        if (theStudents.length > 2 && theTripDays.length > 0) {
            await connection.query(
                'INSERT IGNORE INTO attendances (student_id, trip_day_id, present, notes) VALUES (?, ?, ?, ?)',
                [theStudents[2].id, theTripDays[0].id, 0, 'Absent justifié - Maladie']
            );
        }
        console.log('   ✅ Présences enregistrées');
        
        connection.release();
        
        console.log('\n✅ Base de données remplie avec succès!\n');
        console.log('📝 Identifiants de test:');
        console.log('   Admin: admin@test.com / admin123');
        console.log('   Parent: jean@test.com / parent123\n');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'insertion:', error.message);
        if (connection) connection.release();
        process.exit(1);
    }
}

seedDatabase();
