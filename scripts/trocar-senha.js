// Troca a senha de uma conta pelo terminal (para quando esquecer a senha).
// Uso: npm run senha -- seu@email.com NovaSenha123
const db = require('../src/db');
const { hashPassword } = require('../src/password');

const [email = '', password = ''] = process.argv.slice(2);
if (!email || password.length < 6) {
  console.log('Uso: npm run senha -- seu@email.com NovaSenha123   (senha com 6+ caracteres)');
  process.exit(1);
}

const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
if (!user) {
  console.log(`Nenhuma conta com o e-mail ${email}. Contas cadastradas:`);
  for (const u of db.prepare('SELECT email FROM users ORDER BY id').all()) console.log(`  - ${u.email}`);
  process.exit(1);
}

db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(password), user.id);
db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
console.log(`✓ Senha de ${email} trocada. Já pode entrar no site com a nova senha.`);
