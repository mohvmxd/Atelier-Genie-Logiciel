const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'app_user',
  password: 'school_transport_4.0',
  database: 'school_transport',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Data generation helpers
const SALT_ROUNDS = 10;
let credentialsLog = [];

// French first names
const firstNames = {
  male: ['Jean', 'Pierre', 'Marc', 'Philippe', 'Laurent', 'David', 'Michel', 'André', 'François', 'Jacques', 'Olivier', 'Luc', 'Pascal', 'Patrick', 'Christian', 'Bernard'],
  female: ['Marie', 'Jeanne', 'Nicole', 'Françoise', 'Anne', 'Martine', 'Danielle', 'Christine', 'Michèle', 'Monique', 'Claire', 'Sylvie', 'Valérie', 'Nathalie', 'Sophie', 'Isabelle'],
  student: ['Thomas', 'Lucas', 'Alexandre', 'Jérémy', 'Antoine', 'Gabriel', 'Adèle', 'Emma', 'Léa', 'Julie', 'Laura', 'Sarah', 'Camille', 'Élise', 'Inès', 'Zoé']
};

const lastNames = ['Dupont', 'Martin', 'Bernard', 'Dubois', 'Laurent', 'Simon', 'Michel', 'Lefevre', 'Lebon', 'Moreau', 'Vincent', 'Fournier', 'Morin', 'Girard', 'Andre', 'Lesueur', 'Rousseau', 'Blanc', 'Gillet', 'Hubert'];

const schools = [
  'École Primaire Jean Jaurès',
  'École Primaire Victor Hugo',
  'École Primaire Jules Ferry',
  'École Élémentaire Henri IV',
  'École Primaire Montessori',
  'École Primaire Charlemagne',
  'École Élémentaire La Fontaine',
  'École Primaire Pasteur',
  'École Élémentaire Pierre Curie',
  'École Primaire Francine Caron'
];

const stops = [
  { name: 'Arrêt Centre Ville', area: 'Centre', desc: 'Stop principal au centre' },
  { name: 'Arrêt Gare SNCF', area: 'Gare', desc: 'À proximité de la gare' },
  { name: 'Arrêt Parc Municipal', area: 'Parc', desc: 'Face au parc' },
  { name: 'Arrêt Rue de la Paix', area: 'Paix', desc: 'Rue de la Paix' },
  { name: 'Arrêt Place République', area: 'République', desc: 'Place de la République' },
  { name: 'Arrêt Avenue Marechal', area: 'Marechal', desc: 'Avenue du Maréchal' },
  { name: 'Arrêt Route de Rennes', area: 'Rennes', desc: 'Route de Rennes' },
  { name: 'Arrêt Quartier Nord', area: 'Nord', desc: 'Quartier Nord' },
  { name: 'Arrêt Chemin Campagne', area: 'Campagne', desc: 'Chemin de la Campagne' },
  { name: 'Arrêt Zone Industrielle', area: 'Industrial', desc: 'Zone Industrielle' }
];

const busPlates = [
  'BUS-001', 'BUS-002', 'BUS-003', 'BUS-004', 'BUS-005',
  'BUS-006', 'BUS-007', 'BUS-008', 'BUS-009', 'BUS-010',
  'BUS-011', 'BUS-012', 'BUS-013', 'BUS-014', 'BUS-015',
  'BUS-016', 'BUS-017', 'BUS-018', 'BUS-019', 'BUS-020'
];

const drivers = ['Alain Rousseau', 'Bernard Leclerc', 'Claude Fontaine', 'Denis Maillard', 'Éric Sato', 'Fabrice Moreau', 'Gérald Petit', 'Henri Blanc', 'Ivan Caron', 'Jacques Dubois', 'Karim Benoit', 'Laurent Noël', 'Marc Girard', 'Noel Simon', 'Olivier Lefevre', 'Patrick Vincent', 'Quentin Fournier', 'Rémi Martin', 'Serge Morin', 'Thierry Houdart'];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

