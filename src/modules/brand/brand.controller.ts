import { Router } from 'express';
import { validateBody } from '../../middleware/validate';
import { createBrandSchema, updateBrandSchema } from './brand.schema';
import * as brandService from './brand.service';

export const brandRouter = Router();

brandRouter.get('/', async (req, res) => {
  const brand = await brandService.getBrand(req.user!.id);
  res.json(brand);
});

brandRouter.post('/', validateBody(createBrandSchema), async (req, res) => {
  const brand = await brandService.createBrand(req.user!.id, req.body);
  res.status(201).json(brand);
});

brandRouter.patch('/', validateBody(updateBrandSchema), async (req, res) => {
  const brand = await brandService.updateBrand(req.user!.id, req.body, req.user!.email);
  res.json(brand);
});
