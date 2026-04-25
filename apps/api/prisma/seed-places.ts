import { PrismaClient, PlaceType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding places...');

  // Opt to clear existing to prevent duplicates during testing
  await prisma.review.deleteMany({});
  await prisma.place.deleteMany({});

  const places = [
    {
      name: 'Taj Gateway Hotel',
      address: 'Athwalines, Surat, Gujarat 395007',
      type: PlaceType.HOTEL,
      images: ['taj_surat_1.jpg', 'taj_surat_2.jpg'],
      lat: 21.1718,
      lng: 72.8222,
      priceLevel: '$$$',
      openingHours: 'Open 24 hours',
      reviews: {
        create: [
          { reviewerName: 'Rohit S.', rating: 4.5, comment: 'Posh rooms and great view of the Tapi river.', reviewerType: 'Verified', helpfulCount: 15 },
          { reviewerName: 'Alice', rating: 3.8, comment: 'Good service but quite expensive.', reviewerType: 'Traveler', helpfulCount: 4 }
        ]
      }
    },
    {
      name: 'Courtyard by Marriott',
      address: 'Earth City, Sindhu Bhavan Road, Ahmedabad, Gujarat 380054',
      type: PlaceType.HOTEL,
      images: ['marriott_ahmedabad.jpg'],
      lat: 23.0381,
      lng: 72.5028,
      priceLevel: '$$$',
      openingHours: 'Open 24 hours',
      reviews: {
        create: [
          { reviewerName: 'Sanjay P.', rating: 4.8, comment: 'Excellent business hotel. The breakfast spread is phenomenal!', reviewerType: 'Local', helpfulCount: 30 }
        ]
      }
    },
    {
      name: 'Sasumaa Gujarati Thali',
      address: 'Ring Road, Surat, Gujarat 395002',
      type: PlaceType.RESTAURANT,
      images: ['sasumaa.jpg'],
      lat: 21.1938,
      lng: 72.8290,
      priceLevel: '$$',
      openingHours: '11:00 AM - 3:00 PM, 7:00 PM - 10:30 PM',
      reviews: {
        create: [
          { reviewerName: 'Mike R.', rating: 5.0, comment: 'Best authentic unlimited thali! Must visit if in Surat.', reviewerType: 'Traveler', helpfulCount: 20 },
          { reviewerName: 'Sarah M.', rating: 4.5, comment: 'So many dishes to eat. I was stuffed.', reviewerType: 'Verified', helpfulCount: 12 }
        ]
      }
    },
    {
      name: 'Agashiye',
      address: 'The House of MG, Bhadra, Ahmedabad, Gujarat 380001',
      type: PlaceType.RESTAURANT,
      images: ['agashiye.jpg', 'agashiye_2.jpg'],
      lat: 23.0255,
      lng: 72.5818,
      priceLevel: '$$$',
      openingHours: '12:00 PM - 3:30 PM, 7:00 PM - 11:00 PM',
      reviews: {
        create: [
          { reviewerName: 'Raj V.', rating: 4.9, comment: 'A luxury heritage dining experience!', reviewerType: 'Local', helpfulCount: 45 }
        ]
      }
    },
    {
      name: 'Grandma Secret Recipe',
      address: '12 Heritage Street, Ahmedabad',
      type: PlaceType.RESTAURANT,
      images: ['massaman_curry.jpg'],
      lat: 23.0270,
      lng: 72.5850,
      priceLevel: '$',
      openingHours: 'Open until 10 PM',
      reviews: {
        create: [
          { reviewerName: 'Somchai T.', rating: 4.8, comment: 'Amazing local flavor. Massaman curry was incredible!', reviewerType: 'Local', helpfulCount: 18 }
        ]
      }
    },
    {
      name: 'Jay Fai',
      address: 'Near Old Fort, Surat',
      type: PlaceType.RESTAURANT,
      images: ['crab_omelette.jpg'],
      lat: 21.1710,
      lng: 72.8220,
      priceLevel: '$$$',
      openingHours: '1:00 PM - 11:00 PM',
      reviews: {
        create: [
          { reviewerName: 'Sarah M.', rating: 5.0, comment: 'Absolutely amazing! The crab omelette was incredible. A bit pricey but worth it.', reviewerType: 'Traveler', helpfulCount: 24 }
        ]
      }
    }
  ];

  for (const place of places) {
    // using nested write
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
