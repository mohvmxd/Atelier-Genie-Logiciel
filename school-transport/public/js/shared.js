// ============================================
// School Transport Management System - Shared JS
// ============================================

const API_BASE = 'http://localhost:3648/api';
let authToken = localStorage.getItem('authToken');

// ============================================
// Theme Toggle
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const toggleThemeBtn = document.getElementById('toggle-theme');
    const htmlElement = document.documentElement;

    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    if (toggleThemeBtn) {
        toggleThemeBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.classList.contains('theme-dark') ? 'dark' : 'light';
            applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
        });
    }

    // Initialize page-specific code
    initializePage();
});

function applyTheme(theme) {
    const htmlElement = document.documentElement;
    const toggleThemeBtn = document.getElementById('toggle-theme');
    
    if (theme === 'dark') {
        htmlElement.classList.add('theme-dark');
        htmlElement.classList.remove('theme-light');
        if (toggleThemeBtn) toggleThemeBtn.textContent = 'Mode clair';
    } else {
        htmlElement.classList.add('theme-light');
        htmlElement.classList.remove('theme-dark');
        if (toggleThemeBtn) toggleThemeBtn.textContent = 'Mode sombre';
    }
    localStorage.setItem('theme', theme);
}

// ============================================
// Authentication Helpers
// ============================================

function setAuthToken(token) {
    authToken = token;
    localStorage.setItem('authToken', token);
}

function setUserRole(role) {
    localStorage.setItem('userRole', role);
}

function setUserRoleFromEmail(email) {
    // Determine role based on email domain
    if (email.includes('@parent.local') || email.includes('parent@test.com') || email.includes('marie@test.com') || email.includes('jean@test.com') || email.includes('ali@test.com')) {
        setUserRole('PARENT');
    } else if (email.includes('@ong.local') || email.includes('@mairie.local') || email.includes('admin@test.com') || email.includes('ong@test.com') || email.includes('city@test.com')) {
        setUserRole('ADMIN');
    } else {
        setUserRole('UNKNOWN');
    }
}

function getUserRole() {
    return localStorage.getItem('userRole');
}

function getAuthToken() {
    return localStorage.getItem('authToken');
}

function clearAuthToken() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    authToken = null;
}

function updateNavigationVisibility() {
    const userRole = getUserRole();
    const dashboardLinks = document.querySelectorAll('a[href="./dashboard.html"]');
    const parentPortalLinks = document.querySelectorAll('a[href="./parent-portal.html"]');
    
    if (userRole === 'PARENT') {
        // Hide Dashboard links, show Parent Portal links
        dashboardLinks.forEach(link => link.style.display = 'none');
        parentPortalLinks.forEach(link => link.style.display = 'inline-block');
    } else if (userRole === 'ADMIN') {
        // Show Dashboard links, completely hide Parent Portal links for all admin roles
        dashboardLinks.forEach(link => link.style.display = 'inline-block');
        parentPortalLinks.forEach(link => link.style.display = 'none');
    } else {
        // Unknown role - show Dashboard only as safe fallback
        dashboardLinks.forEach(link => link.style.display = 'inline-block');
        parentPortalLinks.forEach(link => link.style.display = 'none');
    }
}

// ============================================
// API Request Helper
// ============================================

async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            // Token expired or invalid
            clearAuthToken();
            redirectToLogin();
            return null;
        }

        const data = response.ok ? await response.json() : null;

        if (!response.ok) {
            console.error(`API Error (${response.status}):`, data);
            return null;
        }

        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        return null;
    }
}

// ============================================
// Authentication Flow
// ============================================

