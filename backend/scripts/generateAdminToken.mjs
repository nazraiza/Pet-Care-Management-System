import jwt from 'jsonwebtoken';

const token = jwt.sign({ email: 'admin@example.com', role: 'admin' }, 'my_super_secret_key_12345');
console.log('Admin Token:', token);
