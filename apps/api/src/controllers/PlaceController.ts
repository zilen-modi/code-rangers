import { Request, Response, NextFunction } from 'express';
import { placeService } from '../services/PlaceService';
import { PlaceType } from '@prisma/client';

export class PlaceController {
  
  static async getPlaces(req: Request, res: Response, next: NextFunction) {
    try {
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
      const type = req.query.type as PlaceType | undefined;
      const dish = req.query.dish as string | undefined;

      const places = await placeService.getAllPlaces({ lat, lng, type, dish });
      res.json({ message: 'Places fetched successfully', data: places });
    } catch (err) {
      next(err);
    }
  }

  static async getPlaceById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) {
         res.status(400).json({ message: 'Invalid ID' });
         return;
      }
      const place = await placeService.getPlaceById(id);
      if (!place) {
         res.status(404).json({ message: 'Place not found' });
         return;
      }
      res.json({ message: 'Place retrieved', data: place });
    } catch (err) {
      next(err);
    }
  }
  
  static async addReview(req: Request, res: Response, next: NextFunction) {
    try {
      const placeId = parseInt(req.params.id as string, 10);
      if (isNaN(placeId)) {
         res.status(400).json({ message: 'Invalid place ID' });
         return;
      }

      const { reviewerName, reviewerType, rating, comment } = req.body;
      if (!reviewerName || !reviewerType || typeof rating !== 'number' || !comment) {
         res.status(400).json({ message: 'reviewerName, reviewerType, rating (number), and comment are required' });
         return;
      }

      const review = await placeService.createReview(placeId, { reviewerName, reviewerType, rating, comment });
      res.status(201).json({ message: 'Review added successfully', data: review });
    } catch (err) {
      next(err);
    }
  }

  static async createPlace(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, address, type, lat, lng, priceLevel, openingHours } = req.body;
      if (!name || !address || !type) {
         res.status(400).json({ message: 'name, address, and type are required' });
         return;
      }

      const files = req.files as Express.Multer.File[];
      const imagePaths: string[] = files ? files.map(file => file.filename) : [];

      const place = await placeService.createPlace({
        name,
        address,
        type: type as PlaceType,
        images: imagePaths,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        priceLevel,
        openingHours
      });

      res.status(201).json({ message: 'Place created successfully', data: place });
    } catch (err) {
      next(err);
    }
  }

  static async updatePlace(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) {
         res.status(400).json({ message: 'Invalid ID' });
         return;
      }
      
      const { name, address, type, lat, lng, priceLevel, openingHours } = req.body;
      const updateData: any = {};
      
      if (name) updateData.name = name;
      if (address) updateData.address = address;
      if (type) updateData.type = type as PlaceType;
      if (lat !== undefined) updateData.lat = parseFloat(lat);
      if (lng !== undefined) updateData.lng = parseFloat(lng);
      if (priceLevel !== undefined) updateData.priceLevel = priceLevel;
      if (openingHours !== undefined) updateData.openingHours = openingHours;

      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        updateData.images = files.map(file => file.filename);
      }

      const place = await placeService.updatePlace(id, updateData);
      res.json({ message: 'Place updated successfully', data: place });
    } catch (err) {
      next(err);
    }
  }

  static async deletePlace(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) {
         res.status(400).json({ message: 'Invalid ID' });
         return;
      }
      await placeService.deletePlace(id);
      res.json({ message: 'Place deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}
