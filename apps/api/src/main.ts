import * as http from 'node:http';
import { URL } from 'node:url';
import { ProductsService } from './lib/products.service';
import { ApiResponse, Product, ProductFilter, PaginatedResponse } from '@org/models';

const host = process.env['HOST'] ?? 'localhost';
const port = process.env['PORT'] ? Number(process.env['PORT']) : 3333;

const productsService = new ProductsService();

function corsHeaders(): http.OutgoingHttpHeaders {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
  };
}

function sendJson(
  res: http.ServerResponse,
  status: number,
  body: unknown,
  extraHeaders?: http.OutgoingHttpHeaders
): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    ...corsHeaders(),
    ...extraHeaders,
  });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders());
    res.end();
    return;
  }

  const requestUrl = req.url ?? '/';
  const url = new URL(requestUrl, `http://${req.headers['host'] ?? `${host}:${port}`}`);
  const pathname = url.pathname.replace(/\/$/, '') || '/';

  if (req.method === 'GET' && pathname === '/') {
    sendJson(res, 200, { message: 'Hello API' });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/products-metadata/categories') {
    try {
      const categories = productsService.getCategories();
      const response: ApiResponse<string[]> = { data: categories, success: true };
      sendJson(res, 200, response);
    } catch (error) {
      const response: ApiResponse<null> = {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      sendJson(res, 500, response);
    }
    return;
  }

  if (req.method === 'GET' && pathname === '/api/products-metadata/price-range') {
    try {
      const priceRange = productsService.getPriceRange();
      const response: ApiResponse<{ min: number; max: number }> = {
        data: priceRange,
        success: true,
      };
      sendJson(res, 200, response);
    } catch (error) {
      const response: ApiResponse<null> = {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      sendJson(res, 500, response);
    }
    return;
  }

  if (req.method === 'GET' && pathname === '/api/products') {
    try {
      const filter: ProductFilter = {};
      const q = url.searchParams;

      const category = q.get('category');
      if (category) filter.category = category;

      const minPrice = q.get('minPrice');
      if (minPrice) filter.minPrice = Number(minPrice);

      const maxPrice = q.get('maxPrice');
      if (maxPrice) filter.maxPrice = Number(maxPrice);

      if (q.has('inStock')) {
        filter.inStock = q.get('inStock') === 'true';
      }

      const searchTerm = q.get('searchTerm');
      if (searchTerm) filter.searchTerm = searchTerm;

      const page = q.get('page') ? Number(q.get('page')) : 1;
      const pageSize = q.get('pageSize') ? Number(q.get('pageSize')) : 12;

      const result = productsService.getAllProducts(filter, page, pageSize);
      const response: ApiResponse<PaginatedResponse<Product>> = {
        data: result,
        success: true,
      };
      sendJson(res, 200, response);
    } catch (error) {
      const response: ApiResponse<null> = {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      sendJson(res, 500, response);
    }
    return;
  }

  const productsPrefix = '/api/products/';
  if (req.method === 'GET' && pathname.startsWith(productsPrefix)) {
    const id = pathname.slice(productsPrefix.length);
    if (!id || id.includes('/')) {
      sendJson(res, 404, { data: null, success: false, error: 'Not found' });
      return;
    }
    try {
      const product = productsService.getProductById(id);
      if (!product) {
        const response: ApiResponse<null> = {
          data: null,
          success: false,
          error: 'Product not found',
        };
        sendJson(res, 404, response);
        return;
      }
      const response: ApiResponse<Product> = { data: product, success: true };
      sendJson(res, 200, response);
    } catch (error) {
      const response: ApiResponse<null> = {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      sendJson(res, 500, response);
    }
    return;
  }

  sendJson(res, 404, { data: null, success: false, error: 'Not found' });
});

server.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
