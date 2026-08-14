import { db } from './index';
import { categories } from './schema';

async function main() {
  console.log('Running seeder...');

  const initialCategories = [
    { name: 'Alimentos & Gastronomía', slug: 'alimentos-gastronomia' },
    { name: 'Ropa, Calzado & Moda', slug: 'ropa-calzado-moda' },
    { name: 'Artesanías & Decoración', slug: 'artesanias-decoracion' },
    { name: 'Servicios & Reparaciones', slug: 'servicios-reparaciones' },
    { name: 'Tecnología & Accesorios', slug: 'tecnologia-accesorios' },
    { name: 'Mascotas', slug: 'mascotas' },
    { name: 'Salud & Belleza', slug: 'salud-belleza' },
    { name: 'Abarrotes & Mercados', slug: 'abarrotes-mercados' },
  ];

  for (const cat of initialCategories) {
    await db.insert(categories).values(cat).onConflictDoNothing();
  }

  console.log('Seeder complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seeder failed!', err);
  process.exit(1);
});
