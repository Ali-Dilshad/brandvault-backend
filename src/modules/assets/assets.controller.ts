import { Router } from 'express';
import { validateBody, validateQuery } from '../../middleware/validate';
import {
  createAssetSchema,
  listAssetsQuerySchema,
  saveAiTagsSchema,
  updateAssetSchema,
} from './assets.schema';
import * as assetsService from './assets.service';

export const assetsRouter = Router();

assetsRouter.get('/', validateQuery(listAssetsQuerySchema), async (req, res) => {
  const query = (req as any).validatedQuery;
  const list = await assetsService.listAssets(req.user!.id, query);
  res.json(list);
});

assetsRouter.post('/', validateBody(createAssetSchema), async (req, res) => {
  const asset = await assetsService.createAsset(req.user!.id, req.body);
  res.status(201).json(asset);
});

assetsRouter.patch<{ id: string }>('/:id', validateBody(updateAssetSchema), async (req, res) => {
  const asset = await assetsService.updateAsset(req.user!.id, req.params.id, req.body);
  res.json(asset);
});

assetsRouter.delete('/:id', async (req, res) => {
  await assetsService.deleteAssetForever(req.user!.id, req.params.id);
  res.status(204).send();
});

assetsRouter.post('/:id/trash', async (req, res) => {
  const asset = await assetsService.trashAsset(req.user!.id, req.params.id);
  res.json(asset);
});

assetsRouter.post('/:id/restore', async (req, res) => {
  const asset = await assetsService.restoreAsset(req.user!.id, req.params.id, req.user!.email);
  res.json(asset);
});

assetsRouter.post('/:id/ai-tags', async (req, res) => {
  const suggestion = await assetsService.generateAiTags(req.user!.id, req.params.id);
  res.json(suggestion);
});

assetsRouter.patch<{ id: string }>('/:id/ai-tags/save', validateBody(saveAiTagsSchema), async (req, res) => {
  const asset = await assetsService.saveAiTags(req.user!.id, req.params.id, req.body, req.user!.email);
  res.json(asset);
});
