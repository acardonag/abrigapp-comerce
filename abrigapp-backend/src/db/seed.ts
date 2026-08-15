import { db } from './index';
import { categories } from './schema';

async function main() {
  console.log('Running seeder...');

  const initialCategories = [
    { name: 'Alimentos & Gastronomía', slug: 'alimentos-gastronomia' },
    { name: 'Ropa, Calzado & Moda', slug: 'ropa-calzado-moda' },
    { name: 'Artesanías & Decoración', slug: 'artesanias-decoracion' },
    { name: 'Salud & Belleza', slug: 'salud-belleza' },
    { name: 'Hogar & Muebles', slug: 'hogar-muebles' },
    { name: 'Tecnología & Accesorios', slug: 'tecnologia-accesorios' },
    { name: 'Servicios Profesionales', slug: 'servicios-profesionales' },
    { name: 'Construcción & Ferretería', slug: 'construccion-ferreteria' },
    { name: 'Mascotas & Veterinaria', slug: 'mascotas-veterinaria' },
    { name: 'Educación & Cursos', slug: 'educacion-cursos' },
    { name: 'Turismo & Recreación', slug: 'turismo-recreacion' },
    { name: 'Transporte & Logística', slug: 'transporte-logistica' },
    { name: 'Servicios & Reparaciones', slug: 'servicios-reparaciones' },
    { name: 'Abarrotes & Mercados', slug: 'abarrotes-mercados' },
    { name: 'Otros', slug: 'otros' },
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
