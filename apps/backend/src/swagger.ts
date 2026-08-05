/**
 * Minimal, hand-authored OpenAPI 3 document. Kept lightweight (no build-time
 * jsdoc scanning) so it works identically in dev, Docker and serverless.
 */
export const openapiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Sharvi Collections API',
    version: '1.0.0',
    description: 'REST API for the Sharvi Collections jewellery e-commerce platform.',
  },
  servers: [{ url: '/api/v1' }],
  tags: [
    { name: 'System' },
    { name: 'Auth' },
    { name: 'Products' },
    { name: 'Categories' },
    { name: 'Orders' },
    { name: 'Uploads' },
    { name: 'Analytics' },
    { name: 'Consent' },
  ],
  components: {
    securitySchemes: {
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'sc_access' },
    },
    schemas: {
      ApiError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          priceMinor: { type: 'integer', description: 'Price in öre (349 kr = 34900)' },
          currency: { type: 'string', example: 'SEK' },
          badge: { type: 'string', enum: ['NONE', 'NEW', 'TRENDING', 'SALE'] },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: { tags: ['System'], summary: 'Health check', responses: { '200': { description: 'OK' } } },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Admin login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Logged in' }, '401': { description: 'Invalid credentials' } },
      },
    },
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'List published products',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'subcategory', in: 'query', schema: { type: 'string' } },
          {
            name: 'sort',
            in: 'query',
            schema: { type: 'string', enum: ['newest', 'price_asc', 'price_desc', 'alphabetical'] },
          },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Paginated products' } },
      },
      post: {
        tags: ['Products'],
        summary: '(Admin) Create a product',
        security: [{ cookieAuth: [] }],
        responses: { '201': { description: 'Created' }, '401': { description: 'Unauthorized' } },
      },
    },
    '/products/{slug}': {
      get: {
        tags: ['Products'],
        summary: 'Get a product by slug',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Product + related' }, '404': { description: 'Not found' } },
      },
    },
    '/categories': {
      get: { tags: ['Categories'], summary: 'Category taxonomy', responses: { '200': { description: 'OK' } } },
    },
    '/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Place an order',
        responses: { '201': { description: 'Order created' }, '400': { description: 'Validation error' } },
      },
    },
    '/analytics/dashboard': {
      get: {
        tags: ['Analytics'],
        summary: '(Admin) Dashboard data',
        security: [{ cookieAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
    },
  },
} as const;
