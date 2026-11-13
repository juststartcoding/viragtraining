import { Router } from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/auth.js';
import { asyncHandler, escapeRegex, HttpError } from './helpers.js';

const READONLY = ['_id', '__v', 'createdAt', 'updatedAt'];
const clean = (body = {}) => {
  const data = { ...body };
  READONLY.forEach((k) => delete data[k]);
  return data;
};

/**
 * Generic REST router for a content model.
 *  Public : GET /            (published only; ?featured=true&category=..&search=..&limit=..)
 *           GET /:idOrSlug
 *  Admin  : GET /admin/all, POST /, PUT /:id, DELETE /:id
 * `transform(item, { list })` (may be async) shapes public output, e.g. hides private links.
 */
export function crudRouter(Model, { searchFields = ['title'], filterFields = ['category'], sort = { order: 1, createdAt: -1 }, transform } = {}) {
  const router = Router();
  const hasSlug = !!Model.schema.path('slug');
  const shape = (items, list) => (transform ? Promise.all(items.map((i) => transform(i, { list }))) : items);

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const q = { published: true };
      for (const f of filterFields) {
        if (typeof req.query[f] === 'string' && req.query[f]) q[f] = req.query[f];
      }
      if (req.query.featured === 'true') q.featured = true;
      if (typeof req.query.search === 'string' && req.query.search.trim()) {
        const rx = new RegExp(escapeRegex(req.query.search.trim()), 'i');
        q.$or = searchFields.map((f) => ({ [f]: rx }));
      }
      const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
      const items = await Model.find(q).sort(sort).limit(limit).lean();
      res.json(await shape(items, true));
    })
  );

  router.get(
    '/admin/all',
    protect,
    asyncHandler(async (_req, res) => {
      res.json(await Model.find().sort(sort).lean());
    })
  );

  router.get(
    '/:key',
    asyncHandler(async (req, res) => {
      const { key } = req.params;
      const or = [];
      if (mongoose.isValidObjectId(key)) or.push({ _id: key });
      if (hasSlug) or.push({ slug: key });
      const item = or.length ? await Model.findOne({ $or: or, published: true }).lean() : null;
      if (!item) throw new HttpError(404, 'Not found');
      res.json((await shape([item], false))[0]);
    })
  );

  router.post(
    '/',
    protect,
    asyncHandler(async (req, res) => {
      res.status(201).json(await Model.create(clean(req.body)));
    })
  );

  router.put(
    '/:id',
    protect,
    asyncHandler(async (req, res) => {
      const item = await Model.findById(req.params.id);
      if (!item) throw new HttpError(404, 'Not found');
      item.set(clean(req.body));
      await item.save();
      res.json(item);
    })
  );

  router.delete(
    '/:id',
    protect,
    asyncHandler(async (req, res) => {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) throw new HttpError(404, 'Not found');
      res.json({ message: 'Deleted' });
    })
  );

  return router;
}
