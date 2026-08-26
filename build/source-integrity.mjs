import { existsSync, readFileSync } from 'node:fs';

const required = [
  'src/core/config.js','src/core/state.js','src/core/events.js','src/core/router.js','src/core/app.js',
  'src/lib/utils.js','src/lib/supabase.js','src/lib/cloudinary.js',
  'src/services/auth.service.js','src/services/profile.service.js','src/services/social.service.js','src/services/task.service.js','src/services/competition.service.js','src/services/registration.service.js','src/services/attempt.service.js','src/services/leaderboard.service.js','src/services/award.service.js','src/services/notification.service.js','src/services/order.service.js','src/services/store.service.js','src/services/admin.service.js','src/services/controlplane.service.js',
  'src/components/Toast.js','src/components/Modal.js','src/components/Skeleton.js','src/components/EmptyState.js','src/components/CompetitionCard.js','src/components/Header.js','src/components/Sidebar.js','src/components/BottomNav.js',
  'src/pages/Home.js','src/pages/Tasks.js','src/pages/Notifications.js','src/pages/Lomba.js','src/pages/Competition.js','src/pages/Registration.js','src/pages/Attempt.js','src/pages/Profile.js','src/pages/Leaderboard.js','src/pages/Awards.js','src/pages/Orders.js','src/pages/Store.js','src/pages/Verify.js','src/pages/Admin.js','src/pages/Organizer.js','src/pages/Placeholder.js',
  'src/sykabelajar-v2/bootstrap.js','src/sykabelajar-v2/runtime/v2-runtime.js','src/sykabelajar-v2/integration/syka-app-bridge.js','src/sykabelajar-v2/takeover.js','src/sykabelajar-v2/bolt-ui.js','src/sykabelajar-v2/bolt-home.js','src/sykabelajar-v2/bolt-polish.js','src/sykabelajar-v2/ui-final-polish.js','src/sykabelajar-v2/ui-component-polish.js','src/sykabelajar-v2/ui-modal-polish.js'
];

const missing = required.filter(file => !existsSync(file));
if (missing.length) throw new Error(`Required production source files are missing: ${missing.join(', ')}`);

for (const file of ['src/services/profile.service.js','src/services/admin.service.js']) {
  const source = readFileSync(file, 'utf8').replace(/\s+/g, ' ');
  const chunks = [...source.matchAll(/from\(\s*['"]user_roles['"]\s*\)([^;]{0,320})/gi)].map(m => m[1]);
  if (chunks.some(chunk => /select\(\s*['"][^'"]*roles\s*\(\s*name\s*\)[^'"]*['"]\s*\)/i.test(chunk))) {
    throw new Error(`Invalid user_roles -> roles relationship query found in ${file}`);
  }
}

console.log(`Source integrity passed: ${required.length} production source files present and backend role queries clean.`);