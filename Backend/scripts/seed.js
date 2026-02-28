require('dotenv').config();
const mongoose = require('mongoose');
const Management = require('../src/models/Management');
const Student = require('../src/models/Student');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/outr_hostel_food');
  console.log('Connected to MongoDB');

  // Create hostel admins
  const admins = [
    { name: 'RHR Admin',  email: 'admin.rhr@outr.ac.in',  password: 'rhr@admin123',  hostelName: 'RHR',  role: 'hostel_admin' },
    { name: 'APJ Admin',  email: 'admin.apj@outr.ac.in',  password: 'apj@admin123',  hostelName: 'APJ',  role: 'hostel_admin' },
    { name: 'KHR Admin',  email: 'admin.khr@outr.ac.in',  password: 'khr@admin123',  hostelName: 'KHR',  role: 'hostel_admin' },
    { name: 'KCHR Admin', email: 'admin.kchr@outr.ac.in', password: 'kchr@admin123', hostelName: 'KCHR', role: 'hostel_admin' },
    { name: 'Super Admin', email: 'superadmin@outr.ac.in', password: 'super@admin123', hostelName: null, role: 'super_admin' },
  ];

  for (const a of admins) {
    const exists = await Management.findOne({ email: a.email });
    if (!exists) {
      await Management.create(a);
      console.log(`✅ Created admin: ${a.email}`);
    } else {
      console.log(`⏭  Admin exists: ${a.email}`);
    }
  }

  // Create a demo student
  const demoStudent = {
    name: 'Demo Student',
    registrationNo: 'DEMO2024001',
    contactNo: '9876543210',
    badNo: '1011',
    hostelName: 'RHR',
    password: 'demo123',
    defaultFoodPref: 'veg',
  };

  const exists = await Student.findOne({ registrationNo: demoStudent.registrationNo });
  if (!exists) {
    await Student.create(demoStudent);
    console.log(`✅ Created demo student: ${demoStudent.registrationNo}`);
  }

  console.log('\n🎉 Seed complete!');
  console.log('\nLogin credentials:');
  admins.forEach((a) => console.log(`  ${a.email} / ${a.password}`));
  console.log(`  Student: ${demoStudent.registrationNo} / ${demoStudent.password}`);

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
