const { spawnSync } = require('child_process');

const models = [
  'attachment', 'broadcast', 'grade', 'principal',
  'School', 'section', 'staff', 'students', 'studioRoomBooking',
  'studioRooms', 'subject', 'submission', 'teachers',
  'teachersubjectsection', 'users'
];

for (const model of models) {
  console.log(`Generating resource ${model}...`);
  const res = spawnSync('bunx', ['nest', 'g', 'resource', model, '--no-spec'], {
    input: "\ny\n",
    stdio: ['pipe', 'inherit', 'inherit']
  });
  console.log(`${model} Done. Exit code:`, res.status);
}
