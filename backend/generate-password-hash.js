const bcrypt = require('bcryptjs');

const password = 'Tung123456@';
const saltRounds = 12;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error hashing password:', err);
        process.exit(1);
    }
    
    console.log('\n==============================================');
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('==============================================\n');
    console.log('SQL Command:');
    console.log(`UPDATE \`users\` SET \`password\` = '${hash}' WHERE 1=1;`);
    console.log('\n');
});