function generatePassword() {
  const length = 12;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function getGender() {
  return Math.random() > 0.5 ? 'male' : 'female';
}

function generateName(type = 'person') {
  if (type === 'student') {
    const firstName = getRandomElement(firstNames.student);
    const lastName = getRandomElement(lastNames);
    return `${firstName} ${lastName}`;
  }
  const gender = getGender();
  const firstName = getRandomElement(firstNames[gender]);
  const lastName = getRandomElement(lastNames);
  return `${firstName} ${lastName}`;
}

async function seedDatabase() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🌱 Starting database seeding...\n');

    // Clear existing data (in reverse dependency order)
    console.log('Clearing existing data...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE attendances');
    await connection.query('TRUNCATE TABLE bus_assignments');
    await connection.query('TRUNCATE TABLE trip_days');
    await connection.query('TRUNCATE TABLE parent_students');
    await connection.query('TRUNCATE TABLE routes');
    await connection.query('TRUNCATE TABLE students');
    await connection.query('TRUNCATE TABLE buses');
    await connection.query('TRUNCATE TABLE stops');
    await connection.query('TRUNCATE TABLE schools');
    await connection.query('TRUNCATE TABLE parents');
    await connection.query('TRUNCATE TABLE users');
    await connection.query('TRUNCATE TABLE planning_runs');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // === 1. CREATE USERS (6 total: 3 ONG, 3 MAIRIE) ===
    console.log('📝 Creating users...');
    const userPositions = ['director', 'hr_manager', 'accounting_manager'];
    const usersData = [];
    
    // ONG users
    for (let i = 0; i < 3; i++) {
      const name = generateName();
      const position = userPositions[i];
      const email = `${name.split(' ')[0].toLowerCase()}.${position}@ong.local`;
      const password = generatePassword();
      const hashedPassword = await hashPassword(password);
      
      usersData.push({
        name,
        email,
        password_hash: hashedPassword,
        role: 'ONG',
        plainPassword: password
      });
      
      credentialsLog.push(`[USER - ONG - ${position.toUpperCase()}] ${name}`);
      credentialsLog.push(`  Email: ${email}`);
      credentialsLog.push(`  Password: ${password}`);
      credentialsLog.push('');
    }
    
    // MAIRIE users
    for (let i = 0; i < 3; i++) {
      const name = generateName();
      const position = userPositions[i];
      const email = `${name.split(' ')[0].toLowerCase()}.${position}@mairie.local`;
      const password = generatePassword();
      const hashedPassword = await hashPassword(password);
      
      usersData.push({
        name,
        email,
        password_hash: hashedPassword,
        role: 'MAIRIE',
        plainPassword: password
      });
      
      credentialsLog.push(`[USER - MAIRIE - ${position.toUpperCase()}] ${name}`);
      credentialsLog.push(`  Email: ${email}`);
      credentialsLog.push(`  Password: ${password}`);
      credentialsLog.push('');
    }

    for (const user of usersData) {
      await connection.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [user.name, user.email, user.password_hash, user.role]
      );
    }
    console.log(`✅ Created ${usersData.length} users\n`);

    // === 2. CREATE SCHOOLS (10 total) ===
    console.log('🏫 Creating schools...');
    const schoolIds = [];
    for (const schoolName of schools) {
      const [result] = await connection.query(
        'INSERT INTO schools (name, address, city) VALUES (?, ?, ?)',
        [schoolName, `${getRandomInt(1, 999)} Rue de l'École`, 'Saint-Brieuc']
      );
      schoolIds.push(result.insertId);
    }
    console.log(`✅ Created ${schoolIds.length} schools\n`);

    // === 3. CREATE STOPS (10 total) ===
    console.log('🛑 Creating stops...');
    const stopIds = [];
    for (const stop of stops) {
      const [result] = await connection.query(
        'INSERT INTO stops (name, area, description) VALUES (?, ?, ?)',
        [stop.name, stop.area, stop.desc]
      );
      stopIds.push(result.insertId);
    }
    console.log(`✅ Created ${stopIds.length} stops\n`);

    // === 4. CREATE BUSES (20 total: 2 per stop) ===
    console.log('🚌 Creating buses...');
    const busIds = [];
    let busIndex = 0;
    for (let i = 0; i < stopIds.length; i++) {
      for (let j = 0; j < 2; j++) {
        const [result] = await connection.query(
          'INSERT INTO buses (plate_number, capacity, driver_name, active) VALUES (?, ?, ?, ?)',
          [busPlates[busIndex], getRandomInt(30, 50), drivers[busIndex], 1]
        );
        busIds.push(result.insertId);
        busIndex++;
      }
    }
    console.log(`✅ Created ${busIds.length} buses\n`);

    // === 5. CREATE ROUTES (2 per school) ===
    console.log('🛣️ Creating routes...');
    const routeIds = [];
    const departureTimes = ['07:30:00', '14:30:00'];
    for (let i = 0; i < schoolIds.length; i++) {
      for (let j = 0; j < 2; j++) {
        const busId = busIds[Math.floor(Math.random() * busIds.length)];
        const [result] = await connection.query(
          'INSERT INTO routes (name, school_id, bus_id, departure_time, active) VALUES (?, ?, ?, ?, ?)',
          [`Route ${i + 1}-${j + 1}`, schoolIds[i], busId, departureTimes[j], 1]
        );
        routeIds.push(result.insertId);
      }
    }
    console.log(`✅ Created ${routeIds.length} routes\n`);

    // === 6. CREATE PARENTS (20 total) ===
    console.log('👨‍👩‍👧 Creating parents...');
    const parentIds = [];
    const parentsData = [];
    for (let i = 0; i < 20; i++) {
      const name = generateName();
      const email = `${name.replace(/\s+/g, '.').toLowerCase()}@parent.local`;
      const password = generatePassword();
      const hashedPassword = await hashPassword(password);
      
      const [result] = await connection.query(
        'INSERT INTO parents (fullname, email, password_hash, phone) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, `+33${getRandomInt(100000000, 999999999)}`]
      );
      parentIds.push(result.insertId);
      parentsData.push({ name, email, plainPassword: password });
      
      credentialsLog.push(`[PARENT] ${name}`);
      credentialsLog.push(`  Email: ${email}`);
      credentialsLog.push(`  Password: ${password}`);
      credentialsLog.push('');
    }
    console.log(`✅ Created ${parentIds.length} parents\n`);

    // === 7. CREATE STUDENTS (20-60 total: 1-3 per parent) ===
    console.log('👨‍🎓 Creating students...');
    const studentIds = [];
    const parentStudentLinks = [];
    for (const parentId of parentIds) {
      const numStudents = getRandomInt(1, 3);
      for (let i = 0; i < numStudents; i++) {
        const studentName = generateName('student');
        const schoolId = getRandomElement(schoolIds);
        const stopId = getRandomElement(stopIds);
        
        const [result] = await connection.query(
          'INSERT INTO students (fullname, school_id, stop_id, active) VALUES (?, ?, ?, ?)',
          [studentName, schoolId, stopId, 1]
        );
        const studentId = result.insertId;
        studentIds.push(studentId);
        parentStudentLinks.push({ parentId, studentId });
      }
    }
    
    // Insert parent-student relationships
    for (const link of parentStudentLinks) {
      await connection.query(
        'INSERT INTO parent_students (parent_id, student_id) VALUES (?, ?)',
        [link.parentId, link.studentId]
      );
    }
    console.log(`✅ Created ${studentIds.length} students\n`);

    // === 8. CREATE TRIP DAYS (10 days: 3 past + 7 future school days) ===
    console.log('📅 Creating trip days...');
    const tripDayIds = [];
    const tripDates = [
      '2026-04-15', '2026-04-16', '2026-04-17', // Last 3 school days
      '2026-04-21', '2026-04-22', '2026-04-23', '2026-04-24', '2026-04-27', '2026-04-28', '2026-04-29' // Next 7 school days
    ];
    
    for (const routeId of routeIds) {
      for (const date of tripDates) {
        const [result] = await connection.query(
          'INSERT INTO trip_days (route_id, date, status) VALUES (?, ?, ?)',
          [routeId, date, 'NON_DEMARREE']
        );
        tripDayIds.push(result.insertId);
      }
    }
    console.log(`✅ Created ${tripDayIds.length} trip day records\n`);

    // === 9. CREATE ATTENDANCES (sample records) ===
    console.log('✅ Creating attendance records...');
    let attendanceCount = 0;
    for (const tripDayId of tripDayIds.slice(0, 10)) {
      for (const studentId of studentIds.slice(0, getRandomInt(5, 15))) {
        try {
          await connection.query(
            'INSERT INTO attendances (trip_day_id, student_id, present) VALUES (?, ?, ?)',
            [tripDayId, studentId, Math.random() > 0.1 ? 1 : 0]
          );
          attendanceCount++;
        } catch (err) {
          // Duplicate entries ignored
        }
      }
    }
    console.log(`✅ Created ${attendanceCount} attendance records\n`);

    // === 10. CREATE PLANNING RUNS (sample) ===
    console.log('📊 Creating planning runs...');
    const userId = usersData[0]; // Use first user
    const [userResult] = await connection.query('SELECT id FROM users LIMIT 1');
    const createdByUserId = userResult[0]?.id || 1;
    
    const [planResult] = await connection.query(
      'INSERT INTO planning_runs (date, created_by) VALUES (?, ?)',
      ['2026-04-20', createdByUserId]
    );
    console.log('✅ Created planning run\n');

    console.log('═══════════════════════════════════════════');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════\n');
    
    // Write credentials to file
    const credentialsPath = path.join(__dirname, '../CREDENTIALS.txt');
    const credentialsContent = `
╔════════════════════════════════════════════════════════════╗
║         SCHOOL TRANSPORT - TEST CREDENTIALS FILE           ║
║                  Generated: ${new Date().toLocaleString()}                ║
╚════════════════════════════════════════════════════════════╝

⚠️  IMPORTANT: These are plaintext passwords for testing only.
    Never use these in production!

═════════════════════════════════════════════════════════════

${credentialsLog.join('\n')}

═════════════════════════════════════════════════════════════

SUMMARY:
--------
✅ Users: 6 (3 ONG + 3 MAIRIE)
✅ Parents: 20
✅ Students: ${studentIds.length}
✅ Schools: ${schoolIds.length}
✅ Stops: ${stopIds.length}
✅ Buses: ${busIds.length}
✅ Routes: ${routeIds.length}
✅ Trip Days: ${tripDayIds.length}
✅ Attendance Records: ${attendanceCount}

═════════════════════════════════════════════════════════════
`;

    fs.writeFileSync(credentialsPath, credentialsContent);
    console.log(`📄 Credentials saved to: ${credentialsPath}\n`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await connection.release();
    await pool.end();
  }
}

// Run the seeding
seedDatabase().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
