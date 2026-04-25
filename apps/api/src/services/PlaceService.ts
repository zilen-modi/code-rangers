import { PrismaClient, PlaceType } from '@prisma/client';
import { getAIAdapter, AIProvider } from '@repo/ai-adapter';

const prisma = new PrismaClient();

const PROVIDER = (process.env.TRANSLATION_PROVIDER || 'openai') as AIProvider;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const adapter = getAIAdapter(PROVIDER, {
  apiKey: OPENAI_API_KEY || undefined,
  defaultModel: PROVIDER === 'openai' ? 'gpt-4o' : 'llama3:8b', // Adjust ollama model if needed
});

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return Math.round(R * c * 10) / 10; // Distance in km
}

export class PlaceService {
  async getAllPlaces(filters?: { lat?: number, lng?: number, type?: PlaceType, dish?: string }) {
    
    // 1. Fetch from DB
    const whereClause: any = {};
    if (filters?.type) {
      whereClause.type = filters.type;
    }

    let places = await prisma.place.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { reviews: true }
        }
      }
    });

    // Compute average ratings manually strictly over returned reviews (Optimization: could be a manual query or DB side if needed)
    // For now we'll decorate with distance & average rating
    const placesWithAggregates = await Promise.all(places.map(async (p: any) => {
      const allReviews = await prisma.review.findMany({ where: { placeId: p.id }, select: { rating: true }});
      const avgRating = allReviews.length > 0 ? (allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length) : 0;
      
      let distance = null;
      if (filters?.lat && filters?.lng && p.lat && p.lng) {
        distance = getDistance(filters.lat, filters.lng, p.lat, p.lng);
      }

      return {
        ...p,
        rating: Math.round(avgRating * 10) / 10,
        distance,
        reviewCount: p._count.reviews
      };
    }));

    // 2. Sort by distance
    if (filters?.lat && filters?.lng) {
      placesWithAggregates.sort((a: any, b: any) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }

    // 3. AI Filtering for Dish
    if (filters?.dish && placesWithAggregates.length > 0) {
      const placesPayload = placesWithAggregates.map((p: any) => ({
        id: p.id,
        name: p.name,
        type: p.type
      }));

      const prompt = `
      You are a culinary expert. I am passing you a requested dish: "${filters.dish}".
      Below is a list of places (ID and Name). Based on common knowledge of these places, determine which places are highly recommended for the requested dish.
      
      Input Places:
      ${JSON.stringify(placesPayload)}

      Return ONLY a JSON array of the recommended place IDs (integers). Do not include any explanations or markdown. If none, return [].
      Example output: [1, 5, 12]
      `;

      try {
        const result = await adapter.generateText({ prompt, maxTokens: 500, temperature: 0.1 });
        let text = result.text.trim();
        if (text.startsWith('```json')) text = text.replace(/^```json/, '').replace(/```$/, '').trim();
        else if (text.startsWith('```')) text = text.replace(/^```/, '').replace(/```$/, '').trim();
        
        const recommendedIds: number[] = JSON.parse(text);
        
        if (Array.isArray(recommendedIds)) {
          return placesWithAggregates.filter((p: any) => recommendedIds.includes(p.id));
        }
      } catch (err) {
        console.error("Failed to filter places via AI", err);
        // Fallback to unstructured search on title or simply no filter fallback. For safety, return all if AI fails.
      }
    }

    return placesWithAggregates;
  }

  async getPlaceById(id: number) {
    const place = await prisma.place.findUnique({
      where: { id },
      include: { reviews: { orderBy: { helpfulCount: 'desc' }} } // Include reviews!
    });

    if (place) {
       // Append average rating dynamic aggregate
       const avgRating = place.reviews.length > 0 ? (place.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / place.reviews.length) : 0;
       return {
          ...place,
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: place.reviews.length
       };
    }
    return null;
  }

  async createPlace(data: any) {
    return prisma.place.create({ data });
  }

  async updatePlace(id: number, data: any) {
    return prisma.place.update({ where: { id }, data });
  }

  async deletePlace(id: number) {
    return prisma.place.delete({ where: { id } });
  }

  // REVIEWS
  async createReview(placeId: number, data: { reviewerName: string, reviewerType: string, rating: number, comment: string }) {
    return prisma.review.create({
      data: {
        ...data,
        placeId,
      }
    });
  }
}

export const placeService = new PlaceService();
