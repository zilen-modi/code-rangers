import { PrismaClient, PlaceType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding places...');

  // Optional: clear existing places
  await prisma.place.deleteMany({});

  const places = [
    {
      name: 'Taj Gateway Hotel',
      address: 'Athwalines, Surat, Gujarat 395007',
      type: PlaceType.HOTEL,
      images: ['taj_surat_1.jpg', 'taj_surat_2.jpg'],
    },
    {
      name: 'Courtyard by Marriott',
      address: 'Earth City, Sindhu Bhavan Road, Ahmedabad, Gujarat 380054',
      type: PlaceType.HOTEL,
      images: ['marriott_ahmedabad.jpg'],
    },
    {
      name: 'Sasumaa Gujarati Thali',
      address: 'Ring Road, Surat, Gujarat 395002',
      type: PlaceType.RESTAURANT,
      images: ['sasumaa.jpg'],
    },
    {
      name: 'Agashiye',
      address: 'The House of MG, Bhadra, Ahmedabad, Gujarat 380001',
      type: PlaceType.RESTAURANT,
      images: ['agashiye.jpg', 'agashiye_2.jpg'],
    }
  ];

  for (const place of places) {
    await prisma.place.create({
      data: place
    });
  }

  console.log('Seeded places successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
