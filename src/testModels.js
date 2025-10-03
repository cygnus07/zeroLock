import User from './models/User.js';
import SrpSession from './models/SrpSession.js';
import SecurityLog from './models/SecurityLog.js';
import { authSchemas, validate } from './utils/validators.js';
import { checkConnection, closePool } from './utils/database.js';

const testModels = async () => {
  try {
    // Check database connection
    await checkConnection();
    console.log('✅ Database connected');

    // Test validation
    const testData = {
      email: 'test@example.com',
      username: 'testuser123',
    };
    
    const validated = validate(authSchemas.registerInit, testData);
    console.log('✅ Validation working:', validated);

    // Test User model
    const emailExists = await User.checkEmailExists('test@example.com');
    console.log('✅ User model working, email exists:', emailExists);

    // Test getting total users
    const totalUsers = await User.getTotalCount();
    console.log('✅ Total users in database:', totalUsers);

    // Test SecurityLog
    await SecurityLog.log({
      action: SecurityLog.ACTIONS.LOGIN_ATTEMPT,
      success: true,
      details: { test: true },
    });
    console.log('✅ Security logging working');

    // Test SrpSession cleanup
    const cleaned = await SrpSession.cleanupExpired();
    console.log('✅ SRP session cleanup working, cleaned:', cleaned);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await closePool();
  }
};

// Run if called directly
if (process.argv[1].endsWith('testModels.js')) {
  testModels();
}