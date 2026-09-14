require('dotenv').config();

const requiredEnvs = ['PORT', 'MONGO_URI', 'JWT_SECRET'];
const missingEnvs = requiredEnvs.filter(env => !process.env[env]);

if (missingEnvs.length > 0) {
  console.error(`[FATAL ERROR] Missing required environment variables: ${missingEnvs.join(', ')}`);
  process.exit(1);
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || 'development',
  customDnsServers: process.env.CUSTOM_DNS_SERVERS ? process.env.CUSTOM_DNS_SERVERS.split(',') : null
};
