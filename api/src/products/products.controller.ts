import { Controller, Get, Inject, NotFoundException, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { and, asc, eq } from 'drizzle-orm';
import { DB, type Database } from '../database/database.module.js';
import { products, type Product } from '../database/schema.js';

/** Public shape: internal fields (timestamps, published flag) stay private. */
const toPublic = (p: Product) => ({
  id: p.id,
  sku: p.sku,
  name: p.name,
  category: p.category,
  description: p.description,
  features: p.features,
  variants: p.variants,
  image: p.image,
  flagship: p.flagship,
});

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** Live products in display order. */
  @Get()
  async list() {
    const rows = await this.db
      .select()
      .from(products)
      .where(eq(products.published, true))
      .orderBy(asc(products.sortOrder), asc(products.name));
    return rows.map(toPublic);
  }

  @Get(':id')
  async get(@Param('id', ParseUUIDPipe) id: string) {
    const [row] = await this.db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.published, true)))
      .limit(1);
    if (!row) throw new NotFoundException('Product not found');
    return toPublic(row);
  }
}
