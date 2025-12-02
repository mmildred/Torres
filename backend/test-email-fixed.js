import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '.env');

dotenv.config({ path: envPath });

import { sendWelcomeEmail } from './src/utils/emailService.js';

async function testEmail() {
  try {
    const result = await sendWelcomeEmail('gerardo8.manzano@gmail.com', 'Gerardo Test');
    return result;
  } catch (error) {
    
    if (error.code === 'EAUTH') {
    }
    throw error;
  }
}

testEmail();
