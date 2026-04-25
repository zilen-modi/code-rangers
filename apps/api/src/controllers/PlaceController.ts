import { Request, Response, NextFunction } from 'express';
import { placeService } from '../services/PlaceService';
import { PlaceType } from '@prisma/client';

export class PlaceController {
  
  static async getPlaces(req: Request, res: Response, next: NextFunction) {
    try {
      const places = await placeService.getAllPlaces();
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

  static async createPlace(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, address, type } = req.body;
      if (!name || !address || !type) {
         res.status(400).json({ message: 'name, address, and type are required' });
         return;
      }
      if (type !== 'HOTEL' && type !== 'RESTAURANT') {
         res.status(400).json({ message: 'type must be HOTEL or RESTAURANT' });
         return;
      }

      // Handle image paths from multer
      const files = req.files as Express.Multer.File[];
      const imagePaths: string[] = files ? files.map(file => file.filename) : [];

      const place = await placeService.createPlace({
        name,
        address,
        type: type as PlaceType,
        images: imagePaths
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
      
      const { name, address, type } = req.body;
      const updateData: any = {};
      
      if (name) updateData.name = name;
      if (address) updateData.address = address;
      if (type) {
        if (type !== 'HOTEL' && type !== 'RESTAURANT') {
           res.status(400).json({ message: 'type must be HOTEL or RESTAURANT' });
           return;
        }
        updateData.type = type as PlaceType;
      }

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
