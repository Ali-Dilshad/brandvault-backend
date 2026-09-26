import { Router } from 'express';
import { validateBody } from '../../middleware/validate';
import { createFolderSchema, updateFolderSchema } from './folders.schema';
import * as foldersService from './folders.service';

export const foldersRouter = Router();

foldersRouter.get('/', async (req, res) => {
  const folders = await foldersService.listFolders(req.user!.id);
  res.json(folders);
});

foldersRouter.post('/', validateBody(createFolderSchema), async (req, res) => {
  const folder = await foldersService.createFolder(req.user!.id, req.body);
  res.status(201).json(folder);
});

foldersRouter.patch<{ id: string }>('/:id', validateBody(updateFolderSchema), async (req, res) => {
  const folder = await foldersService.updateFolder(req.user!.id, req.params.id, req.body);
  res.json(folder);
});

foldersRouter.delete('/:id', async (req, res) => {
  await foldersService.deleteFolder(req.user!.id, req.params.id);
  res.status(204).send();
});
