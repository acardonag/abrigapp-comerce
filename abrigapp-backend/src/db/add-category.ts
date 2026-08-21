import { db } from './index';
import { categories } from './schema';

async function main() {
  console.log('Adding Hoteles category...');

  await db.insert(categories).values({
    name: 'Hoteles',
    slug: 'hoteles'
  }).onConflictDoNothing();

  console.log('Category added successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to add category!', err);
  process.exit(1);
});
