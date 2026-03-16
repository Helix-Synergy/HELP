const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Project = require('./models/Project');
const OnboardingTask = require('./models/OnboardingTask');
const Performance = require('./models/Performance');
const Payroll = require('./models/Payroll');
const Expense = require('./models/Expense');
const Ticket = require('./models/Ticket');
const Asset = require('./models/Asset');
const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hems');

const users = [
    {
        employeeId: 'HEMS-001',
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@helix.com',
        password: 'Password123',
        role: 'SUPER_ADMIN',
        designation: 'CEO',
    },
    {
        employeeId: 'HEMS-002',
        firstName: 'Sarah',
        lastName: 'Manager',
        email: 'manager@helix.com',
        password: 'Password123',
        role: 'MANAGER',
        designation: 'Engineering Lead',
    },
    {
        employeeId: 'HEMS-003',
        firstName: 'John',
        lastName: 'Employee',
        email: 'employee@helix.com',
        password: 'Password123',
        role: 'EMPLOYEE',
        designation: 'Software Engineer',
    }
];

const seedData = async () => {
    try {
        await User.deleteMany(); // Clear existing users
        await Project.deleteMany();
        await OnboardingTask.deleteMany();
        await Performance.deleteMany();
        await Payroll.deleteMany();
        await Expense.deleteMany();
        await Ticket.deleteMany();
        await Asset.deleteMany();
        await Course.deleteMany();
        await Enrollment.deleteMany();

        const createdUsers = await User.create(users);

        // Set John's manager to Sarah
        const manager = await User.findOne({ email: 'manager@helix.com' });
        const employee = await User.findOne({ email: 'employee@helix.com' });

        if (manager && employee) {
            employee.managerId = manager._id;
            await employee.save();
        }

        // Create Seed Projects
        if (manager) {
            await Project.create([
                { name: 'HEMS Development', projectCode: 'PRJ-101', description: 'Internal HR portal', client: 'Helix Inc', managerId: manager._id },
                { name: 'Acme Corp Rebrand', projectCode: 'PRJ-24A', description: 'Marketing site redesign', client: 'Acme Corp', managerId: manager._id },
                { name: 'Internal Training', projectCode: 'HR-001', description: 'Security & compliance modules', client: 'Helix Inc', managerId: manager._id }
            ]);
        }

        // Create Seed Onboarding Tasks for John
        const admin = await User.findOne({ email: 'admin@helix.com' });
        if (employee && manager && admin) {
            await OnboardingTask.create([
                { userId: employee._id, title: 'Upload Signed Offer Letter', description: 'Please upload the final signed copy of your offer letter.', type: 'ONBOARDING', assignedTo: employee._id, dueDate: new Date(Date.now() + 86400000) },
                { userId: employee._id, title: 'Review HR Policies Handbook', description: 'Read and acknowledge the 2026 Employee Handbook.', type: 'ONBOARDING', assignedTo: employee._id, dueDate: new Date(Date.now() + 86400000 * 3) },
                { userId: employee._id, title: 'Provision Mac Laptop', description: 'IT to setup laptop and ship it out.', type: 'ONBOARDING', assignedTo: admin._id, dueDate: new Date(Date.now() + 86400000 * 2) },
                { userId: employee._id, title: 'Grant Github & Jira Access', description: 'Engineering manager to add to github org.', type: 'ONBOARDING', assignedTo: manager._id, dueDate: new Date(Date.now() + 86400000 * 5) }
            ]);

            // Add sample performance reviews
            await Performance.create([
                {
                    userId: employee._id,
                    managerId: manager._id,
                    reviewCycle: 'Q1 2026',
                    goals: [
                        { title: 'Launch Timesheet Module', description: 'Complete React frontend and backend integration before end of Q1.', weightage: 50, selfRating: 4, managerRating: 5 },
                        { title: 'Mentorship', description: 'Mentor one junior engineer through onboarding process.', weightage: 30, selfRating: 3, managerRating: 4 },
                        { title: 'System Security Audit', description: 'Participate in the Q1 auth token review check.', weightage: 20, selfRating: 2, managerRating: 3 }
                    ],
                    overallRating: 4.2,
                    feedback: 'John is performing extremely well and has driven the major Q1 epics across the finish line early.',
                    status: 'MANAGER_REVIEWED'
                },
                {
                    userId: employee._id,
                    managerId: manager._id,
                    reviewCycle: 'Q2 2026',
                    goals: [
                        { title: 'Payroll Integration', description: 'Build and deploy Phase 3 payload and integration with Stripe API.', weightage: 70 },
                        { title: 'Fix P1 Bugs', description: 'Ensure MTTR for P1 bugs stays under 4 hours.', weightage: 30 }
                    ],
                    status: 'DRAFT'
                }
            ]);

            // Add sample Payslips (Past 3 months)
            await Payroll.create([
                { userId: employee._id, month: '2026-02', basicSalary: 5000, allowances: 500, deductions: 250, netPay: 5250, status: 'PAID' },
                { userId: employee._id, month: '2026-01', basicSalary: 5000, allowances: 500, deductions: 250, netPay: 5250, status: 'PAID' },
                { userId: employee._id, month: '2025-12', basicSalary: 5000, allowances: 500, deductions: 250, netPay: 5250, status: 'PAID' }
            ]);

            // Add sample Expenses
            await Expense.create([
                { userId: employee._id, category: 'TRAVEL', amount: 350, currency: 'USD', description: 'Flight to React Conf SF', status: 'REIMBURSED', approvedBy: manager._id },
                { userId: employee._id, category: 'EQUIPMENT', amount: 150, currency: 'USD', description: 'New mechanical keyboard', status: 'PENDING' }
            ]);

            // Add sample Helpdesk Tickets
            await Ticket.create([
                {
                    requesterId: employee._id, category: 'IT_SUPPORT', subject: 'VPN Access Denied',
                    description: 'I cannot connect to the corporate VPN from my home network.', priority: 'HIGH', status: 'IN_PROGRESS', assignedTo: admin._id,
                    comments: [{ userId: admin._id, text: 'We are looking into this, could you share your IP?' }]
                },
                {
                    requesterId: employee._id, category: 'HR_QUERY', subject: 'Missing Dental Insurance Card',
                    description: 'I have not received my physical insurance card in the mail yet.', priority: 'LOW', status: 'RESOLVED', assignedTo: admin._id,
                    comments: [{ userId: admin._id, text: 'A replacement has been shipped!' }]
                }
            ]);
            // Add sample Assets
            await Asset.create([
                { name: 'MacBook Pro 16" M3 Max', category: 'LAPTOP', serialNumber: 'MBP-2024-001', status: 'ASSIGNED', assignedTo: employee._id, assignmentDate: new Date('2024-01-15') },
                { name: 'Dell UltraSharp 27" 4K Monitor', category: 'MONITOR', serialNumber: 'DELL-2024-042', status: 'ASSIGNED', assignedTo: employee._id, assignmentDate: new Date('2024-01-15') },
                { name: 'iPhone 15 Pro - Corporate', category: 'MOBILE', serialNumber: 'IP15-2024-812', status: 'IN_REPAIR' },
                { name: 'Herman Miller Aeron Chair', category: 'FURNITURE', serialNumber: 'HM-2024-771', status: 'AVAILABLE' }
            ]);

            // Add sample Courses & Enrollments
            const courses = await Course.create([
                { title: 'Information Security 101', description: 'Mandatory annual infosec and phishing awareness training.', category: 'COMPLIANCE', durationMinutes: 45, mandatory: true, createdBy: admin._id },
                { title: 'Advanced React Patterns', description: 'Deep dive into performance optimization and context structures.', category: 'TECHNICAL', durationMinutes: 120, mandatory: false, createdBy: manager._id },
                { title: 'Leadership Communication', description: 'How to deliver effective 1-on-1s and critical feedback.', category: 'LEADERSHIP', durationMinutes: 60, mandatory: false, createdBy: admin._id }
            ]);

            await Enrollment.create([
                { courseId: courses[0]._id, userId: employee._id, status: 'IN_PROGRESS', progressPercent: 40 },
                { courseId: courses[1]._id, userId: employee._id, status: 'NOT_STARTED', progressPercent: 0 }
            ]);
        }

        console.log('Data Imported Successfully!');
        console.log('------------------------------------------------');
        console.log('Login Details:');
        console.log('Admin    : admin@helix.com / Password123');
        console.log('Manager  : manager@helix.com / Password123');
        console.log('Employee : employee@helix.com / Password123');
        console.log('------------------------------------------------');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