async function loginAdmin(email, password) {
    const data = await apiRequest('/auth/login-admin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

    if (data && data.token) {
        setAuthToken(data.token);
        setUserRoleFromEmail(email);
        console.log('Admin login successful:', data);
        return data;
    }

    return null;
}

async function loginParent(email, password) {
    const data = await apiRequest('/auth/login-parent', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

    if (data && data.token) {
        setAuthToken(data.token);
        setUserRoleFromEmail(email);
        console.log('Parent login successful:', data);
        return data;
    }

    return null;
}

async function logout() {
    await apiRequest('/auth/logout', { method: 'POST' });
    clearAuthToken();
    console.log('Logged out');
    redirectToLogin();
}

function redirectToLogin() {
    alert('Veuillez vous connecter.');
}

// ============================================
// Dashboard Helpers
// ============================================

async function getDashboardSummary(date) {
    const response = await apiRequest(`/dashboard/summary?date=${date}`);
    return response;
}

// ============================================
// Parent Portal Helpers
// ============================================

async function getParentStudents() {
    const response = await apiRequest('/parent/my-students');
    return response;
}

async function getStudentTrips(studentId) {
    const response = await apiRequest(`/parent/student-trips/${studentId}`);
    return response;
}

async function getStudentAttendance(studentId) {
    const response = await apiRequest(`/parent/student-attendance/${studentId}`);
    return response;
}

async function getCurrentUser() {
    const response = await apiRequest('/parent/current-user');
    return response;
}

// ============================================
// Student Helpers
// ============================================

async function getStudents() {
    const response = await apiRequest('/students');
    return response;
}

async function getStudent(id) {
    const response = await apiRequest(`/students/${id}`);
    return response;
}

async function updateStudent(id, data) {
    const response = await apiRequest(`/students/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    return response;
}

// ============================================
// Route Helpers
// ============================================

async function getRoutes() {
    const response = await apiRequest('/routes');
    return response;
}

async function getRoute(id) {
    const response = await apiRequest(`/routes/${id}`);
    return response;
}

// ============================================
// Planning Helpers
// ============================================

async function getPlanningData() {
    const response = await apiRequest('/planning');
    return response;
}

// ============================================
// UI Utilities
// ============================================

function showNotification(message, type = 'info') {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `notification notification--${type}`;
    notificationDiv.textContent = message;
    notificationDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 20px;
        background-color: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        border-radius: 0.375rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notificationDiv);

    setTimeout(() => {
        notificationDiv.remove();
    }, 3000);
}

// ============================================
// Page-Specific Initialization
// ============================================

function initializePage() {
    const page = getPageName();
    
    // Update navigation visibility based on user role
    updateNavigationVisibility();

    switch (page) {
        case 'index':
            initDashboard();
            break;
        case 'students':
            initStudents();
            break;
        case 'routes':
            initRoutes();
            break;
        case 'planning':
            initPlanning();
            break;
        case 'parent-portal':
            initParentPortal();
            break;
        default:
            break;
    }
}

function getPageName() {
    const path = window.location.pathname;
    if (path.includes('index')) return 'index';
    if (path.includes('students')) return 'students';
    if (path.includes('routes')) return 'routes';
    if (path.includes('planning')) return 'planning';
    if (path.includes('parent-portal')) return 'parent-portal';
    return 'unknown';
}

async function initDashboard() {
    console.log('Initializing dashboard...');
    
    const today = new Date().toISOString().split('T')[0];
    const summary = await getDashboardSummary(today);

    if (summary) {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="card">
                    <h2 class="card__title">Résumé du jour – ${summary.date}</h2>
                    <div class="dashboard-grid">
                        <div class="stat-card">
                            <div class="stat-value">${summary.studentsTransported}</div>
                            <div class="stat-label">Élèves transportés</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${summary.busesInService}</div>
                            <div class="stat-label">Bus en service</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${summary.attendanceRate}%</div>
                            <div class="stat-label">Taux de présence</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${summary.totalStudentsExpected}</div>
                            <div class="stat-label">Élèves prévus</div>
                        </div>
                    </div>
                </div>
            `;
        }
    }
}

async function initStudents() {
    console.log('Initializing students page...');
    const students = await getStudents();
    // Populate students list
}

async function initRoutes() {
    console.log('Initializing routes page...');
    const routes = await getRoutes();
    // Populate routes list
}

async function initPlanning() {
    console.log('Initializing planning page...');
    const planning = await getPlanningData();
    // Populate planning data
}

async function initParentPortal() {
    console.log('Initializing parent portal...');
    
    try {
        // Get parent information
        const token = getAuthToken();
        if (!token) return;
        
        // Fetch current user details from database
        const currentUser = await getCurrentUser();
        if (currentUser) {
            // Display parent info
            const parentNameElement = document.getElementById('parent-name');
            const parentEmailElement = document.getElementById('parent-email');
            
            if (parentNameElement) {
                parentNameElement.textContent = currentUser.fullname || 'Parent';
            }
            if (parentEmailElement) {
                parentEmailElement.textContent = currentUser.email;
            }
        }
        
        // Get parent's students
        const students = await getParentStudents();
        if (students && students.length > 0) {
            displayChildren(students);
        } else {
            document.getElementById('children-container').innerHTML = 
                '<p style="color: var(--color-text-muted);">Aucun enfant trouvé</p>';
        }
        
        // Load attendance history for first student
        if (students && students.length > 0) {
            const attendance = await getStudentAttendance(students[0].id);
            if (attendance && attendance.length > 0) {
                displayAttendanceHistory(attendance);
            } else {
                document.getElementById('attendance-history').innerHTML = 
                    '<tr><td colspan="6" style="text-align: center; color: var(--color-text-muted);">Aucune donnée de présence trouvée</td></tr>';
            }
        }
        
    } catch (error) {
        console.error('Error initializing parent portal:', error);
        showNotification('Erreur lors du chargement des données', 'error');
    }
}

function displayChildren(students) {
    const container = document.getElementById('children-container');
    if (!container) return;
    
    const childrenHtml = students.map(student => `
        <div class="card">
            <h3 style="margin: 0 0 8px 0; color: var(--color-primary);">${student.fullname}</h3>
            <p style="margin: 4px 0; color: var(--color-text-muted); font-size: 0.9rem;">
                <strong>École:</strong> ${student.school_name || 'N/A'}
            </p>
            <p style="margin: 4px 0; color: var(--color-text-muted); font-size: 0.9rem;">
                <strong>Arrêt:</strong> ${student.stop_name || 'N/A'}
            </p>
        </div>
    `).join('');
    
    container.innerHTML = childrenHtml;
}

function displayAttendanceHistory(attendance) {
    const tbody = document.getElementById('attendance-history');
    if (!tbody) return;
    
    const attendanceHtml = attendance.map(record => `
        <tr>
            <td>${new Date(record.date).toLocaleDateString('fr-FR')}</td>
            <td>${record.student_name}</td>
            <td>${record.route_name}</td>
            <td>${record.plate_number}</td>
            <td>
                <span class="badge ${record.present ? 'badge--success' : 'badge--danger'}">
                    ${record.present ? 'Présent' : 'Absent'}
                </span>
            </td>
            <td>
                <button class="btn btn--sm" onclick="viewDetails('${record.date}')">Détails</button>
            </td>
        </tr>
    `).join('');
    
    tbody.innerHTML = attendanceHtml;
}

// ============================================
// Global Styles for Dashboard Stats
// ============================================

const style = document.createElement('style');
style.textContent = `
    .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-top: 16px;
    }

    .stat-card {
        background-color: #f3f4f6;
        padding: 16px;
        border-radius: 0.375rem;
        text-align: center;
    }

    .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: #3b82f6;
        margin-bottom: 8px;
    }

    .stat-label {
        font-size: 0.875rem;
        color: #6b7280;
    }

    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
