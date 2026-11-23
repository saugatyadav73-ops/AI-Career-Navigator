/* Manual database backup: npm run backup   (writes backend/backups/career_navigator-<timestamp>.db, keeps BACKUP_KEEP newest) */
require("dotenv").config();
const { createBackup } = require("../modules/ops");
const b = createBackup();
console.log(`Backup created: ${b.name} (${b.sizeBytes} bytes)`);
process.exit(0);
