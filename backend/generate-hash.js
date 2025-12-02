// generate-hash.js
import bcrypt from 'bcrypt';

const password = "Gera820904.";
const saltRounds = 12;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error("Error:", err);
    return;
  }
  console.log("Nuevo hash para 'Gera820904.':");
  console.log(hash);
  
  // Verifica que funcione
  bcrypt.compare(password, hash, (err, result) => {
    console.log("Verificación:", result);
  });
});
