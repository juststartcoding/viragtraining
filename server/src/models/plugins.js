import { slugify } from '../utils/helpers.js';

/** Common content fields: publish toggle, featured flag, manual sort order, timestamps */
export function contentPlugin(schema) {
  schema.add({
    published: { type: Boolean, default: true, index: true },
    featured: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0 },
  });
  schema.set('timestamps', true);
}

/** Unique URL slug generated from `from` field when empty; kept stable on later title edits */
export function slugPlugin(schema, { from = 'title' } = {}) {
  schema.add({ slug: { type: String, unique: true, index: true } });
  schema.pre('validate', async function () {
    if (this.slug && !this.isNew && !this.isModified('slug')) return;
    const base = slugify(this.slug || this[from]) || 'item';
    let candidate = base;
    let i = 1;
    while (await this.constructor.exists({ slug: candidate, _id: { $ne: this._id } })) {
      candidate = `${base}-${i++}`;
    }
    this.slug = candidate;
  });
}
