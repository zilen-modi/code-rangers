import { PrismaClient, PlaceType } from '@prisma/client';

const prisma = new PrismaClient();

export class PlaceService {
  async getAllPlaces() {
    return prisma.place.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async getPlaceById(id: number) {
    return prisma.place.findUnique({
      where: { id }
    });
  }

  async createPlace(data: { type: PlaceType; name: string; address: string; images: string[] }) {
    return prisma.place.create({
      data
    });
  }

  async updatePlace(id: number, data: Partial<{ type: PlaceType; name: string; address: string; images: string[] }>) {
    return prisma.place.update({
      where: { id },
      data
    });
  }

  async deletePlace(id: number) {
    return prisma.place.delete({
      where: { id }
    });
  }
}

export const placeService = new PlaceService();
