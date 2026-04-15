const express = require('express');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Load movie data
let movies = [];
try {
  const data = fs.readFileSync('data/latest_movies.json', 'utf8');
  movies = JSON.parse(data);
} catch (error) {
  console.error('Error loading movie data:', error);
  process.exit(1);
}

// Build graph
function buildGraph(movies) {
  const graph = new Map();
  movies.forEach(movie => {
    const movieId = movie.id.toString();
    if (!graph.has(movieId)) graph.set(movieId, []);
    movie.cast.forEach(actor => {
      if (!graph.has(actor)) graph.set(actor, []);
      graph.get(movieId).push(actor);
      graph.get(actor).push(movieId);
    });
  });
  return graph;
}

const graph = buildGraph(movies);

// BFS functions
function bfsShortestPath(graph, start, goal) {
  const queue = [[start, [start]]];
  const visited = new Set([start]);
  while (queue.length > 0) {
    const [current, path] = queue.shift();
    if (current === goal) return path;
    for (const neighbor of graph.get(current) || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, [...path, neighbor]]);
      }
    }
  }
  return null;
}

function bfsLevels(graph, start, maxLevel = 8) {
  const levels = new Map();
  const visited = new Set();
  const queue = [[start, [start], 0]];
  visited.add(start);
  while (queue.length > 0) {
    const [current, path, level] = queue.shift();
    if (level > maxLevel) continue;
    if (!levels.has(level)) levels.set(level, []);
    levels.get(level).push([current, path]);
    if (level < maxLevel) {
      for (const neighbor of graph.get(current) || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([neighbor, [...path, neighbor], level + 1]);
        }
      }
    }
  }
  return levels;
}

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Movie-Actor Graph API',
      version: '1.0.0',
      description: 'API for graph operations on movie-actor network',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./server.js'], // files containing annotations
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
/**
 * @swagger
 * /shortest-path:
 *   post:
 *     summary: Find shortest path between two actors
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               actor1:
 *                 type: string
 *               actor2:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shortest path found
 *       400:
 *         description: Bad request
 */
app.post('/shortest-path', (req, res) => {
  const { actor1, actor2 } = req.body;
  if (!actor1 || !actor2) {
    return res.status(400).json({ error: 'actor1 and actor2 are required' });
  }
  const path = bfsShortestPath(graph, actor1, actor2);
  if (path) {
    const distance = path.length - 1;
    res.json({ distance, path });
  } else {
    res.json({ message: 'No path found' });
  }
});

/**
 * @swagger
 * /levels:
 *   post:
 *     summary: Get levels up to maxLevel from a starting actor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startActor:
 *                 type: string
 *               maxLevel:
 *                 type: integer
 *                 default: 8
 *     responses:
 *       200:
 *         description: Levels found
 *       400:
 *         description: Bad request
 */
app.post('/levels', (req, res) => {
  const { startActor, maxLevel = 8 } = req.body;
  if (!startActor) {
    return res.status(400).json({ error: 'startActor is required' });
  }
  const levels = bfsLevels(graph, startActor, maxLevel);
  const result = {};
  for (const [level, nodes] of levels) {
    result[level] = nodes.map(([node, path]) => ({ node, path }));
  }
  res.json(result);
});

/**
 * @swagger
 * /actors:
 *   get:
 *     summary: Get list of all actors
 *     responses:
 *       200:
 *         description: List of actors
 */
app.get('/actors', (req, res) => {
  const actors = [...new Set(movies.flatMap(movie => movie.cast))].sort();
  res.json({ actors });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
});